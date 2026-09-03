import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };
type TranscriptSegment = { start: number; end: number; text: string };
type Clip = { start: number; end: number; title: string; hook: string; reason: string; url: string };

function cloudinaryConfig(): CloudinaryConfig | null {
  const value = process.env.CLOUDINARY_URL;
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'cloudinary:' || !url.hostname || !url.username || !url.password) return null;
    return { cloudName: url.hostname, apiKey: decodeURIComponent(url.username), apiSecret: decodeURIComponent(url.password) };
  } catch { return null; }
}

function signature(params: Record<string, string | number | boolean>, secret: string) {
  const value = Object.entries(params).filter(([, item]) => item !== undefined && item !== '').sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${key}=${item}`).join('&');
  return createHash('sha1').update(`${value}${secret}`).digest('hex');
}

function transcriptSegments(value: unknown): TranscriptSegment[] {
  const found: TranscriptSegment[] = [];
  const walk = (item: unknown) => {
    if (!item || typeof item !== 'object') return;
    if (Array.isArray(item)) { item.forEach(walk); return; }
    const record = item as Record<string, unknown>;
    const start = Number(record.start ?? record.start_time ?? record.offset);
    const end = Number(record.end ?? record.end_time ?? (Number.isFinite(start) ? start + Number(record.duration ?? 0) : NaN));
    const text = typeof record.text === 'string' ? record.text : typeof record.word === 'string' ? record.word : '';
    if (Number.isFinite(start) && Number.isFinite(end) && end > start && text) found.push({ start, end, text });
    Object.values(record).forEach(walk);
  };
  walk(value);
  const unique = new Map(found.map((segment) => [`${segment.start}-${segment.end}-${segment.text}`, segment]));
  return [...unique.values()].sort((a, b) => a.start - b.start);
}

function readJson(content: string) {
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('The AI did not return clip selections.');
  return JSON.parse(match[0]) as Omit<Clip, 'url'>[];
}

async function selectClips(segments: TranscriptSegment[], duration: number, publicId: string, cloudName: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured.');
  const model = process.env.VIDEO_CLIPPER_MODEL ?? process.env.OPENROUTER_MODEL ?? 'openai/gpt-5.6-luna';
  const transcript = segments.map(({ start, end, text }) => `[${start.toFixed(1)}-${end.toFixed(1)}] ${text}`).join('\n').slice(0, 120_000);
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, temperature: 0.35, max_tokens: 1800, messages: [
      { role: 'system', content: 'You are a short-form video editor. Select 3 to 10 genuinely compelling, non-overlapping moments based only on the timestamped transcript. Prefer strong hooks, useful insight, emotional turns, or clear stories. Return ONLY a JSON array. Each item must be {"start":number,"end":number,"title":string,"hook":string,"reason":string}. Clips should usually be 15-60 seconds, start/end must be within the video duration, and no invented timestamps.' },
      { role: 'user', content: `Video duration: ${duration} seconds\n\nTranscript:\n${transcript}` },
    ] }),
  });
  if (!response.ok) throw new Error('AI clip selection failed. Please try again.');
  const content = (await response.json())?.choices?.[0]?.message?.content;
  const candidates = readJson(typeof content === 'string' ? content : '');
  return candidates.filter((clip) => Number.isFinite(clip.start) && Number.isFinite(clip.end) && clip.end > clip.start && clip.start >= 0 && clip.end <= duration).slice(0, 10).map((clip) => ({ ...clip, start: Math.round(clip.start * 10) / 10, end: Math.round(clip.end * 10) / 10, url: `https://res.cloudinary.com/${cloudName}/video/upload/so_${clip.start.toFixed(1)},du_${Math.max(1, clip.end - clip.start).toFixed(1)}/${encodeURI(publicId)}.mp4` }));
}

export async function POST() {
  const config = cloudinaryConfig();
  if (!config) return NextResponse.json({ error: 'CLOUDINARY_URL is not configured.' }, { status: 500 });
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: 'video-clipper', auto_transcription: true, timestamp };
  return NextResponse.json({ cloudName: config.cloudName, apiKey: config.apiKey, timestamp, folder: params.folder, autoTranscription: true, signature: signature(params, config.apiSecret) });
}

export async function GET(request: NextRequest) {
  const config = cloudinaryConfig();
  const publicId = request.nextUrl.searchParams.get('publicId');
  const duration = Number(request.nextUrl.searchParams.get('duration'));
  if (!config) return NextResponse.json({ error: 'CLOUDINARY_URL is not configured.' }, { status: 500 });
  if (!publicId?.startsWith('video-clipper/') || !Number.isFinite(duration) || duration <= 0) return NextResponse.json({ error: 'Invalid video job.' }, { status: 400 });
  try {
    const transcriptUrl = `https://res.cloudinary.com/${config.cloudName}/raw/upload/${encodeURI(publicId)}.transcript`;
    const transcriptResponse = await fetch(transcriptUrl, { cache: 'no-store' });
    if (!transcriptResponse.ok) return NextResponse.json({ status: 'transcribing' }, { status: 202 });
    const segments = transcriptSegments(await transcriptResponse.json());
    if (!segments.length) return NextResponse.json({ error: 'The transcript did not include timestamps. Try a video with clear spoken audio.' }, { status: 422 });
    const clips = await selectClips(segments, duration, publicId, config.cloudName);
    if (!clips.length) return NextResponse.json({ error: 'AI could not find strong clip candidates in this video.' }, { status: 422 });
    return NextResponse.json({ status: 'complete', clips });
  } catch (error) {
    console.error('Video clip selection failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to select clips.' }, { status: 500 });
  }
}

'use client';

import Link from 'next/link';
import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Film,
  LoaderCircle,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import AdRails from '@/components/AdRails';

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const acceptedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];
const progressSteps = ['Uploading', 'Analyzing video', 'Finding best moments', 'Creating clips', 'Finished'];
type Clip = { start: number; end: number; title: string; hook: string; reason: string; url: string };

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

export default function VideoClipperPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clips, setClips] = useState<Clip[]>([]);

  const resetFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl('');
    setDuration(null);
    setError('');
    setActiveStep(null);
    setClips([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const selectFile = (selectedFile?: File) => {
    setError('');
    if (!selectedFile) return;
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(selectedFile.type) && !['mp4', 'mov', 'webm', 'mkv'].includes(extension ?? '')) {
      setError('Unsupported video format. Please use MP4, MOV, WebM, or MKV.');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('Video is too large. The maximum upload size is 500 MB.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setDuration(null);
    setActiveStep(null);
    setClips([]);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const generateClips = async () => {
    if (!file) return;
    setActiveStep(0);
    setIsProcessing(true);
    setError('');
    setClips([]);
    try {
      const signingResponse = await fetch('/api/video-clipper', { method: 'POST' });
      const signing = await signingResponse.json();
      if (!signingResponse.ok) throw new Error(signing.error || 'Unable to prepare the upload.');
      const upload = new FormData();
      upload.append('file', file);
      upload.append('api_key', signing.apiKey);
      upload.append('timestamp', String(signing.timestamp));
      upload.append('folder', signing.folder);
      upload.append('auto_transcription', String(signing.autoTranscription));
      upload.append('signature', signing.signature);
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signing.cloudName}/video/upload`, { method: 'POST', body: upload });
      const uploaded = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploaded.error?.message || 'Cloudinary could not upload the video.');
      setActiveStep(1);
      for (let attempt = 0; attempt < 60; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 5000));
        const analysisResponse = await fetch(`/api/video-clipper?publicId=${encodeURIComponent(uploaded.public_id)}&duration=${encodeURIComponent(String(uploaded.duration))}`, { cache: 'no-store' });
        if (analysisResponse.status === 202) continue;
        const analysis = await analysisResponse.json();
        if (!analysisResponse.ok) throw new Error(analysis.error || 'Unable to select the best moments.');
        setActiveStep(4);
        setClips(analysis.clips);
        return;
      }
      throw new Error('Transcription is taking longer than expected. Please try again in a few minutes.');
    } catch (caught) {
      setActiveStep(null);
      setError(caught instanceof Error ? caught.message : 'Unable to process the video.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0d12] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link href="/" className="flex items-center gap-3 transition hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-sm font-black text-black">X</div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">Visibility</p>
              <p className="text-xs font-medium text-zinc-500">AI video clipper</p>
            </div>
          </Link>
          <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-sky-400/40 hover:bg-sky-500/10">
            AI replies
          </Link>
        </header>

        <AdRails />

        <div className="mx-auto max-w-3xl py-8 sm:py-12 lg:max-w-[calc(100vw-500px)]">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0f131a] shadow-2xl shadow-black/20">
            <div className="border-b border-white/10 px-5 py-7 text-center sm:px-10">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
                <Film className="h-6 w-6" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Short-form, automatically</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Turn one video into 20 great clips</h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">Upload your video and let AI find the strongest moments for TikTok, Reels, and Shorts.</p>
            </div>

            <div className="p-5 sm:p-8">
              {!file ? (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                  className={`flex min-h-72 w-full flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center transition ${
                    isDragging ? 'border-sky-400 bg-sky-500/10' : 'border-white/15 bg-[#11151d] hover:border-sky-400/50 hover:bg-sky-500/5'
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500/15 text-sky-300"><Upload className="h-6 w-6" /></div>
                  <p className="mt-5 text-lg font-bold text-white">Drop your video here</p>
                  <p className="mt-2 text-sm text-zinc-500">or choose a file from your computer</p>
                  <span className="mt-5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black">Upload video</span>
                  <p className="mt-5 text-xs text-zinc-500">MP4, MOV, WebM, or MKV · up to 500 MB</p>
                </button>
              ) : (
                <div className="space-y-5">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#11151d] sm:flex">
                    <div className="aspect-video w-full bg-black sm:w-56 sm:shrink-0">
                      <video src={previewUrl} controls className="h-full w-full object-cover" onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><p className="truncate font-semibold text-white">{file.name}</p><p className="mt-1 text-sm text-zinc-500">Ready to analyze</p></div>
                        <button type="button" onClick={resetFile} className="rounded-full p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white" aria-label="Remove video"><X className="h-4 w-4" /></button>
                      </div>
                      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-5 text-sm text-zinc-400"><span>{formatBytes(file.size)}</span><span>{duration === null ? 'Loading duration…' : formatDuration(duration)}</span><span>{file.type || 'Video file'}</span></div>
                    </div>
                  </div>

                  {activeStep !== null ? (
                    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-sky-100"><LoaderCircle className="h-4 w-4 animate-spin text-sky-300" /> Processing your video</div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-5">
                        {progressSteps.map((step, index) => <div key={step} className={`rounded-xl px-3 py-2 text-center text-xs font-medium ${index < activeStep ? 'bg-emerald-500/15 text-emerald-200' : index === activeStep ? 'bg-sky-500 text-slate-950' : 'bg-white/5 text-zinc-500'}`}>{index < activeStep ? <CheckCircle2 className="mx-auto mb-1 h-3.5 w-3.5" /> : null}{step}</div>)}
                      </div>
                    </div>
                  ) : null}

                  {clips.length ? <div className="space-y-3"><p className="text-sm font-semibold text-white">AI-selected moments</p>{clips.map((clip, index) => <div key={`${clip.start}-${clip.end}`} className="rounded-2xl border border-white/10 bg-[#11151d] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-white">{index + 1}. {clip.title}</p><p className="mt-1 text-sm text-sky-200">{formatDuration(clip.start)}–{formatDuration(clip.end)} · {clip.hook}</p><p className="mt-2 text-sm text-zinc-400">{clip.reason}</p></div><a href={clip.url} target="_blank" rel="noreferrer" className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-sky-400">Open clip</a></div></div>)}</div> : null}

                  <button type="button" onClick={generateClips} disabled={isProcessing} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"><Sparkles className="h-4 w-4" />{isProcessing ? 'Creating clips…' : 'Generate 20 Clips'}</button>
                </div>
              )}
              <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => selectFile(event.target.files?.[0])} />
              {error ? <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500"><Clock3 className="h-3.5 w-3.5" />Analysis usually takes a few minutes for a full-length video.</div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Check,
  Copy,
  MessageSquareText,
  RefreshCw,
  Wand2,
} from 'lucide-react';
import AdRails from '@/components/AdRails';

const toneOptions = [
  { value: 'casual', label: 'Casual', accent: 'bg-sky-500/15 text-sky-200 border-sky-500/25' },
  { value: 'sharp', label: 'Sharp', accent: 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/25' },
  { value: 'warm', label: 'Warm', accent: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25' },
  { value: 'analytical', label: 'Analytical', accent: 'bg-amber-500/15 text-amber-200 border-amber-500/25' },
];

const categoryOptions = [
  { value: 'contrarian', label: 'Contrarian' },
  { value: 'insightful', label: 'Insightful' },
  { value: 'curious', label: 'Curious' },
  { value: 'relatable', label: 'Personal' },
  { value: 'skeptical', label: 'Skeptical' },
  { value: 'encouraging', label: 'Encouraging' },
];

const starterPosts = [
  'We just launched a new AI workflow for founders and it feels way more human than the usual SaaS tools.',
  'People keep saying AI is replacing creativity. I think it is just making sharper ideas easier to ship.',
  'Shipping one small thing every day beats waiting for the perfect launch. That is the real moat.',
];

function buildReply(post: string, tone: string, category: string) {
  const text = post.trim() || 'Your post goes here.';

  const toneOpeners: Record<string, string[]> = {
    casual: [
      'this is the part that usually gets missed.',
      'not bad, but the real issue is this.',
      'fair point — the deeper angle is this.',
    ],
    sharp: [
      'the obvious takeaway is too easy.',
      'the interesting part is usually the second-order effect.',
      'that sounds right, but it misses the real constraint.',
    ],
    warm: [
      'I like this because it gets to the part people skip.',
      'this is a useful frame for people actually building.',
      'good call — the real lesson is a bit less obvious.',
    ],
    analytical: [
      'the useful question is whether this holds up outside the happy path.',
      'the signal is interesting, but the bigger risk is this.',
      'it works in theory, but I wonder how it scales in practice.',
    ],
  };

  const categoryPatterns: Record<string, string[]> = {
    contrarian: [
      'Most people treat this like a distribution problem, but the product still has to earn the attention it gets.',
      'I think the real leverage is not the channel itself, but whether the product compounds once people show up.',
      'Distribution helps, but a weak product still collapses under its own weight.',
    ],
    insightful: [
      'The deeper lesson is that the real bottleneck is usually the mismatch between the platform and the behavior you are trying to create.',
      'The interesting part isn’t the launch itself — it’s the pattern that makes a lot of attempts fail for the same reason.',
      'The real takeaway is that most people optimize for attention, but the durable win is the system behind it.',
    ],
    curious: [
      'Now I’m curious whether this changes retention, or just makes the first interaction feel smoother.',
      'I wonder if the real gain is in the workflow, or just in the perception of the workflow.',
      'I’m interested in whether this holds up once the novelty wears off.',
    ],
    relatable: [
      'This is the part nobody talks about after shipping. Building the product is one milestone; getting people to actually use it is the real test.',
      'the hard part is not making the thing, it is making it feel worth the attention in a crowded feed.',
      'the launch is the easy part. the boring, repeated work of making it useful is where the real story starts.',
    ],
    skeptical: [
      'That sounds great at the acquisition stage, but I wonder how it holds up once the business needs predictable revenue.',
      'I like the framing, but the harder test is whether it still works when the team is trying to scale without chaos.',
      'it is a good story early on, but the real question is whether this still makes sense under pressure.',
    ],
    encouraging: [
      'The interesting part isn’t the growth number. It’s finding a model that is useful enough to keep improving and actually hold up over time.',
      'This is the kind of signal that matters more than the headline. The real win is building something people can trust and reuse.',
      'I like this because it focuses on the actual loop, not just the excitement around it.',
    ],
  };

  const opener = toneOpeners[tone]?.[Math.floor(Math.random() * toneOpeners[tone].length)] ?? toneOpeners.sharp[0];
  const pattern = categoryPatterns[category]?.[Math.floor(Math.random() * categoryPatterns[category].length)] ?? categoryPatterns.insightful[0];

  const originalText = text.length > 180 ? `${text.slice(0, 180).trim()}…` : text;

  return `${opener[0].toUpperCase() + opener.slice(1)} ${pattern} ${originalText} The real question is whether the value is obvious enough to keep people coming back.`;
}

export default function Home() {
  const [postText, setPostText] = useState(starterPosts[0]);
  const [tone, setTone] = useState('casual');
  const [category, setCategory] = useState('contrarian');
  const [reply, setReply] = useState('This is the part people miss. Most people treat this like a distribution problem, but the product still has to earn the attention it gets. We just launched a new AI workflow for founders and it feels way more human than the usual SaaS tools.');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [remainingGenerations, setRemainingGenerations] = useState<number | null>(null);

  const suggestions = useMemo(
    () => [
      'add a concrete example',
      'make it more contrarian',
      'ask one sharp question',
      'keep it tighter and more human',
    ],
    [],
  );

  const generateReply = async () => {
    setLoading(true);
    setError('');
    setCopied(false);

    try {
      const response = await fetch('/api/replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postText,
          tone,
          category,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to generate reply.');
      }

      const data = await response.json();
      setReply(data.reply || buildReply(postText, tone, category));
      if (typeof data.remainingGenerations === 'number') {
        setRemainingGenerations(data.remainingGenerations);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to generate reply.');
      setReply(buildReply(postText, tone, category));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const response = await fetch('/api/visitors', { method: 'POST' });
        const data = await response.json();
        if (typeof data.totalVisitors === 'number') {
          setVisitorCount(data.totalVisitors);
        }
      } catch (err) {
        console.error('Error fetching visitors:', err);
      }
    };

    fetchVisitors();
  }, []);

  useEffect(() => {
    const fetchRemainingGenerations = async () => {
      try {
        const response = await fetch('/api/replies');
        const data = await response.json();
        if (typeof data.remainingGenerations === 'number') {
          setRemainingGenerations(data.remainingGenerations);
        }
      } catch (err) {
        console.error('Error loading remaining generations:', err);
      }
    };

    fetchRemainingGenerations();
  }, []);

  return (
    <main className="min-h-screen bg-[#0b0d12] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-sm font-black text-black">
              X
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">Visibility</p>
              <p className="text-xs font-medium text-zinc-500">AI reply generator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-200">
              {visitorCount === null ? 'visitors…' : `${visitorCount.toLocaleString()} visitors`}
            </div>
            <div className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-200">
              {remainingGenerations === null ? 'daily replies…' : `${remainingGenerations}/50 replies left today`}
            </div>
            <button
              type="button"
              onClick={() => setPostText(starterPosts[Math.floor(Math.random() * starterPosts.length)])}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-sky-400/40 hover:bg-sky-500/10"
            >
              <RefreshCw className="h-4 w-4" />
              New prompt
            </button>
            <Link
              href="/video-clipper"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-sky-400/40 hover:bg-sky-500/10"
            >
              Video clipper
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/visibility-score"
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-sky-400/40 hover:bg-sky-500/10 xl:inline-flex"
            >
              Visibility score
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <AdRails />

        <div className="mx-auto max-w-5xl py-8 lg:max-w-[calc(100vw-500px)] sm:py-12">
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-white/4 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Input</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-white">AI Reply Generator</h2>
                </div>
                <button
                  type="button"
                  onClick={generateReply}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Wand2 className="h-4 w-4" />
                  Generate
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Original post</label>
                  <textarea
                    value={postText}
                    onChange={(event) => setPostText(event.target.value)}
                    rows={7}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-[#11151d] px-4 py-3 text-base text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-sky-400/60"
                    placeholder="Paste the tweet, post, or thread you want to reply to..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">Tone</label>
                    <div className="grid grid-cols-2 gap-2">
                      {toneOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTone(option.value)}
                          className={`rounded-full border px-1.5 py-0.5 text-xs font-medium transition ${
                            tone === option.value
                              ? option.accent
                              : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {categoryOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setCategory(option.value)}
                          className={`rounded-full border px-1.5 py-0.5 text-xs font-medium transition ${
                            category === option.value
                              ? 'border-sky-400/30 bg-sky-500/15 text-sky-100'
                              : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0f131a] p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Preview</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Reply Preview</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-sky-400/30 hover:bg-sky-500/10"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={generateReply}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#11151d] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-black text-white">
                      AI
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">AI assistant</p>
                      <p className="text-xs text-zinc-500">@replybot</p>
                    </div>
                  </div>

                  <span className="text-xs text-zinc-500">Now</span>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3 text-sm leading-7 text-zinc-100">
                    <MessageSquareText className="mb-2 h-4 w-4 text-sky-300" />
                    {loading ? 'Generating a reply…' : reply}
                  </div>

                  {error ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                      {error}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-end text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1 text-sky-300">
                      Post <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Suggested boosts</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setReply(`${reply} ${suggestion}.`)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:border-sky-400/30 hover:bg-sky-500/10"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

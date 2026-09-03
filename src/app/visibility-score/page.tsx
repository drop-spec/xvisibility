'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, Globe2, LoaderCircle, Search, Sparkles } from 'lucide-react';
import AdRails from '@/components/AdRails';

const steps = ['Analyzing website', 'Understanding brand', 'Discovering competitors', 'Generating AI searches', 'Querying AI models', 'Evaluating responses', 'Calculating visibility', 'Complete'];
type VisibilityReport = { score: number; metrics: string[][]; competitors: [string, number][]; citations: string[][]; responses: { query: string; response: string }[] };

export default function VisibilityScorePage() {
  const [website, setWebsite] = useState('');
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [report, setReport] = useState<VisibilityReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!isAnalyzing || activeStep === null || activeStep >= steps.length - 2) return;
    const timer = window.setTimeout(() => setActiveStep((step) => step === null ? null : step + 1), 650);
    return () => window.clearTimeout(timer);
  }, [activeStep, isAnalyzing]);

  const analyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const url = new URL(website.includes('://') ? website : `https://${website}`);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) throw new Error('Enter a valid public website URL, such as https://example.com.');
      setWebsite(url.toString()); setError(''); setReport(null); setActiveStep(0); setIsAnalyzing(true);
      const response = await fetch('/api/visibility', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ website: url.toString() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to create your visibility report.');
      setReport(data); setActiveStep(steps.length - 1);
    } catch (caught) {
      setActiveStep(null); setError(caught instanceof Error ? caught.message : 'Unable to create your visibility report.');
    } finally { setIsAnalyzing(false); }
  };

  return <main className="min-h-screen bg-[#0b0d12] text-white"><div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
    <header className="flex items-center justify-between border-b border-white/10 pb-4"><Link href="/" className="flex items-center gap-3 transition hover:opacity-80"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-sm font-black text-black">X</div><div><p className="text-lg font-bold tracking-tight text-white">Visibility</p><p className="text-xs font-medium text-zinc-500">AI visibility score</p></div></Link><div className="flex gap-2"><Link href="/" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200">AI replies</Link><Link href="/video-clipper" className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 sm:block">Video clipper</Link></div></header>
    <AdRails />
    <div className="mx-auto max-w-3xl py-8 sm:py-12 lg:max-w-[calc(100vw-500px)]"><section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0f131a] shadow-2xl shadow-black/20"><div className="border-b border-white/10 px-5 py-8 text-center sm:px-10"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300"><Sparkles className="h-6 w-6" /></div><p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">AI search intelligence</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">See how visible your brand is across AI search.</h1></div>
      <div className="p-5 sm:p-8"><form onSubmit={analyze} className="flex flex-col gap-3 sm:flex-row"><label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/10 bg-[#11151d] px-4 py-3 text-zinc-400 focus-within:border-sky-400/60"><Globe2 className="h-5 w-5 shrink-0 text-sky-300" /><input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://yourwebsite.com" inputMode="url" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" /></label><button type="submit" disabled={isAnalyzing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"><Search className="h-4 w-4" />Analyze</button></form>{error ? <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        {activeStep !== null ? <div className="mt-6 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 sm:p-5"><div className="flex items-center gap-2 text-sm font-semibold text-sky-100"><LoaderCircle className={`h-4 w-4 text-sky-300 ${report ? '' : 'animate-spin'}`} />{report ? 'Visibility report complete' : 'Building your visibility report'}</div><div className="mt-4 grid gap-2 sm:grid-cols-2">{steps.map((step, index) => <div key={step} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${index < activeStep || report ? 'bg-emerald-500/10 text-emerald-200' : index === activeStep ? 'bg-sky-500/15 text-sky-100' : 'bg-white/5 text-zinc-500'}`}>{index < activeStep || report ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0 rounded-full border border-current/50" />}{step}</div>)}</div></div> : null}
        {report ? <div className="mt-6 space-y-5"><div className="rounded-2xl border border-white/10 bg-[#11151d] p-5 text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">AI visibility score</p><div className="mt-3 text-6xl font-black tracking-tight text-sky-300">{report.score}<span className="text-2xl text-zinc-500">/100</span></div></div><div className="grid gap-3 sm:grid-cols-5">{report.metrics.map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center"><p className="text-lg font-bold text-white">{value}</p><p className="mt-1 text-xs leading-4 text-zinc-500">{label}</p></div>)}</div><div className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="font-semibold text-white">Visibility by brand</p>{report.competitors.map(([name, score]) => <div key={name} className="mt-4"><div className="mb-1 flex justify-between text-sm"><span className="text-zinc-300">{name}</span><span className="font-semibold text-white">{score}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-sky-400" style={{ width: `${score}%` }} /></div></div>)}</div><div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="font-semibold text-white">Where AI gets information</p>{report.citations.map(([site, share]) => <div key={site} className="mt-4 flex items-center justify-between text-sm"><span className="text-zinc-300">{site}</span><span className="font-semibold text-sky-200">{share}</span></div>)}</div></div><details className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-white">Questions and AI responses <ChevronDown className="h-4 w-4 text-zinc-400" /></summary><div className="mt-4 space-y-3 text-sm">{report.responses.map(({ query, response }) => <p key={query} className="rounded-xl bg-[#11151d] p-3 text-zinc-300">{query} <span className="ml-2 text-sky-300">{response}</span></p>)}</div></details></div> : null}
      </div></section></div>
  </div></main>;
}

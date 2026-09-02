'use client';

interface AdCardProps {
  icon?: string;
  name: string;
  tagline?: string;
  price?: string;
  cta?: string;
  isOpen?: boolean;
  url?: string;
}

export default function AdCard({ icon, name, tagline, price, cta, isOpen = false, url }: AdCardProps) {
  if (isOpen) {
    return (
      <div
        className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-dashed border-sky-500/40 bg-sky-500/5 px-4 py-3 text-center"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-300">Open slot</p>
        <p className="mt-2 text-lg font-black text-white">$1,000<span className="text-sm font-medium text-zinc-300">/month</span></p>
      </div>
    );
  }

  const content = (
    <div
      className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/8 to-white/3 px-3 py-2 text-center transition hover:border-sky-400/35 hover:bg-sky-500/8"
    >
      <div className="mb-1 shrink-0 text-2xl leading-none">{icon}</div>
      <p className="shrink-0 text-sm font-bold leading-5 text-white">{name}</p>
      {tagline ? (
        <p
          className="mt-1 min-h-8 text-xs font-semibold leading-4 text-white"
          style={{
            textShadow: '0 1px 12px rgba(56, 189, 248, 0.35)',
          }}
        >
          {tagline}
        </p>
      ) : null}
    </div>
  );

  if (!url) {
    return content;
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="block h-full no-underline">
      {content}
    </a>
  );
}

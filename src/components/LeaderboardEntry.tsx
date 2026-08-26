'use client';

import { ExternalLink, TrendingUp } from 'lucide-react';
import type { Bid } from '@/lib/supabase';
import { formatNumber } from '@/lib/format';
import posthog from 'posthog-js';

type LeaderboardEntryProps = {
  bid: Bid;
  rank: number;
};

export function LeaderboardEntry({ bid, rank }: LeaderboardEntryProps) {
  const isTop3 = rank <= 3;
  const isNumber1 = rank === 1;

  const handleClick = async () => {
    if (!bid.url) return;

    posthog.capture('leaderboard_link_visited', {
      rank,
      category: bid.category ?? 'uncategorized',
    });

    try {
      await fetch(`/api/bids/${bid.id}/click`, {
        method: 'POST',
      });
    } catch {
      // best-effort; still allow the redirect to continue
    }

    window.open(bid.url, '_blank', 'noopener,noreferrer');
  };

  const cardContent = (
    <>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
          isNumber1
            ? 'bg-amber-500/15 text-amber-400'
            : isTop3
              ? 'bg-zinc-700/50 text-zinc-200'
              : 'bg-zinc-800 text-zinc-500'
        }`}
      >
        {rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-semibold truncate ${
              isNumber1 ? 'text-white text-base' : 'text-zinc-200 text-sm'
            }`}
          >
            {bid.title}
          </span>
          {bid.category && (
            <span className="rounded-full border border-zinc-700 bg-zinc-800/50 px-2 py-0.5 text-[10px] font-medium text-zinc-400 whitespace-nowrap">
              {bid.category}
            </span>
          )}
        </div>
        {bid.description && (
          <p className="text-sm text-zinc-500 mt-0.5 line-clamp-1">{bid.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-zinc-600">{formatNumber(bid.clicks)} clicks</span>
        </div>
      </div>

      {bid.url && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900/80 text-zinc-400">
          <ExternalLink size={11} />
        </span>
      )}

      <div className="flex flex-col items-end shrink-0">
        {isNumber1 && (
          <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-500/70 mt-0.5">
            <TrendingUp size={10} />
            #1
          </span>
        )}
      </div>
    </>
  );

  const cardClasses = `group relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${
    isNumber1
      ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent hover:from-amber-500/10'
      : isTop3
        ? 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900'
        : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60'
  }`;

  if (bid.url) {
    return (
      <a
        href={bid.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        id={`ranking-entry-${bid.id}`}
        className={`${cardClasses} block`}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <div id={`ranking-entry-${bid.id}`} className={cardClasses}>
      {cardContent}
    </div>
  );
}

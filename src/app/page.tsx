'use client';

import { useEffect, useState, useRef } from 'react';
import { Trophy, Users, TrendingUp, Activity } from 'lucide-react';
import { type Bid } from '@/lib/supabase';
import { formatCurrency, formatNumber, timeAgo } from '@/lib/format';
import { LeaderboardEntry } from '@/components/LeaderboardEntry';
import { BidModal } from '@/components/BidModal';
import posthog from 'posthog-js';
import Link from 'next/link';

const PAGE_SIZE = 10;

export default function Home() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPool, setTotalPool] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [recentBids, setRecentBids] = useState<Bid[]>([]);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const recentDisplay = recentBids.slice(0, 5);
  const [visitorCount, setVisitorCount] = useState(1200000);
  const [onlineCount, setOnlineCount] = useState(500);

  const fetchBids = async () => {
    const res = await fetch(`/api/bids?page=1&pageSize=${PAGE_SIZE}`);
    const json = await res.json();
    if (res.ok) {
      setBids(json.bids || []);
      setTotalCount(json.count || 0);
      setTotalPool(json.totalPool || 0);
      setRecentBids(json.recent || []);
    } else {
      console.error('Error fetching bids:', json);
    }
    setLoading(false);
  };

  const fetchPage = async (pageNum: number) => {
    setLoading(true);
    const res = await fetch(`/api/bids?page=${pageNum}&pageSize=${PAGE_SIZE}`);
    const json = await res.json();
    if (res.ok) {
      setBids(json.bids || []);
      setTotalCount(json.count || 0);
    } else {
      console.error('Error fetching page:', json);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBids();
    // set volatile UI-only stats on client after mount to avoid hydration mismatches
    setVisitorCount(1200000 + Math.floor(Math.random() * 50000));
    setOnlineCount(500 + Math.floor(Math.random() * 200));
  }, []);

  useEffect(() => {
    if (page > 1) fetchPage(page);
    else if (page === 1 && bids.length > 0) fetchPage(1);
  }, [page]);

  // continuous marquee-style animation for recent activity (no manual scrolling needed)
  useEffect(() => {
    const track = trackRef.current;
    if (!track || recentBids.length === 0) return;

    // duplicate content width is used to loop seamlessly
    let pos = 0;
    const speed = 0.6; // pixels per frame (adjust for faster/slower)
    let raf = 0;

    const step = () => {
      pos += speed;
      const halfWidth = track.scrollWidth / 2;
      if (pos >= halfWidth) pos -= halfWidth;
      track.style.transform = `translateX(${-pos}px)`;
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [recentBids]);

  const topBid = bids.length > 0 ? bids[0].amount : 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleModalOpen = () => {
    posthog.capture('bid_modal_opened');
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    setPage(1);
    fetchBids();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">
              xvisibility<span className="text-zinc-500">.lol</span>
            </span>
          </Link>
          <button
            onClick={handleModalOpen}
            className="rounded-lg bg-white px-4 py-1.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors"
          >
            Claim a spot
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            The free leaderboard.
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Claim a spot, get visibility, and show up on the board without paying to play.
          </p>
        </div>

        {/* Spotlight */}
        {bids.length > 0 && !loading && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Top spot
            </h2>
            {bids[0].url ? (
              <a
                href={bids[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-900 p-6 transition-colors hover:border-amber-500/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-xl font-bold text-white truncate block">{bids[0].title}</span>
                    {bids[0].description && (
                      <p className="text-sm text-zinc-400 mt-1">{bids[0].description}</p>
                    )}
                    {bids[0].category && (
                      <span className="inline-block mt-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-2.5 py-0.5 text-xs font-medium text-amber-400/80">
                        {bids[0].category}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0 text-zinc-400">
                    <div className="text-xs uppercase tracking-[0.2em]">Open</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {formatNumber(bids[0].clicks)} clicks
                    </div>
                  </div>
                </div>
              </a>
            ) : (
              <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-900 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-xl font-bold text-white truncate block">{bids[0].title}</span>
                    {bids[0].description && (
                      <p className="text-sm text-zinc-400 mt-1">{bids[0].description}</p>
                    )}
                    {bids[0].category && (
                      <span className="inline-block mt-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-2.5 py-0.5 text-xs font-medium text-amber-400/80">
                        {bids[0].category}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0 text-zinc-400">
                    <div className="text-xs uppercase tracking-[0.2em]">Open</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {formatNumber(bids[0].clicks)} clicks
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Latest activity (horizontal carousel) */}
        {recentBids.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Latest activity
            </h2>

            <div className="relative">
              <div className="overflow-hidden">
                <div
                  ref={trackRef}
                  className="flex gap-3 py-2 items-center will-change-transform"
                  style={{ transform: 'translateX(0)' }}
                >
                  {[...recentDisplay, ...recentDisplay].map((bid, i) => {
                    const rank =
                      bids.findIndex((b) => b.id === bid.id) !== -1
                        ? bids.findIndex((b) => b.id === bid.id) + 1
                        : null;
                    return (
                      <Link
                        key={`${bid.id}-${i}`}
                        href={'/'}
                        className="min-w-[280px] shrink-0 rounded-lg border border-zinc-700 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors px-3 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <div className="text-zinc-300 font-medium truncate">{bid.title}</div>
                          <div className="text-zinc-600 text-sm mt-1 font-semibold">
                            {rank && <span className="text-zinc-400">#{rank} · </span>}
                            {formatCurrency(bid.amount)}
                          </div>
                          <div className="text-xs text-zinc-600 mt-1">{timeAgo(bid.created_at)}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Leaderboard
            </h2>
            {totalPages > 1 && (
              <span className="text-xs text-zinc-600">
                Page {page} of {totalPages}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl border border-zinc-800 bg-zinc-900/30 animate-pulse"
                />
              ))}
            </div>
          ) : bids.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
              <Trophy size={32} className="mx-auto text-zinc-700 mb-3" />
              <p className="text-zinc-400 font-medium">No spots claimed yet.</p>
              <p className="text-zinc-600 text-sm mt-1">Be the first to claim #1.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {bids.map((bid, index) => (
                  <LeaderboardEntry
                    key={bid.id}
                    bid={bid}
                    rank={(page - 1) * PAGE_SIZE + index + 1}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:border-zinc-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-white text-black'
                            : 'border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:border-zinc-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Want more visibility?</h3>
          <p className="text-zinc-400 mb-5 max-w-md mx-auto">
            Claim a spot on the leaderboard and get seen by everyone checking in.
          </p>
          <button
            onClick={handleModalOpen}
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors"
          >
            Claim your spot
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-zinc-900 pt-8 pb-12 text-center">
          <p className="text-sm text-zinc-600">
            A simple free leaderboard. Get on the board without paying to play.
          </p>
        </footer>
      </main>

      <BidModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        currentTopBid={topBid}
      />
    </div>
  );
}

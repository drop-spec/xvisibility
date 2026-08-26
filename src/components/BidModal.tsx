'use client';

import { useState, useEffect } from 'react';
// Minimal inline icon components to avoid external dependency on `lucide-react`
import React from 'react';

type IconProps = { size?: number; className?: string };

const X = ({ size = 20, className = '' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const TrendingUp = ({ size = 14, className = '' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <path d="M3 17l6-6 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 7h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Loader2 = ({ size = 16, className = '' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const Check = ({ size = 32, className = '' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import posthog from 'posthog-js';

type BidModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentTopBid: number;
};

const CATEGORIES = [
  'AI Agents & Infrastructure',
  'Developer Tools',
  'SEO & AI Visibility',
  'Crypto, Web3 & Investing',
  'Security, Privacy & Compliance',
  'Business, Finance & Legal',
  'Marketing & Advertising',
  'Health, Fitness & Wellness',
  'Design & Creative',
  'Domains & Web Assets',
  'Social Media & Creator Tools',
  'Agencies, Studios & Services',
  'Productivity & Personal Tools',
  'Writing & Content',
  'Ecommerce & Retail',
  'Other',
];

export function BidModal({ open, onClose, onSuccess, currentTopBid }: BidModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setUrl('');
      setCategory(CATEGORIES[0]);
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  if (!open) return null;

  const enteredCents = currentTopBid;

  const handleSubmit = async () => {
    setError(null);

    if (!title.trim()) {
      setError('Enter a name for your spot.');
      return;
    }

    let cleanUrl = url.trim();
    if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          url: cleanUrl || null,
          category: category,
          amount: enteredCents,
        }),
      });

      const json = await res.json();
      setLoading(false);

      if (!res.ok) {
        console.error('Server insert error:', json);
        const msg = json?.error || 'Something went wrong. Try again.';
        setError(msg);
        return;
      }
    } catch (err: any) {
      setLoading(false);
      console.error('Network/Server error inserting bid:', err);
      setError(err?.message || 'Something went wrong. Try again.');
      return;
    }

    posthog.capture('bid_submitted', {
      category,
      bid_amount_cents: enteredCents,
    });
    setSuccess(true);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Claim your spot</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <Check size={32} className="text-green-400" />
            </div>
            <p className="text-xl font-semibold text-white">You&apos;re on the board!</p>
            <p className="text-sm text-zinc-400 mt-1">Your spot is live on the leaderboard.</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Username</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. @yourname"
                maxLength={60}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Description <span className="text-zinc-600">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="One sentence about what you're doing."
                maxLength={180}
                rows={2}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                URL <span className="text-zinc-600"></span>
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://x.com/yourname"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-zinc-500 focus:outline-none transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                'Claim spot'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

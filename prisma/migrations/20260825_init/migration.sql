-- Migration: init
-- This migration was created to record the current schema state for Prisma Migrate.
-- The database already has these tables; this SQL will not be applied when marking the migration as applied.

CREATE TABLE IF NOT EXISTS public.bids (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    url text,
    category text,
    amount integer NOT NULL,
    clicks integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "bids_amount_idx" ON public.bids (amount DESC);
CREATE INDEX IF NOT EXISTS "bids_created_at_idx" ON public.bids (created_at DESC);

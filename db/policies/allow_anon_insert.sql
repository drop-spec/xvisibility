-- Permissive INSERT policy (for testing only)
ALTER TABLE IF EXISTS public.bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_insert_bids ON public.bids;

CREATE POLICY anon_insert_bids
  ON public.bids
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Note: This allows unauthenticated clients to insert rows. Use only for testing.

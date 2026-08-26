-- Recommended: public SELECT + authenticated INSERT
ALTER TABLE IF EXISTS public.bids ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS anon_select_bids ON public.bids;
CREATE POLICY anon_select_bids
  ON public.bids
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated insert
DROP POLICY IF EXISTS anon_insert_bids ON public.bids;
CREATE POLICY auth_insert_bids
  ON public.bids
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Optional: owner-based update/delete (requires `owner uuid` column)
-- ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS owner uuid;
-- DROP POLICY IF EXISTS anon_update_bids ON public.bids;
-- CREATE POLICY owner_update_bids
--   ON public.bids
--   FOR UPDATE
--   TO authenticated
--   USING (owner = auth.uid())
--   WITH CHECK (owner = auth.uid());

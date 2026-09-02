ALTER TABLE public.reply_generation_limits
ADD COLUMN IF NOT EXISTS usage_date date NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE public.reply_generation_limits
DROP CONSTRAINT IF EXISTS reply_generation_limits_pkey;

ALTER TABLE public.reply_generation_limits
ADD CONSTRAINT reply_generation_limits_pkey PRIMARY KEY (ip_hash, usage_date);

CREATE OR REPLACE FUNCTION public.consume_reply_generation(
    p_ip_hash text,
    p_limit integer DEFAULT 50
)
RETURNS TABLE(allowed boolean, remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
BEGIN
    INSERT INTO public.reply_generation_limits (ip_hash, usage_date, generation_count)
    VALUES (p_ip_hash, CURRENT_DATE, 1)
    ON CONFLICT (ip_hash, usage_date) DO UPDATE
    SET generation_count = reply_generation_limits.generation_count + 1,
        updated_at = now()
    WHERE reply_generation_limits.generation_count < p_limit
    RETURNING generation_count INTO v_count;

    IF v_count IS NULL THEN
        RETURN QUERY SELECT false, 0;
    ELSE
        RETURN QUERY SELECT true, p_limit - v_count;
    END IF;
END;
$$;

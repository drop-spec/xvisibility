CREATE TABLE IF NOT EXISTS public.reply_generation_limits (
    ip_hash text PRIMARY KEY,
    generation_count integer NOT NULL DEFAULT 0 CHECK (generation_count >= 0),
    updated_at timestamptz NOT NULL DEFAULT now()
);

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
    INSERT INTO public.reply_generation_limits (ip_hash, generation_count)
    VALUES (p_ip_hash, 1)
    ON CONFLICT (ip_hash) DO UPDATE
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

GRANT EXECUTE ON FUNCTION public.consume_reply_generation(text, integer) TO service_role;

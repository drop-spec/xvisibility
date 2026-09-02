CREATE OR REPLACE FUNCTION public.get_remaining_reply_generations(
    p_ip_hash text,
    p_limit integer DEFAULT 50
)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT GREATEST(
        p_limit - COALESCE((
            SELECT generation_count
            FROM public.reply_generation_limits
            WHERE ip_hash = p_ip_hash
              AND usage_date = CURRENT_DATE
        ), 0),
        0
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_remaining_reply_generations(text, integer) TO service_role;

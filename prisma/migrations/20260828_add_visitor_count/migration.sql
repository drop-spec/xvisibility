CREATE TABLE IF NOT EXISTS public.visitor_stats (
    id smallint PRIMARY KEY CHECK (id = 1),
    total_visitors bigint NOT NULL DEFAULT 0
);

INSERT INTO public.visitor_stats (id, total_visitors)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.increment_visitor_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE public.visitor_stats
    SET total_visitors = total_visitors + 1
    WHERE id = 1
    RETURNING total_visitors;
$$;
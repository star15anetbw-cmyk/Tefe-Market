-- Tracking de origem de trafego para links impressos e campanhas.
-- Exemplo: https://www.tefemarket.com.br/?origem=cartaoA4

CREATE TABLE IF NOT EXISTS public.traffic_events (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT now(),
    origem TEXT NOT NULL,
    session_id TEXT,
    path TEXT,
    user_agent TEXT,
    referrer TEXT
);

CREATE INDEX IF NOT EXISTS idx_traffic_events_created_at
ON public.traffic_events(created_at);

CREATE INDEX IF NOT EXISTS idx_traffic_events_origem
ON public.traffic_events(origem);

ALTER TABLE public.traffic_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "traffic_events_insert_anon" ON public.traffic_events;
CREATE POLICY "traffic_events_insert_anon"
ON public.traffic_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "traffic_events_select_admin" ON public.traffic_events;
CREATE POLICY "traffic_events_select_admin"
ON public.traffic_events
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

GRANT INSERT ON public.traffic_events TO anon, authenticated;
GRANT SELECT ON public.traffic_events TO authenticated;
GRANT SELECT ON public.traffic_events TO service_role;

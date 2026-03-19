-- ---------------------------------------------------------------------------
-- Enable REPLICA IDENTITY FULL on approval_requests so Supabase Realtime
-- can deliver full row data for INSERT/UPDATE/DELETE events through RLS
-- filters (e.g. org_id=eq.<uuid>). Without this, INSERT events only
-- include the primary key, which prevents the realtime filter from matching.
-- ---------------------------------------------------------------------------

ALTER TABLE approval_requests REPLICA IDENTITY FULL;

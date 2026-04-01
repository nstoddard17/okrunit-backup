-- Grant SELECT on in_app_notifications to supabase_realtime_admin.
-- Without this, the Realtime server cannot evaluate RLS policies
-- and INSERT events are silently dropped.

GRANT SELECT ON in_app_notifications TO supabase_realtime_admin;

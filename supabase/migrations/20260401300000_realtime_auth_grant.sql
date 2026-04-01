-- Grant USAGE on auth schema and EXECUTE on auth.uid()/auth.role() to
-- supabase_realtime_admin. Without this, RLS policies that use auth.uid()
-- evaluate to NULL in the realtime context, causing all events to be dropped.

GRANT USAGE ON SCHEMA auth TO supabase_realtime_admin;
GRANT EXECUTE ON FUNCTION auth.uid() TO supabase_realtime_admin;
GRANT EXECUTE ON FUNCTION auth.role() TO supabase_realtime_admin;

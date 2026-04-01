-- Grant SELECT on realtime-enabled tables to supabase_realtime_admin.
-- Without this, the Realtime server cannot evaluate RLS policies to
-- determine which subscribers should receive change events.

GRANT SELECT ON approval_requests TO supabase_realtime_admin;
GRANT SELECT ON approval_comments TO supabase_realtime_admin;
GRANT SELECT ON approval_votes TO supabase_realtime_admin;

-- Also required: tables used by auth_org_id() inside RLS policies.
-- Without this, INSERT events fail RLS evaluation because the
-- realtime system can't resolve the user's org_id.
GRANT SELECT ON org_memberships TO supabase_realtime_admin;

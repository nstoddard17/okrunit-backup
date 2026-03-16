-- Migration: Add created_by, role-based approval, and sequential chain support
-- ============================================================================

-- 1. created_by: structured JSONB about who/what created the request
--    API key: {"type":"api_key","connection_id":"uuid","connection_name":"My Zapier"}
--    OAuth:   {"type":"oauth","client_id":"abc","client_name":"Zapier OAuth"}
ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS created_by JSONB DEFAULT NULL;

-- 2. required_role: when set, only users with this role (or higher) can approve
ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS required_role TEXT DEFAULT NULL
  CHECK (required_role IS NULL OR required_role IN ('owner', 'admin', 'member'));

-- 3. is_sequential: when true, assigned_approvers is an ordered chain
--    Only the current approver in sequence can vote; next is notified after each vote.
ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS is_sequential BOOLEAN NOT NULL DEFAULT false;

-- 4. Approval flow defaults for the new fields
ALTER TABLE approval_flows
  ADD COLUMN IF NOT EXISTS approver_mode TEXT NOT NULL DEFAULT 'any'
  CHECK (approver_mode IN ('any', 'designated', 'role_based'));

ALTER TABLE approval_flows
  ADD COLUMN IF NOT EXISTS required_role TEXT DEFAULT NULL
  CHECK (required_role IS NULL OR required_role IN ('owner', 'admin', 'member'));

ALTER TABLE approval_flows
  ADD COLUMN IF NOT EXISTS is_sequential BOOLEAN NOT NULL DEFAULT false;

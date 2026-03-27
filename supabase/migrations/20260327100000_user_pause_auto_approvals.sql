-- Add a per-user flag to pause all auto-approvals within their org membership.
-- When enabled, the trust engine and rules engine skip auto-approve for requests
-- where this user is the relevant actor (or globally for the org membership).

ALTER TABLE org_memberships
  ADD COLUMN IF NOT EXISTS auto_approvals_paused boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN org_memberships.auto_approvals_paused
  IS 'When true, all auto-approval rules and trust thresholds are bypassed for this membership context. Acts as a personal kill switch.';

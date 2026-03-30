-- ---------------------------------------------------------------------------
-- Add is_log flag to approval_requests.
-- When true, the request is an activity log entry (no decision needed).
-- Status is auto-set to 'approved' and approve/reject buttons are hidden.
-- ---------------------------------------------------------------------------

ALTER TABLE approval_requests
  ADD COLUMN is_log BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN approval_requests.is_log IS
  'When true, this is an activity log entry, not an actionable approval request.';

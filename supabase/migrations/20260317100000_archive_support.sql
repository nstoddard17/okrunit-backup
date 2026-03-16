-- ---------------------------------------------------------------------------
-- Migration: Archive support for approval requests
-- ---------------------------------------------------------------------------

ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Partial index: speeds up the default "show non-archived" query
CREATE INDEX IF NOT EXISTS idx_approval_requests_archived
  ON approval_requests (org_id, archived_at)
  WHERE archived_at IS NULL;

-- ---------------------------------------------------------------------------
-- Notification Routing: per-request channel targeting + connection routing rules
-- ---------------------------------------------------------------------------

-- Per-request notification routing: allows callers to target specific
-- messaging connections when creating an approval request.
ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS notify_channel_ids UUID[] DEFAULT NULL;

-- Routing rules on messaging connections: allows admins to configure which
-- approvals a connection should receive notifications for.
-- Format: { "sources": ["api", "zapier"], "action_types": ["deploy*"], "priorities": ["high", "critical"] }
-- Empty object = receive everything (backward compatible with current behavior).
ALTER TABLE messaging_connections
  ADD COLUMN IF NOT EXISTS routing_rules JSONB DEFAULT '{}';

-- Index for efficient lookup when filtering by notify_channel_ids
-- (GIN index on the array column for @> containment queries if needed)
CREATE INDEX IF NOT EXISTS idx_approval_requests_notify_channel_ids
  ON approval_requests USING GIN (notify_channel_ids)
  WHERE notify_channel_ids IS NOT NULL;

-- ---------------------------------------------------------------------------
-- OKrunit -- Performance Indexes
-- ---------------------------------------------------------------------------
-- Adds composite indexes for common query patterns to reduce query latency.
-- ---------------------------------------------------------------------------

-- Covers the most common dashboard query: list approvals by org + status
-- sorted by created_at DESC. Previously fell back to the less optimal
-- idx_approval_requests_org_status index.
CREATE INDEX IF NOT EXISTS idx_approval_requests_org_status_created
  ON approval_requests(org_id, status, created_at DESC);

-- Covers billing/subscription usage count: active connections per org.
-- Partial index only includes active rows for faster counting.
CREATE INDEX IF NOT EXISTS idx_connections_org_active
  ON connections(org_id) WHERE is_active = true;

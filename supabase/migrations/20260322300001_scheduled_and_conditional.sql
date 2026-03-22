-- ---------------------------------------------------------------------------
-- Phase 16: Scheduled Approvals & Conditional Approvals
-- ---------------------------------------------------------------------------

-- ---- Scheduled Approvals --------------------------------------------------

ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS scheduled_execution_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS execution_status TEXT DEFAULT 'immediate'
    CHECK (execution_status IN ('immediate', 'scheduled', 'executed', 'cancelled'));

-- ---- Conditional Approvals ------------------------------------------------

ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS conditions_met BOOLEAN DEFAULT true;

-- Track individual condition checks
CREATE TABLE IF NOT EXISTS approval_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- Check method
  check_type TEXT NOT NULL CHECK (check_type IN ('webhook', 'manual')),
  webhook_url TEXT, -- URL to call for webhook checks
  -- State
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'met', 'failed')),
  checked_at TIMESTAMPTZ,
  check_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, name)
);

ALTER TABLE approval_conditions ENABLE ROW LEVEL SECURITY;

-- RLS: org-scoped access via approval_requests join
CREATE POLICY "approval_conditions_org_access" ON approval_conditions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM approval_requests ar
      WHERE ar.id = approval_conditions.request_id
        AND ar.org_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')::uuid
    )
  );

-- Index for fast lookups by request_id
CREATE INDEX IF NOT EXISTS idx_approval_conditions_request_id
  ON approval_conditions(request_id);

-- Index for scheduled execution lookups
CREATE INDEX IF NOT EXISTS idx_approval_requests_scheduled_execution
  ON approval_requests(execution_status, scheduled_execution_at)
  WHERE execution_status = 'scheduled';

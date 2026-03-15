-- ============================================================================
-- Migration: Approval Flows
-- Adds approval_flows table for per-source configuration.
-- When a request arrives from Zapier/Make/n8n with a source + source_id,
-- the API looks up the matching flow and applies its saved defaults
-- (priority, expiration, approvers, etc.).
-- ============================================================================

-- ============================================================
-- 1. APPROVAL FLOWS TABLE
-- ============================================================

CREATE TABLE approval_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identifies the external source (e.g. "zapier", "make", "n8n", "api")
  source TEXT NOT NULL,

  -- Stable identifier from the external platform (e.g. Zap ID, scenario ID)
  source_id TEXT NOT NULL,

  -- User-editable display name (defaults to source + source_id until renamed)
  name TEXT NOT NULL DEFAULT '',

  -- Whether the user has customized this flow in the dashboard
  is_configured BOOLEAN NOT NULL DEFAULT false,

  -- Default settings applied to every request from this flow
  default_priority TEXT CHECK (default_priority IN ('low', 'medium', 'high', 'critical')),
  default_expiration_hours INTEGER CHECK (default_expiration_hours > 0),
  default_required_approvals INTEGER CHECK (default_required_approvals BETWEEN 1 AND 10),
  default_action_type TEXT,

  -- Routing defaults
  assigned_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  assigned_approvers UUID[] DEFAULT NULL,

  -- Stats
  request_count INTEGER NOT NULL DEFAULT 0,
  last_request_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One flow per source + source_id per org
  UNIQUE (org_id, source, source_id)
);

-- ============================================================
-- 2. LINK APPROVAL REQUESTS TO FLOWS
-- ============================================================

ALTER TABLE approval_requests
  ADD COLUMN flow_id UUID REFERENCES approval_flows(id) ON DELETE SET NULL;

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX idx_approval_flows_org_id ON approval_flows(org_id);
CREATE INDEX idx_approval_flows_source ON approval_flows(org_id, source, source_id);
CREATE INDEX idx_approval_requests_flow_id ON approval_requests(flow_id) WHERE flow_id IS NOT NULL;

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

CREATE TRIGGER set_updated_at BEFORE UPDATE ON approval_flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE approval_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org flows" ON approval_flows
  FOR SELECT USING (org_id = auth_org_id());

CREATE POLICY "Admins can create flows" ON approval_flows
  FOR INSERT WITH CHECK (org_id = auth_org_id());

CREATE POLICY "Admins can update org flows" ON approval_flows
  FOR UPDATE USING (org_id = auth_org_id())
  WITH CHECK (org_id = auth_org_id());

CREATE POLICY "Admins can delete org flows" ON approval_flows
  FOR DELETE USING (org_id = auth_org_id());

-- ============================================================
-- 6. REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE approval_flows;

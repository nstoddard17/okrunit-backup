-- ============================================================================
-- Migration: Webhook Tester
-- Adds tables for the Webhook Tester feature: test endpoints (with unique
-- tokens for public capture URLs) and captured test requests.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: webhook_test_endpoints
-- Stores one active test URL token per org. Tokens are random, rotatable,
-- and map to an org_id for request capture.
-- ----------------------------------------------------------------------------

CREATE TABLE webhook_test_endpoints (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_test_endpoints_org_id ON webhook_test_endpoints(org_id);
CREATE INDEX idx_webhook_test_endpoints_token ON webhook_test_endpoints(token);

CREATE TRIGGER set_webhook_test_endpoints_updated_at
  BEFORE UPDATE ON webhook_test_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE webhook_test_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org test endpoints" ON webhook_test_endpoints
  FOR SELECT USING (org_id = auth_org_id());

CREATE POLICY "Admins can insert test endpoints" ON webhook_test_endpoints
  FOR INSERT WITH CHECK (org_id = auth_org_id());

CREATE POLICY "Admins can update test endpoints" ON webhook_test_endpoints
  FOR UPDATE USING (org_id = auth_org_id())
  WITH CHECK (org_id = auth_org_id());

CREATE POLICY "Admins can delete test endpoints" ON webhook_test_endpoints
  FOR DELETE USING (org_id = auth_org_id());

-- ----------------------------------------------------------------------------
-- TABLE: webhook_test_requests
-- Captures every HTTP request that hits a test endpoint.
-- ----------------------------------------------------------------------------

CREATE TABLE webhook_test_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id     UUID NOT NULL REFERENCES webhook_test_endpoints(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  method          TEXT NOT NULL,
  url             TEXT NOT NULL,
  query_params    JSONB NOT NULL DEFAULT '{}',
  headers         JSONB NOT NULL DEFAULT '{}',
  body            TEXT,
  body_json       JSONB,
  content_type    TEXT,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_test_requests_endpoint_id ON webhook_test_requests(endpoint_id);
CREATE INDEX idx_webhook_test_requests_org_id ON webhook_test_requests(org_id);
CREATE INDEX idx_webhook_test_requests_created_at ON webhook_test_requests(created_at DESC);

-- RLS
ALTER TABLE webhook_test_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org test requests" ON webhook_test_requests
  FOR SELECT USING (org_id = auth_org_id());

-- Inserts are done via service-role from the API route (no user session).

CREATE POLICY "Admins can delete test requests" ON webhook_test_requests
  FOR DELETE USING (org_id = auth_org_id());

-- ----------------------------------------------------------------------------
-- REALTIME: Enable for new tables + audit_log
-- ----------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE webhook_test_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_log;

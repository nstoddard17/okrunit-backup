-- Gatekeeper: Initial Schema Migration
-- All tables, enums, triggers, RLS policies, indexes, and realtime config

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'expired');
CREATE TYPE approval_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- ============================================================
-- TABLES
-- ============================================================

-- Organizations (multi-tenant)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emergency_stop_active BOOLEAN NOT NULL DEFAULT false,
  emergency_stop_activated_at TIMESTAMPTZ,
  emergency_stop_activated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Profiles (linked to auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Connections (API keys for external callers)
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  api_key_hash TEXT NOT NULL,
  api_key_prefix TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 100,
  allowed_action_types TEXT[] DEFAULT NULL,
  max_priority approval_priority DEFAULT NULL,
  scoping_rules JSONB DEFAULT NULL,
  last_used_at TIMESTAMPTZ,
  rotated_at TIMESTAMPTZ,
  previous_key_hash TEXT,
  previous_key_expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Approval Requests (core entity)
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  action_type TEXT,
  priority approval_priority NOT NULL DEFAULT 'medium',
  status approval_status NOT NULL DEFAULT 'pending',
  callback_url TEXT,
  callback_headers JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  context_html TEXT,
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,
  decision_comment TEXT,
  decision_source TEXT CHECK (decision_source IN ('dashboard', 'email', 'slack', 'push', 'api', 'auto_rule', 'batch')),
  expires_at TIMESTAMPTZ,
  idempotency_key TEXT,
  required_approvals INTEGER NOT NULL DEFAULT 1,
  current_approvals INTEGER NOT NULL DEFAULT 0,
  auto_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (connection_id, idempotency_key)
);

-- Organization Invites
CREATE TABLE org_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Log (immutable)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  connection_id UUID REFERENCES connections(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Push Subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notification Settings (per user)
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  slack_enabled BOOLEAN NOT NULL DEFAULT false,
  slack_webhook_url TEXT,
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone TEXT DEFAULT 'UTC',
  minimum_priority approval_priority NOT NULL DEFAULT 'low',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email Action Tokens (single-use, for one-click email approve/reject)
CREATE TABLE email_action_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
  token TEXT NOT NULL UNIQUE,
  consumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Approval Comments
CREATE TABLE approval_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  connection_id UUID REFERENCES connections(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Webhook Delivery Log
CREATE TABLE webhook_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  request_headers JSONB DEFAULT '{}',
  request_body JSONB DEFAULT '{}',
  response_status INTEGER,
  response_headers JSONB,
  response_body TEXT,
  duration_ms INTEGER,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Approval Rules (auto-approve / routing)
CREATE TABLE approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES connections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority_order INTEGER NOT NULL DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '{}',
  action TEXT NOT NULL DEFAULT 'auto_approve' CHECK (action IN ('auto_approve', 'route')),
  action_config JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Approval Votes (multi-approver)
CREATE TABLE approval_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject')),
  comment TEXT,
  source TEXT CHECK (source IN ('dashboard', 'email', 'slack', 'push', 'api')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, user_id)
);

-- Saved Filters
CREATE TABLE saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Approval Attachments
CREATE TABLE approval_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  connection_id UUID REFERENCES connections(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON approval_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON approval_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON approval_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON saved_filters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER: handle_new_user (auto-provision org + profile)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invite_record RECORD;
  new_org_id UUID;
BEGIN
  -- Check if user was invited to an existing org
  SELECT * INTO invite_record
  FROM org_invites
  WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF invite_record IS NOT NULL THEN
    -- Join existing org via invite
    INSERT INTO user_profiles (id, org_id, email, full_name, role)
    VALUES (
      NEW.id,
      invite_record.org_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      invite_record.role
    );

    -- Mark invite as accepted
    UPDATE org_invites SET accepted_at = now() WHERE id = invite_record.id;
  ELSE
    -- Create new org for this user
    INSERT INTO organizations (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Organization')
    RETURNING id INTO new_org_id;

    INSERT INTO user_profiles (id, org_id, email, full_name, role)
    VALUES (
      NEW.id,
      new_org_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'owner'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_action_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_attachments ENABLE ROW LEVEL SECURITY;

-- Helper: get user's org_id
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations: users can view/update their own org
CREATE POLICY "Users can view own org" ON organizations
  FOR SELECT USING (id = auth_org_id());
CREATE POLICY "Admins can update own org" ON organizations
  FOR UPDATE USING (id = auth_org_id())
  WITH CHECK (id = auth_org_id());

-- User Profiles: users can view org members, update own profile
CREATE POLICY "Users can view org members" ON user_profiles
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Connections: org-scoped CRUD
CREATE POLICY "Users can view org connections" ON connections
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "Admins can create connections" ON connections
  FOR INSERT WITH CHECK (org_id = auth_org_id());
CREATE POLICY "Admins can update org connections" ON connections
  FOR UPDATE USING (org_id = auth_org_id())
  WITH CHECK (org_id = auth_org_id());
CREATE POLICY "Admins can delete org connections" ON connections
  FOR DELETE USING (org_id = auth_org_id());

-- Approval Requests: org-scoped
CREATE POLICY "Users can view org approvals" ON approval_requests
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "Users can update org approvals" ON approval_requests
  FOR UPDATE USING (org_id = auth_org_id())
  WITH CHECK (org_id = auth_org_id());
-- Insert is done via service role (API key auth), no RLS insert policy for session users needed
-- but allow session users to cancel their own
CREATE POLICY "Service role can insert approvals" ON approval_requests
  FOR INSERT WITH CHECK (org_id = auth_org_id());

-- Org Invites: org-scoped
CREATE POLICY "Users can view org invites" ON org_invites
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "Admins can create invites" ON org_invites
  FOR INSERT WITH CHECK (org_id = auth_org_id());
CREATE POLICY "Admins can delete invites" ON org_invites
  FOR DELETE USING (org_id = auth_org_id());

-- Audit Log: org-scoped read-only
CREATE POLICY "Users can view org audit log" ON audit_log
  FOR SELECT USING (org_id = auth_org_id());

-- Push Subscriptions: user-scoped
CREATE POLICY "Users can view own subscriptions" ON push_subscriptions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own subscriptions" ON push_subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- Notification Settings: user-scoped
CREATE POLICY "Users can view own settings" ON notification_settings
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can upsert own settings" ON notification_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own settings" ON notification_settings
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Email Action Tokens: user-scoped read
CREATE POLICY "Users can view own tokens" ON email_action_tokens
  FOR SELECT USING (user_id = auth.uid());

-- Approval Comments: org-scoped via request
CREATE POLICY "Users can view org comments" ON approval_comments
  FOR SELECT USING (
    request_id IN (SELECT id FROM approval_requests WHERE org_id = auth_org_id())
  );
CREATE POLICY "Users can create comments" ON approval_comments
  FOR INSERT WITH CHECK (
    request_id IN (SELECT id FROM approval_requests WHERE org_id = auth_org_id())
  );

-- Webhook Delivery Log: org-scoped via connection
CREATE POLICY "Users can view org webhook logs" ON webhook_delivery_log
  FOR SELECT USING (
    connection_id IN (SELECT id FROM connections WHERE org_id = auth_org_id())
  );

-- Approval Rules: org-scoped
CREATE POLICY "Users can view org rules" ON approval_rules
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "Admins can create rules" ON approval_rules
  FOR INSERT WITH CHECK (org_id = auth_org_id());
CREATE POLICY "Admins can update rules" ON approval_rules
  FOR UPDATE USING (org_id = auth_org_id())
  WITH CHECK (org_id = auth_org_id());
CREATE POLICY "Admins can delete rules" ON approval_rules
  FOR DELETE USING (org_id = auth_org_id());

-- Approval Votes: org-scoped via request
CREATE POLICY "Users can view org votes" ON approval_votes
  FOR SELECT USING (
    request_id IN (SELECT id FROM approval_requests WHERE org_id = auth_org_id())
  );
CREATE POLICY "Users can cast votes" ON approval_votes
  FOR INSERT WITH CHECK (
    request_id IN (SELECT id FROM approval_requests WHERE org_id = auth_org_id())
  );

-- Saved Filters: user-scoped
CREATE POLICY "Users can view own filters" ON saved_filters
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own filters" ON saved_filters
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own filters" ON saved_filters
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own filters" ON saved_filters
  FOR DELETE USING (user_id = auth.uid());

-- Approval Attachments: org-scoped via request
CREATE POLICY "Users can view org attachments" ON approval_attachments
  FOR SELECT USING (
    request_id IN (SELECT id FROM approval_requests WHERE org_id = auth_org_id())
  );
CREATE POLICY "Users can upload attachments" ON approval_attachments
  FOR INSERT WITH CHECK (
    request_id IN (SELECT id FROM approval_requests WHERE org_id = auth_org_id())
  );

-- ============================================================
-- INDEXES
-- ============================================================

-- User Profiles
CREATE INDEX idx_user_profiles_org_id ON user_profiles(org_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Connections
CREATE INDEX idx_connections_org_id ON connections(org_id);
CREATE INDEX idx_connections_api_key_hash ON connections(api_key_hash);
CREATE INDEX idx_connections_api_key_prefix ON connections(api_key_prefix);

-- Approval Requests
CREATE INDEX idx_approval_requests_org_id ON approval_requests(org_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_priority ON approval_requests(priority);
CREATE INDEX idx_approval_requests_connection_id ON approval_requests(connection_id);
CREATE INDEX idx_approval_requests_org_status ON approval_requests(org_id, status);
CREATE INDEX idx_approval_requests_org_status_priority ON approval_requests(org_id, status, priority);
CREATE INDEX idx_approval_requests_created_at ON approval_requests(created_at DESC);
CREATE INDEX idx_approval_requests_expires_at ON approval_requests(expires_at) WHERE status = 'pending';
CREATE INDEX idx_approval_requests_idempotency ON approval_requests(connection_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Org Invites
CREATE INDEX idx_org_invites_token ON org_invites(token);
CREATE INDEX idx_org_invites_email ON org_invites(email);
CREATE INDEX idx_org_invites_org_id ON org_invites(org_id);

-- Audit Log
CREATE INDEX idx_audit_log_org_id ON audit_log(org_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- Push Subscriptions
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Notification Settings
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);

-- Email Action Tokens
CREATE INDEX idx_email_action_tokens_token ON email_action_tokens(token);
CREATE INDEX idx_email_action_tokens_request_id ON email_action_tokens(request_id);

-- Approval Comments
CREATE INDEX idx_approval_comments_request_id ON approval_comments(request_id);
CREATE INDEX idx_approval_comments_created_at ON approval_comments(created_at);

-- Webhook Delivery Log
CREATE INDEX idx_webhook_delivery_log_request_id ON webhook_delivery_log(request_id);
CREATE INDEX idx_webhook_delivery_log_connection_id ON webhook_delivery_log(connection_id);
CREATE INDEX idx_webhook_delivery_log_created_at ON webhook_delivery_log(created_at DESC);

-- Approval Rules
CREATE INDEX idx_approval_rules_org_id ON approval_rules(org_id);
CREATE INDEX idx_approval_rules_connection_id ON approval_rules(connection_id);
CREATE INDEX idx_approval_rules_priority_order ON approval_rules(org_id, priority_order);

-- Approval Votes
CREATE INDEX idx_approval_votes_request_id ON approval_votes(request_id);
CREATE INDEX idx_approval_votes_user_id ON approval_votes(user_id);

-- Saved Filters
CREATE INDEX idx_saved_filters_user_id ON saved_filters(user_id);

-- Approval Attachments
CREATE INDEX idx_approval_attachments_request_id ON approval_attachments(request_id);

-- Full-text search on approval requests
ALTER TABLE approval_requests ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;
CREATE INDEX idx_approval_requests_search ON approval_requests USING gin(search_vector);

-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE approval_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE approval_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE approval_votes;

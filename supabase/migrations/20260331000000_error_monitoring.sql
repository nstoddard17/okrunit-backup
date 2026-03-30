-- ---------------------------------------------------------------------------
-- OKrunit -- Error Monitoring System
-- ---------------------------------------------------------------------------
-- Two-table design: error_issues (grouped) + error_events (individual)
-- Mirrors Sentry's Issue/Event model. Writes via service-role (bypass RLS),
-- reads restricted to app admins.
-- ---------------------------------------------------------------------------

-- =========================================================================
-- 1. Enums
-- =========================================================================

CREATE TYPE error_severity AS ENUM ('info', 'warning', 'error', 'fatal');
CREATE TYPE error_issue_status AS ENUM ('unresolved', 'resolved', 'ignored', 'regressed');

-- =========================================================================
-- 2. Error Issues (grouped by fingerprint)
-- =========================================================================

CREATE TABLE error_issues (
  id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint     TEXT                NOT NULL UNIQUE,
  title           TEXT                NOT NULL,
  severity        error_severity      NOT NULL DEFAULT 'error',
  status          error_issue_status  NOT NULL DEFAULT 'unresolved',
  service         TEXT,
  event_count     INTEGER             NOT NULL DEFAULT 1,
  affected_users  INTEGER             NOT NULL DEFAULT 0,
  first_seen_at   TIMESTAMPTZ         NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ         NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID                REFERENCES auth.users(id),
  resolved_in_release TEXT,
  first_release   TEXT,
  last_release    TEXT,
  tags            JSONB               DEFAULT '{}',
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_issues_status ON error_issues(status);
CREATE INDEX idx_error_issues_severity ON error_issues(severity);
CREATE INDEX idx_error_issues_service ON error_issues(service);
CREATE INDEX idx_error_issues_last_seen ON error_issues(last_seen_at DESC);
CREATE INDEX idx_error_issues_status_severity ON error_issues(status, severity);
CREATE INDEX idx_error_issues_status_last_seen ON error_issues(status, last_seen_at DESC);

CREATE TRIGGER set_error_issues_updated_at
  BEFORE UPDATE ON error_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- 3. Error Events (individual occurrences)
-- =========================================================================

CREATE TABLE error_events (
  id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id        UUID                NOT NULL REFERENCES error_issues(id) ON DELETE CASCADE,
  error_type      TEXT                NOT NULL,
  message         TEXT                NOT NULL,
  stack_trace     TEXT,
  severity        error_severity      NOT NULL DEFAULT 'error',
  service         TEXT,
  environment     TEXT                DEFAULT 'production',
  release         TEXT,
  request_url     TEXT,
  request_method  TEXT,
  user_id         UUID,
  org_id          UUID,
  tags            JSONB               DEFAULT '{}',
  context         JSONB               DEFAULT '{}',
  breadcrumbs     JSONB               DEFAULT '[]',
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_events_issue_id ON error_events(issue_id);
CREATE INDEX idx_error_events_created_at ON error_events(created_at DESC);
CREATE INDEX idx_error_events_issue_created ON error_events(issue_id, created_at DESC);
CREATE INDEX idx_error_events_user_id ON error_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_error_events_org_id ON error_events(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_error_events_service ON error_events(service);

-- =========================================================================
-- 4. Row Level Security
-- =========================================================================

ALTER TABLE error_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_events ENABLE ROW LEVEL SECURITY;

-- App admins can read all error data
CREATE POLICY "App admins can view error issues" ON error_issues
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_app_admin = true)
  );

CREATE POLICY "App admins can update error issues" ON error_issues
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_app_admin = true)
  );

CREATE POLICY "App admins can view error events" ON error_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_app_admin = true)
  );

-- Writes happen via service-role client (bypasses RLS)

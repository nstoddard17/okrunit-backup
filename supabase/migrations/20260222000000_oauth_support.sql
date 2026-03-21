-- ---------------------------------------------------------------------------
-- OKRunit -- OAuth 2.0 Support
-- ---------------------------------------------------------------------------
-- Adds tables for OAuth 2.0 Authorization Server:
--   1. oauth_clients          – registered OAuth applications
--   2. oauth_authorization_codes – short-lived auth codes
--   3. oauth_access_tokens    – opaque access tokens
--   4. oauth_refresh_tokens   – long-lived, rotatable refresh tokens
-- ---------------------------------------------------------------------------

-- =========================================================================
-- 1. OAuth Clients
-- =========================================================================

CREATE TABLE oauth_clients (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                 TEXT        NOT NULL,
  client_id            TEXT        NOT NULL UNIQUE,
  client_secret_hash   TEXT        NOT NULL,
  client_secret_prefix TEXT        NOT NULL,
  redirect_uris        TEXT[]      NOT NULL DEFAULT '{}',
  scopes               TEXT[]      NOT NULL DEFAULT '{approvals:read,approvals:write,comments:write}',
  is_active            BOOLEAN     NOT NULL DEFAULT true,
  created_by           UUID        REFERENCES auth.users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_oauth_clients_org_id    ON oauth_clients(org_id);
CREATE INDEX idx_oauth_clients_client_id ON oauth_clients(client_id);

-- =========================================================================
-- 2. Authorization Codes
-- =========================================================================

CREATE TABLE oauth_authorization_codes (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             TEXT        NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id                UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code_hash             TEXT        NOT NULL,
  redirect_uri          TEXT        NOT NULL,
  scopes                TEXT[]      NOT NULL,
  code_challenge        TEXT,
  code_challenge_method TEXT        CHECK (code_challenge_method IN ('S256', 'plain')),
  expires_at            TIMESTAMPTZ NOT NULL,
  used_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_oauth_auth_codes_code_hash ON oauth_authorization_codes(code_hash);

-- =========================================================================
-- 3. Access Tokens
-- =========================================================================

CREATE TABLE oauth_access_tokens (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    TEXT        NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token_hash   TEXT        NOT NULL UNIQUE,
  scopes       TEXT[]      NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_oauth_access_tokens_token_hash ON oauth_access_tokens(token_hash);
CREATE INDEX idx_oauth_access_tokens_user_id    ON oauth_access_tokens(user_id);

-- =========================================================================
-- 4. Refresh Tokens
-- =========================================================================

CREATE TABLE oauth_refresh_tokens (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token_id           UUID        REFERENCES oauth_access_tokens(id) ON DELETE SET NULL,
  client_id                 TEXT        NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id                   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id                    UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token_hash                TEXT        NOT NULL UNIQUE,
  scopes                    TEXT[]      NOT NULL,
  expires_at                TIMESTAMPTZ NOT NULL,
  used_at                   TIMESTAMPTZ,
  revoked_at                TIMESTAMPTZ,
  previous_token_hash       TEXT,
  previous_token_expires_at TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_oauth_refresh_tokens_token_hash ON oauth_refresh_tokens(token_hash);
CREATE INDEX idx_oauth_refresh_tokens_user_id    ON oauth_refresh_tokens(user_id);

-- =========================================================================
-- 5. Row Level Security
-- =========================================================================

ALTER TABLE oauth_clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_authorization_codes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_access_tokens        ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_refresh_tokens       ENABLE ROW LEVEL SECURITY;

-- Clients: org members can view, admins/owners can manage
CREATE POLICY "Users can view org oauth clients" ON oauth_clients
  FOR SELECT USING (org_id = auth_org_id());

CREATE POLICY "Admins can insert org oauth clients" ON oauth_clients
  FOR INSERT WITH CHECK (org_id = auth_org_id());

CREATE POLICY "Admins can update org oauth clients" ON oauth_clients
  FOR UPDATE USING (org_id = auth_org_id())
  WITH CHECK (org_id = auth_org_id());

CREATE POLICY "Admins can delete org oauth clients" ON oauth_clients
  FOR DELETE USING (org_id = auth_org_id());

-- Auth codes: users can view their own
CREATE POLICY "Users can view own auth codes" ON oauth_authorization_codes
  FOR SELECT USING (user_id = auth.uid());

-- Access tokens: users can view their own
CREATE POLICY "Users can view own access tokens" ON oauth_access_tokens
  FOR SELECT USING (user_id = auth.uid());

-- Refresh tokens: users can view their own
CREATE POLICY "Users can view own refresh tokens" ON oauth_refresh_tokens
  FOR SELECT USING (user_id = auth.uid());

-- =========================================================================
-- 6. Triggers
-- =========================================================================

CREATE TRIGGER update_oauth_clients_updated_at
  BEFORE UPDATE ON oauth_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

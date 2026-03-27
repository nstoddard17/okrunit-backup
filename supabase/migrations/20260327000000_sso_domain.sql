-- Add sso_domain column to organizations for SAML SSO email domain matching
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_domain TEXT;

-- Index for fast lookups by domain
CREATE INDEX IF NOT EXISTS idx_organizations_sso_domain ON organizations (sso_domain)
  WHERE sso_domain IS NOT NULL;

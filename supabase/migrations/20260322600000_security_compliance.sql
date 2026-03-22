-- ---------------------------------------------------------------------------
-- Phase 19: Security & Compliance
-- Adds geo-fencing, four-eyes principle, session security columns to organizations
-- ---------------------------------------------------------------------------

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS ip_allowlist TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS geo_restrictions JSONB DEFAULT '{"enabled": false, "allowed_countries": []}',
  ADD COLUMN IF NOT EXISTS require_reauth_for_critical BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS session_timeout_minutes INTEGER DEFAULT 480,
  ADD COLUMN IF NOT EXISTS four_eyes_config JSONB DEFAULT '{"enabled": false, "action_types": [], "min_priority": null}';

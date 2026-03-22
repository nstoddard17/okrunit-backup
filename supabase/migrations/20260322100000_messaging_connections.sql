-- ---------------------------------------------------------------------------
-- OKRunit -- Messaging Connections (OAuth-based install flows)
-- ---------------------------------------------------------------------------
-- Replaces per-user webhook URL fields in notification_settings with org-wide
-- messaging connections for Discord, Slack, Teams, and Telegram.
-- ---------------------------------------------------------------------------

-- 1. Create the messaging_connections table
CREATE TABLE messaging_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('discord', 'slack', 'teams', 'telegram')),
  -- OAuth tokens (encrypted at rest by Supabase)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  bot_token TEXT, -- For Discord/Telegram bots
  -- Channel/workspace info
  workspace_id TEXT, -- Slack workspace ID, Discord guild ID, etc.
  workspace_name TEXT,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  webhook_url TEXT, -- Resolved webhook URL for sending messages
  -- Config
  is_active BOOLEAN NOT NULL DEFAULT true,
  notify_on_create BOOLEAN NOT NULL DEFAULT true,
  notify_on_decide BOOLEAN NOT NULL DEFAULT true,
  priority_filter TEXT DEFAULT 'low', -- minimum priority to notify
  installed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, platform, channel_id)
);

-- 2. RLS policies
ALTER TABLE messaging_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view messaging connections"
  ON messaging_connections FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Org admins can manage messaging connections"
  ON messaging_connections FOR ALL
  USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- 3. Indexes for common queries
CREATE INDEX idx_messaging_connections_org_id ON messaging_connections(org_id);
CREATE INDEX idx_messaging_connections_org_platform ON messaging_connections(org_id, platform);

-- 4. Updated_at trigger
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

CREATE TRIGGER set_messaging_connections_updated_at
  BEFORE UPDATE ON messaging_connections
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- 5. Enable realtime for messaging_connections
ALTER TABLE messaging_connections REPLICA IDENTITY FULL;

-- 6. Remove old per-user messaging fields from notification_settings
ALTER TABLE notification_settings
  DROP COLUMN IF EXISTS slack_enabled,
  DROP COLUMN IF EXISTS slack_webhook_url,
  DROP COLUMN IF EXISTS discord_enabled,
  DROP COLUMN IF EXISTS discord_webhook_url,
  DROP COLUMN IF EXISTS teams_enabled,
  DROP COLUMN IF EXISTS teams_webhook_url,
  DROP COLUMN IF EXISTS telegram_enabled,
  DROP COLUMN IF EXISTS telegram_chat_id;

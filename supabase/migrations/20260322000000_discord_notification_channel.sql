-- ---------------------------------------------------------------------------
-- Add Discord notification channel support
-- ---------------------------------------------------------------------------

-- Add discord fields to notification_settings
ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS discord_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discord_webhook_url text;

-- Add 'discord' to the decision_source enum
ALTER TYPE decision_source ADD VALUE IF NOT EXISTS 'discord' AFTER 'slack';

-- Add 'discord' to the vote_source enum
ALTER TYPE vote_source ADD VALUE IF NOT EXISTS 'discord' AFTER 'slack';

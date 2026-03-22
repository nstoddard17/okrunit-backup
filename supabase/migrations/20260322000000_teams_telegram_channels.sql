-- ---------------------------------------------------------------------------
-- Add Microsoft Teams and Telegram notification channels
-- ---------------------------------------------------------------------------

-- Add Teams and Telegram fields to notification_settings
ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS teams_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS teams_webhook_url text,
  ADD COLUMN IF NOT EXISTS telegram_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS telegram_chat_id text;

-- Extend decision_source to include 'teams' and 'telegram'.
-- PostgreSQL does not support IF NOT EXISTS for ALTER TYPE ADD VALUE,
-- so we use a DO block with exception handling.
DO $$
BEGIN
  ALTER TYPE decision_source ADD VALUE IF NOT EXISTS 'teams';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE decision_source ADD VALUE IF NOT EXISTS 'telegram';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Also extend vote_source to include 'teams' and 'telegram' for consistency.
DO $$
BEGIN
  ALTER TYPE vote_source ADD VALUE IF NOT EXISTS 'teams';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE vote_source ADD VALUE IF NOT EXISTS 'telegram';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

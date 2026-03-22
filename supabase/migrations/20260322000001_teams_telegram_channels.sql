-- ---------------------------------------------------------------------------
-- Add Microsoft Teams and Telegram notification channels
-- ---------------------------------------------------------------------------

-- Add Teams and Telegram fields to notification_settings
ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS teams_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS teams_webhook_url text,
  ADD COLUMN IF NOT EXISTS telegram_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS telegram_chat_id text;

-- CHECK constraints for decision_source and vote source already updated
-- in the discord migration to include 'teams' and 'telegram'.

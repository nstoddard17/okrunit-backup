-- ---------------------------------------------------------------------------
-- OKrunit -- Add max_teams column to plans + enable Realtime on notifications
-- ---------------------------------------------------------------------------

-- 1. Add max_teams column to plans table
-- (-1 = unlimited, matches convention of other limit columns)
ALTER TABLE plans
  ADD COLUMN max_teams INTEGER NOT NULL DEFAULT -1;

-- Set max_teams values for existing plans
UPDATE plans SET max_teams = 1 WHERE id = 'free';
UPDATE plans SET max_teams = 5 WHERE id = 'pro';
UPDATE plans SET max_teams = -1 WHERE id = 'business';
UPDATE plans SET max_teams = -1 WHERE id = 'enterprise';

-- Also update SSO: remove from business, keep on enterprise only
-- features is a JSONB array, so use JSONB subtraction operator
UPDATE plans
  SET features = (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(features) AS elem
    WHERE elem::text != '"sso_saml"'
  )
  WHERE id = 'business';

-- 2. Enable Supabase Realtime on in_app_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE in_app_notifications;
ALTER TABLE in_app_notifications REPLICA IDENTITY FULL;

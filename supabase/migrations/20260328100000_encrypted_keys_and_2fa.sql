-- ---------------------------------------------------------------------------
-- Add encrypted API key storage to connections + 2FA (TOTP) to user profiles
-- ---------------------------------------------------------------------------

-- 1. Encrypted key column on connections
ALTER TABLE connections
  ADD COLUMN IF NOT EXISTS api_key_encrypted text;

-- 2. TOTP 2FA columns on user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS totp_secret_encrypted text,
  ADD COLUMN IF NOT EXISTS totp_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS totp_verified_at timestamptz;

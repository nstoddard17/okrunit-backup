-- Account deletion: soft delete + email-verified deletion flow

-- Add soft delete columns to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_app_admin BOOLEAN NOT NULL DEFAULT false;

-- Account deletion tokens (email-verified, single-use)
CREATE TABLE IF NOT EXISTS account_deletion_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  consumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE account_deletion_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion tokens" ON account_deletion_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE INDEX idx_account_deletion_tokens_token ON account_deletion_tokens(token);
CREATE INDEX idx_account_deletion_tokens_user_id ON account_deletion_tokens(user_id);

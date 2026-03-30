-- ---------------------------------------------------------------------------
-- OKrunit -- WebAuthn / FIDO2 Passkey Credentials
-- ---------------------------------------------------------------------------
-- Stores registered WebAuthn credentials (hardware keys, biometrics)
-- for passwordless authentication and 2FA.
-- ---------------------------------------------------------------------------

CREATE TABLE webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type TEXT,
  backed_up BOOLEAN DEFAULT false,
  transports TEXT[],
  name TEXT NOT NULL DEFAULT 'Security Key',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webauthn_user ON webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credential ON webauthn_credentials(credential_id);

ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credentials" ON webauthn_credentials
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own credentials" ON webauthn_credentials
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own credentials" ON webauthn_credentials
  FOR DELETE USING (user_id = auth.uid());

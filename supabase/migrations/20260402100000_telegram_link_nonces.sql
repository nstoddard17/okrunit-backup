-- ---------------------------------------------------------------------------
-- Telegram deep-link nonces
-- ---------------------------------------------------------------------------
-- Stores temporary nonces used for the one-click Telegram connection flow.
-- When a user clicks "Connect Telegram", we generate a nonce and build a
-- t.me/BotName?start=<nonce> link. When the user opens it in Telegram and
-- presses Start, the bot webhook receives /start <nonce>, looks up this row,
-- and creates the messaging_connection automatically.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS telegram_link_nonces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce       TEXT NOT NULL UNIQUE,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  claimed_at  TIMESTAMPTZ,            -- set when the /start message is received
  chat_id     TEXT,                    -- filled on claim
  chat_title  TEXT,                    -- filled on claim
  connection_id UUID REFERENCES messaging_connections(id) ON DELETE SET NULL,
  expires_at  TIMESTAMPTZ NOT NULL,    -- nonces expire after 10 minutes
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup by nonce (webhook handler)
CREATE INDEX idx_telegram_link_nonces_nonce ON telegram_link_nonces(nonce);

-- Cleanup expired nonces periodically
CREATE INDEX idx_telegram_link_nonces_expires ON telegram_link_nonces(expires_at)
  WHERE claimed_at IS NULL;

-- RLS: only org members can see their own nonces
ALTER TABLE telegram_link_nonces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org nonces"
  ON telegram_link_nonces FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
    )
  );

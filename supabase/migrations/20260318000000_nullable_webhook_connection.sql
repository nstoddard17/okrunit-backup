-- ---------------------------------------------------------------------------
-- Allow webhook_delivery_log.connection_id to be NULL for OAuth-based requests
-- that don't have a connection_id but still use callback URLs.
-- ---------------------------------------------------------------------------

ALTER TABLE webhook_delivery_log
  ALTER COLUMN connection_id DROP NOT NULL;

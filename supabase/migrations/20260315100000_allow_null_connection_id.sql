-- ---------------------------------------------------------------------------
-- Allow NULL connection_id on approval_requests
-- ---------------------------------------------------------------------------
-- OAuth-based integrations (e.g. Zapier) authenticate with an access token
-- rather than an API key connection. These requests have no connection_id.
-- ---------------------------------------------------------------------------

ALTER TABLE approval_requests ALTER COLUMN connection_id DROP NOT NULL;

-- The existing UNIQUE(connection_id, idempotency_key) still works: PostgreSQL
-- treats NULLs as distinct, so rows with NULL connection_id won't conflict.
-- The application code already handles idempotency for OAuth via an explicit
-- query scoped to org_id, so no additional index is needed.

-- Add logo_url column to oauth_clients for displaying app logos on the consent page.
ALTER TABLE oauth_clients ADD COLUMN logo_url TEXT;

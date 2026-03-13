-- ============================================================================
-- Migration: App Admin Role
-- Adds an app-level admin flag to user_profiles, separate from org-level roles.
-- App admins can access cross-org admin dashboard and impersonate any org.
-- ============================================================================

ALTER TABLE user_profiles ADD COLUMN is_app_admin BOOLEAN NOT NULL DEFAULT false;

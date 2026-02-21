-- Multi-Organization Support Migration
-- Introduces org_memberships table so users can belong to multiple organizations.
-- Moves org_id and role from user_profiles into org_memberships.

-- ============================================================
-- 1. CREATE org_memberships TABLE
-- ============================================================

CREATE TABLE public.org_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id)
);

-- ============================================================
-- 2. POPULATE FROM EXISTING user_profiles
-- ============================================================

INSERT INTO public.org_memberships (user_id, org_id, role, is_default)
SELECT id, org_id, role, true
FROM public.user_profiles;

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX idx_org_memberships_user_id ON public.org_memberships(user_id);
CREATE INDEX idx_org_memberships_org_id ON public.org_memberships(org_id);
-- Prevent multiple default orgs per user
CREATE UNIQUE INDEX idx_org_memberships_user_default ON public.org_memberships(user_id) WHERE is_default = true;

-- ============================================================
-- 4. UPDATED_AT TRIGGER
-- ============================================================

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.org_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. RLS
-- ============================================================

ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;

-- Users can see their own memberships (needed for org switcher)
CREATE POLICY "Users can view own memberships" ON public.org_memberships
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own memberships (for switching default org)
CREATE POLICY "Users can update own memberships" ON public.org_memberships
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 6. DROP POLICIES THAT DEPEND ON org_id BEFORE DROPPING THE COLUMN
-- ============================================================

-- Old policy references org_id which we are about to drop
DROP POLICY IF EXISTS "Users can view org members" ON public.user_profiles;

-- ============================================================
-- 7. DROP org_id AND role FROM user_profiles
-- ============================================================

DROP INDEX IF EXISTS idx_user_profiles_org_id;
ALTER TABLE public.user_profiles DROP COLUMN org_id;
ALTER TABLE public.user_profiles DROP COLUMN role;

-- ============================================================
-- 8. REDEFINE auth_org_id() TO READ FROM org_memberships
-- ============================================================

CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.org_memberships
  WHERE user_id = auth.uid() AND is_default = true
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 9. RECREATE RLS POLICY ON user_profiles USING org_memberships
-- ============================================================

-- New: users can view profiles of anyone in their active org
CREATE POLICY "Users can view org members" ON public.user_profiles
  FOR SELECT USING (
    id IN (
      SELECT user_id FROM public.org_memberships WHERE org_id = auth_org_id()
    )
  );

-- ============================================================
-- 10. UPDATE ORGANIZATIONS RLS TO SUPPORT MULTI-ORG
-- ============================================================

-- Users should be able to view any org they belong to (not just default)
DROP POLICY IF EXISTS "Users can view own org" ON public.organizations;
CREATE POLICY "Users can view own orgs" ON public.organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid())
  );

-- Admins can update orgs they belong to (keep scoped to active org for safety)
-- Existing "Admins can update own org" policy still works via auth_org_id()

-- ============================================================
-- 11. REDEFINE handle_new_user() TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invite_record RECORD;
  new_org_id UUID;
BEGIN
  -- Check if user was invited to an existing org
  SELECT * INTO invite_record
  FROM public.org_invites
  WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF invite_record IS NOT NULL THEN
    -- Create user profile (no org_id or role -- those live in org_memberships)
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );

    -- Create membership in the invited org
    INSERT INTO public.org_memberships (user_id, org_id, role, is_default)
    VALUES (NEW.id, invite_record.org_id, invite_record.role, true);

    -- Mark invite as accepted
    UPDATE public.org_invites SET accepted_at = now() WHERE id = invite_record.id;
  ELSE
    -- Create new org for this user
    INSERT INTO public.organizations (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Organization')
    RETURNING id INTO new_org_id;

    -- Create user profile
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );

    -- Create membership as owner
    INSERT INTO public.org_memberships (user_id, org_id, role, is_default)
    VALUES (NEW.id, new_org_id, 'owner', true);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- Migration: Default org name "My Organization" + auto-create "My Team"
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
    -- Create user profile
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
    -- Create new org with default name
    INSERT INTO public.organizations (name)
    VALUES ('My Organization')
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

    -- Create default team
    INSERT INTO public.teams (org_id, name, created_by)
    VALUES (new_org_id, 'My Team', NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

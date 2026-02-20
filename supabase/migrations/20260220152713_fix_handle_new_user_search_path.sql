-- Fix handle_new_user trigger: add explicit search_path and schema-qualify table references
-- This prevents "database error saving new user" when Supabase Auth invokes the trigger

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
    -- Join existing org via invite
    INSERT INTO public.user_profiles (id, org_id, email, full_name, role)
    VALUES (
      NEW.id,
      invite_record.org_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      invite_record.role
    );

    -- Mark invite as accepted
    UPDATE public.org_invites SET accepted_at = now() WHERE id = invite_record.id;
  ELSE
    -- Create new org for this user
    INSERT INTO public.organizations (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Organization')
    RETURNING id INTO new_org_id;

    INSERT INTO public.user_profiles (id, org_id, email, full_name, role)
    VALUES (
      NEW.id,
      new_org_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'owner'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

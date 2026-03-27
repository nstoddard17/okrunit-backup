-- One-time data fix: Rename existing default orgs and create default teams
-- for organizations that were created before the trigger update.

-- Rename orgs that still have the old "{name}'s Organization" pattern to "My Organization"
-- Only for orgs where there is exactly one owner membership (personal orgs)
UPDATE public.organizations
SET name = 'My Organization'
WHERE name LIKE '%''s Organization'
  AND id IN (
    SELECT org_id FROM public.org_memberships
    WHERE role = 'owner'
    GROUP BY org_id
    HAVING COUNT(*) = 1
  );

-- Create "My Team" for orgs that have zero teams
INSERT INTO public.teams (org_id, name, created_by)
SELECT o.id, 'My Team', m.user_id
FROM public.organizations o
JOIN public.org_memberships m ON m.org_id = o.id AND m.role = 'owner'
WHERE NOT EXISTS (
  SELECT 1 FROM public.teams t WHERE t.org_id = o.id
);

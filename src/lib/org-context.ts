// ---------------------------------------------------------------------------
// Gatekeeper -- Organization Context Helper
// Server-side utilities for resolving the active org for the current user.
// ---------------------------------------------------------------------------

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrgMembership, Organization, UserProfile } from "@/lib/types/database";

export interface OrgContext {
  profile: UserProfile;
  membership: OrgMembership;
  org: Organization;
}

/**
 * Get the current user's active org context.
 * Returns null if not authenticated or no membership found.
 */
export async function getOrgContext(): Promise<OrgContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();

  // Get user profile
  const { data: profile } = await admin
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single<UserProfile>();

  if (!profile) return null;

  // Get the user's default (active) membership
  const { data: membership } = await admin
    .from("org_memberships")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .single<OrgMembership>();

  if (!membership) return null;

  // Fetch the organization
  const { data: org } = await admin
    .from("organizations")
    .select("*")
    .eq("id", membership.org_id)
    .single<Organization>();

  if (!org) return null;

  return { profile, membership, org };
}

/**
 * Get all orgs the user belongs to (for the org switcher).
 */
export async function getUserOrgs(
  userId: string,
): Promise<{ id: string; org_id: string; org_name: string; role: string; is_default: boolean }[]> {
  const admin = createAdminClient();

  const { data: memberships } = await admin
    .from("org_memberships")
    .select("id, org_id, role, is_default")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });

  if (!memberships || memberships.length === 0) return [];

  // Fetch org names
  const orgIds = memberships.map((m) => m.org_id);
  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name")
    .in("id", orgIds);

  const orgMap = new Map((orgs ?? []).map((o) => [o.id, o.name]));

  return memberships.map((m) => ({
    id: m.id,
    org_id: m.org_id,
    org_name: orgMap.get(m.org_id) ?? "Unknown",
    role: m.role,
    is_default: m.is_default,
  }));
}

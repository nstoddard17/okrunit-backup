import { redirect } from "next/navigation";
import { getOrgContext, getUserOrgs } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrgList } from "@/components/org/org-list";

export const metadata = {
  title: "Organizations - OKrunit",
  description: "View and manage your organizations.",
};

export default async function OrganizationsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { profile, membership } = ctx;

  const orgs = await getUserOrgs(profile.id);
  const admin = createAdminClient();

  // Fetch member and team counts for each org in parallel
  const orgIds = orgs.map((o) => o.org_id);

  const [{ data: memberRows }, { data: teamRows }] = await Promise.all([
    admin
      .from("org_memberships")
      .select("org_id")
      .in("org_id", orgIds.length > 0 ? orgIds : ["00000000-0000-0000-0000-000000000000"]),
    admin
      .from("teams")
      .select("org_id")
      .in("org_id", orgIds.length > 0 ? orgIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const memberCounts: Record<string, number> = {};
  for (const row of memberRows ?? []) {
    memberCounts[row.org_id] = (memberCounts[row.org_id] ?? 0) + 1;
  }

  const teamCounts: Record<string, number> = {};
  for (const row of teamRows ?? []) {
    teamCounts[row.org_id] = (teamCounts[row.org_id] ?? 0) + 1;
  }

  return (
    <OrgList
      orgs={orgs}
      currentOrgId={membership.org_id}
      memberCounts={memberCounts}
      teamCounts={teamCounts}
    />
  );
}

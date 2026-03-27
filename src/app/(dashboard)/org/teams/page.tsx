import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { V2TeamList } from "@/components/org/v2-team-list";

export const metadata = {
  title: "Teams - OKRunit",
  description: "Manage team groups in your organization.",
};

export default async function V2OrgTeamsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") redirect("/org/overview");

  const admin = createAdminClient();

  const { data: teams } = await admin
    .from("teams")
    .select("*")
    .eq("org_id", membership.org_id)
    .order("name");

  const teamIds = (teams ?? []).map((t) => t.id);

  const { data: teamMembershipsData } = await admin
    .from("team_memberships")
    .select("team_id")
    .in("team_id", teamIds.length > 0 ? teamIds : ["00000000-0000-0000-0000-000000000000"]);

  const memberCountMap: Record<string, number> = {};
  for (const tm of teamMembershipsData ?? []) {
    memberCountMap[tm.team_id] = (memberCountMap[tm.team_id] ?? 0) + 1;
  }

  return (
    <V2TeamList
      teams={(teams ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        created_at: t.created_at,
        updated_at: t.updated_at,
      }))}
      memberCounts={memberCountMap}
      currentUserRole={membership.role}
    />
  );
}

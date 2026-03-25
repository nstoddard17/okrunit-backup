import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { TeamList } from "@/components/teams/team-list";

export const metadata = {
  title: "Teams - OKRunit",
  description: "Manage team groups in your organization.",
};

export default async function OrgTeamsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") redirect("/org/overview");

  const admin = createAdminClient();

  const [{ data: teams }, { data: orgMemberships }] = await Promise.all([
    admin.from("teams").select("*").eq("org_id", membership.org_id).order("name"),
    admin
      .from("org_memberships")
      .select("id, user_id, org_id, role, can_approve")
      .eq("org_id", membership.org_id),
  ]);

  const teamIds = (teams ?? []).map((t) => t.id);

  const [{ data: teamMembershipsData }, { data: allTeamMemberships }] = await Promise.all([
    admin
      .from("team_memberships")
      .select("team_id")
      .in("team_id", teamIds.length > 0 ? teamIds : ["00000000-0000-0000-0000-000000000000"]),
    admin
      .from("team_memberships")
      .select("id, team_id, user_id, created_at")
      .in("team_id", teamIds.length > 0 ? teamIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const memberCountMap: Record<string, number> = {};
  for (const tm of teamMembershipsData ?? []) {
    memberCountMap[tm.team_id] = (memberCountMap[tm.team_id] ?? 0) + 1;
  }

  // Resolve member profiles
  const userIds = (orgMemberships ?? []).map((m) => m.user_id);
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, email, full_name, avatar_url")
    .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const orgMembers = (orgMemberships ?? []).map((m) => {
    const profile = profileMap.get(m.user_id);
    return {
      id: m.user_id,
      email: profile?.email ?? "",
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: m.role as "owner" | "admin" | "member",
      can_approve: m.can_approve ?? false,
    };
  });

  return (
    <TeamList
      teams={(teams ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        created_at: t.created_at,
        updated_at: t.updated_at,
      }))}
      memberCounts={memberCountMap}
      teamMemberships={(allTeamMemberships ?? []).map((tm) => ({
        id: tm.id,
        team_id: tm.team_id,
        user_id: tm.user_id,
        created_at: tm.created_at,
      }))}
      orgMembers={orgMembers}
      currentUserId={ctx.profile.id}
      currentUserRole={membership.role}
    />
  );
}

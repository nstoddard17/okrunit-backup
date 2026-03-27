import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { V2MemberList } from "@/components/org/v2-member-list";

export const metadata = {
  title: "Members - OKRunit",
  description: "Manage your organization's team members.",
};

export default async function V2OrgMembersPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") redirect("/org/overview");

  const admin = createAdminClient();

  const { data: orgMemberships } = await admin
    .from("org_memberships")
    .select("id, user_id, org_id, role, can_approve, created_at, updated_at")
    .eq("org_id", membership.org_id)
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  const userIds = (orgMemberships ?? []).map((m) => m.user_id);
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, email, full_name, avatar_url")
    .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const members = (orgMemberships ?? []).map((m) => {
    const profile = profileMap.get(m.user_id);
    return {
      id: m.user_id,
      email: profile?.email ?? "",
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: m.role as "owner" | "admin" | "member",
      can_approve: m.can_approve ?? false,
      created_at: m.created_at,
      updated_at: m.updated_at,
    };
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentDecisions } = await admin
    .from("approval_requests")
    .select("decided_by, decided_at, status")
    .eq("org_id", membership.org_id)
    .not("decided_by", "is", null)
    .gte("decided_at", thirtyDaysAgo)
    .in("decided_by", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const memberStats: Record<string, { decisions_30d: number; approved: number; rejected: number; last_active: string | null }> = {};
  for (const uid of userIds) {
    memberStats[uid] = { decisions_30d: 0, approved: 0, rejected: 0, last_active: null };
  }
  for (const d of recentDecisions ?? []) {
    if (!d.decided_by) continue;
    const stat = memberStats[d.decided_by];
    if (!stat) continue;
    stat.decisions_30d++;
    if (d.status === "approved") stat.approved++;
    if (d.status === "rejected") stat.rejected++;
    if (!stat.last_active || (d.decided_at && d.decided_at > stat.last_active)) {
      stat.last_active = d.decided_at;
    }
  }

  const { data: pendingAssigned } = await admin
    .from("approval_requests")
    .select("assigned_approvers, status")
    .eq("org_id", membership.org_id)
    .eq("status", "pending");

  const pendingLoadMap: Record<string, number> = {};
  for (const req of pendingAssigned ?? []) {
    const approvers: string[] = req.assigned_approvers ?? [];
    for (const uid of approvers) {
      pendingLoadMap[uid] = (pendingLoadMap[uid] ?? 0) + 1;
    }
  }

  return (
    <V2MemberList
      members={members}
      currentUserId={ctx.profile.id}
      currentUserRole={membership.role}
      memberStats={memberStats}
      pendingLoadMap={pendingLoadMap}
    />
  );
}

// ---------------------------------------------------------------------------
// Gatekeeper -- Team Management Dashboard Page
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";

import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { MemberList } from "@/components/team/member-list";
import { InviteForm } from "@/components/team/invite-form";
import { PendingInvites } from "@/components/team/pending-invites";
import type { OrgInvite } from "@/lib/types/database";

export const metadata = {
  title: "Team - Gatekeeper",
  description: "Manage your organization's team members and invitations.",
};

export default async function TeamPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const { membership, org } = ctx;

  const admin = createAdminClient();

  // Fetch org memberships with user profile data
  const { data: memberships } = await admin
    .from("org_memberships")
    .select("id, user_id, org_id, role, created_at, updated_at")
    .eq("org_id", membership.org_id)
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  // Fetch user profiles for these members
  const userIds = (memberships ?? []).map((m) => m.user_id);
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, email, full_name, avatar_url")
    .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p]),
  );

  // Combine into the shape MemberList expects
  const members = (memberships ?? []).map((m) => {
    const profile = profileMap.get(m.user_id);
    return {
      id: m.user_id,
      email: profile?.email ?? "",
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: m.role as "owner" | "admin" | "member",
      created_at: m.created_at,
      updated_at: m.updated_at,
    };
  });

  // Fetch pending invites (not accepted, not expired).
  const { data: pendingInvites } = await admin
    .from("org_invites")
    .select("id, org_id, email, role, invited_by, expires_at, accepted_at, created_at")
    .eq("org_id", membership.org_id)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .returns<Omit<OrgInvite, "token">[]>();

  const canManageInvites =
    membership.role === "owner" || membership.role === "admin";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-muted-foreground text-sm">
          Manage members and invitations for {org.name}.
        </p>
      </div>

      {/* Invite form -- only visible to admins and owners */}
      {canManageInvites && <InviteForm />}

      {/* Pending invites */}
      {canManageInvites && (pendingInvites ?? []).length > 0 && (
        <PendingInvites
          invites={(pendingInvites ?? []) as OrgInvite[]}
          canManage={canManageInvites}
        />
      )}

      {/* Members list */}
      <MemberList
        members={members}
        currentUserId={ctx.profile.id}
        currentUserRole={membership.role}
      />
    </div>
  );
}

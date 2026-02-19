// ---------------------------------------------------------------------------
// Gatekeeper -- Team Management Dashboard Page
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MemberList } from "@/components/team/member-list";
import { InviteForm } from "@/components/team/invite-form";
import { PendingInvites } from "@/components/team/pending-invites";
import type { UserProfile, OrgInvite } from "@/lib/types/database";

export const metadata = {
  title: "Team - Gatekeeper",
  description: "Manage your organization's team members and invitations.",
};

export default async function TeamPage() {
  const supabase = await createClient();

  // Get the authenticated user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile for org_id and role.
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single<UserProfile>();

  if (!profile) {
    redirect("/login");
  }

  const admin = createAdminClient();

  // Fetch org members ordered by role then created_at.
  const { data: members } = await admin
    .from("user_profiles")
    .select("*")
    .eq("org_id", profile.org_id)
    .order("role", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<UserProfile[]>();

  // Fetch pending invites (not accepted, not expired).
  const { data: pendingInvites } = await admin
    .from("org_invites")
    .select("id, org_id, email, role, invited_by, expires_at, accepted_at, created_at")
    .eq("org_id", profile.org_id)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .returns<Omit<OrgInvite, "token">[]>();

  const canManageInvites =
    profile.role === "owner" || profile.role === "admin";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-muted-foreground text-sm">
          Manage your organization&apos;s members and invitations.
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
        members={members ?? []}
        currentUserId={user.id}
        currentUserRole={profile.role}
      />
    </div>
  );
}

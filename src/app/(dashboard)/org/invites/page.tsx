import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { InviteForm } from "@/components/team/invite-form";
import { PendingInvites } from "@/components/team/pending-invites";
import type { OrgInvite } from "@/lib/types/database";

export const metadata = {
  title: "Invites - OKRunit",
  description: "Manage invitations to your organization.",
};

export default async function OrgInvitesPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") redirect("/org/overview");

  const admin = createAdminClient();

  const { data: pendingInvites } = await admin
    .from("org_invites")
    .select("id, org_id, email, role, invited_by, expires_at, accepted_at, created_at")
    .eq("org_id", membership.org_id)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .returns<Omit<OrgInvite, "token">[]>();

  const invites = (pendingInvites ?? []) as OrgInvite[];

  return (
    <div className="space-y-6">
      <InviteForm />
      {invites.length > 0 && (
        <PendingInvites
          invites={invites}
          canManage={true}
        />
      )}
    </div>
  );
}

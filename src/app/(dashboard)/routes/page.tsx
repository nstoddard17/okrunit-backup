import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { RoutesHub } from "@/components/routes/routes-hub";
import type { ApprovalFlow, Connection, MessagingConnection, Team, UserProfile } from "@/lib/types/database";

export const metadata = {
  title: "Routes - OKRunit",
  description: "Configure approval flows, notification routing, and who must approve for each source.",
};

export default async function RoutesPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin")
    redirect("/dashboard");

  const supabase = await createClient();
  const admin = createAdminClient();

  const [
    { data: flows },
    { data: messagingConnections },
    { data: teams },
    { data: memberships },
  ] = await Promise.all([
    admin
      .from("approval_flows")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("last_request_at", { ascending: false, nullsFirst: false })
      .returns<ApprovalFlow[]>(),
    supabase
      .from("messaging_connections")
      .select(
        "id, org_id, platform, workspace_id, workspace_name, channel_id, channel_name, webhook_url, is_active, notify_on_create, notify_on_decide, priority_filter, routing_rules, installed_by, created_at, updated_at",
      )
      .eq("org_id", membership.org_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .returns<MessagingConnection[]>(),
    supabase
      .from("teams")
      .select("id, name")
      .eq("org_id", membership.org_id)
      .order("name")
      .returns<Pick<Team, "id" | "name">[]>(),
    admin
      .from("org_memberships")
      .select("user_id, role, can_approve")
      .eq("org_id", membership.org_id)
      .eq("can_approve", true),
  ]);

  // Resolve member profiles for the approver picker
  const memberIds = (memberships ?? []).map((m: { user_id: string }) => m.user_id);
  const { data: profiles } = memberIds.length > 0
    ? await admin
        .from("user_profiles")
        .select("id, full_name, email")
        .in("id", memberIds)
        .returns<Pick<UserProfile, "id" | "full_name" | "email">[]>()
    : { data: [] as Pick<UserProfile, "id" | "full_name" | "email">[] };

  const members = (memberships ?? []).map((m: { user_id: string; role: string }) => {
    const profile = (profiles ?? []).find((p) => p.id === m.user_id);
    return {
      id: m.user_id,
      name: profile?.full_name || profile?.email || m.user_id,
      email: profile?.email || "",
      role: m.role,
    };
  });

  return (
    <PageContainer>
      <PageHeader
        title="Routes"
        description="Configure who must approve requests from each source and where notifications are sent."
      />
      <RoutesHub
        flows={flows ?? []}
        messagingConnections={messagingConnections ?? []}
        teams={teams ?? []}
        members={members}
        orgId={membership.org_id}
      />
    </PageContainer>
  );
}

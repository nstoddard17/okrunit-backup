import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ApprovalDashboard } from "@/components/approvals/approval-dashboard";
import type { ApprovalRequest, Connection, UserProfile } from "@/lib/types/database";

export const metadata = {
  title: "Dashboard - Gatekeeper",
  description: "View and manage approval requests.",
};

export default async function DashboardPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  const supabase = await createClient();

  const { data: approvals } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("org_id", membership.org_id)
    .is("archived_at", null)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<ApprovalRequest[]>();

  const { data: connections } = await supabase
    .from("connections")
    .select("*")
    .eq("org_id", membership.org_id)
    .eq("is_active", true)
    .order("name")
    .returns<Connection[]>();

  // Build a map of connection_id → creator display name
  const creatorIds = [...new Set((connections ?? []).map((c) => c.created_by).filter(Boolean))];
  let connectionCreators: Record<string, string> = {};
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, full_name, email")
      .in("id", creatorIds)
      .returns<Pick<UserProfile, "id" | "full_name" | "email">[]>();

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name || p.email]));
    connectionCreators = Object.fromEntries(
      (connections ?? []).map((c) => [c.id, profileMap.get(c.created_by) ?? ""])
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="View and manage approval requests across your organization."
      />
      <ApprovalDashboard
        initialApprovals={approvals ?? []}
        connections={connections ?? []}
        connectionCreators={connectionCreators}
        canApprove={membership.can_approve ?? true}
        orgId={membership.org_id}
      />
    </PageContainer>
  );
}

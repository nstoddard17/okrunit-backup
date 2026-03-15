import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/v2/ui/page-container";
import { PageHeader } from "@/components/v2/layout/page-header";
import { ApprovalDashboardV2 } from "@/components/v2/approvals/approval-dashboard-v2";
import type { ApprovalRequest, Connection } from "@/lib/types/database";

export const metadata = {
  title: "Dashboard - Gatekeeper",
  description: "View and manage approval requests.",
};

export default async function DashboardV2Page() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  const supabase = await createClient();

  const { data: approvals } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("org_id", membership.org_id)
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

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="View and manage approval requests across your organization."
      />
      <ApprovalDashboardV2
        initialApprovals={approvals ?? []}
        connections={connections ?? []}
        canApprove={membership.can_approve ?? true}
        orgId={membership.org_id}
      />
    </PageContainer>
  );
}

import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ApprovalDashboard } from "@/components/approvals/approval-dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Requests - OKRunit",
  description: "View and manage approval requests.",
};

export default async function RequestsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  return (
    <PageContainer>
      <PageHeader
        title="Requests"
        description="View and manage approval requests across your organization."
      />
      <ApprovalDashboard
        canApprove={membership.can_approve ?? true}
        orgId={membership.org_id}
      />
    </PageContainer>
  );
}

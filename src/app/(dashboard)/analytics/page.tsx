import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Clock, CheckCircle, Timer, BarChart3 } from "lucide-react";

export const metadata = {
  title: "Analytics - OKRunit",
  description: "Dashboard analytics and approval statistics.",
};

export default async function AnalyticsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const orgId = ctx.membership.org_id;
  const admin = createAdminClient();

  // Simple count queries — no complex joins or filters
  const { count: total } = await admin
    .from("approval_requests")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId);

  const { count: pending } = await admin
    .from("approval_requests")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "pending");

  const { count: approved } = await admin
    .from("approval_requests")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "approved");

  const { count: rejected } = await admin
    .from("approval_requests")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "rejected");

  const approvedNum = approved ?? 0;
  const rejectedNum = rejected ?? 0;
  const decided = approvedNum + rejectedNum;
  const approvalRate =
    decided > 0 ? Math.round((approvedNum / decided) * 100) : 0;

  return (
    <PageContainer wide>
      <PageHeader
        title="Analytics"
        description="Approval statistics and trends for your organization."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Requests"
          value={total ?? 0}
          icon={BarChart3}
          subtitle="All time"
          iconColor="text-violet-500"
        />
        <StatCard
          title="Pending"
          value={pending ?? 0}
          icon={Clock}
          subtitle="Awaiting decision"
          iconColor="text-amber-500"
        />
        <StatCard
          title="Approval Rate"
          value={`${approvalRate}%`}
          icon={CheckCircle}
          subtitle={`${approvedNum} approved, ${rejectedNum} rejected`}
          iconColor="text-emerald-500"
        />
        <StatCard
          title="Decided"
          value={decided}
          icon={Timer}
          subtitle="Approved + rejected"
          iconColor="text-blue-500"
        />
      </div>

      <div className="mt-8 text-center text-muted-foreground">
        <p>Charts and detailed trends coming soon.</p>
      </div>
    </PageContainer>
  );
}

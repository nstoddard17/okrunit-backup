import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { getSlaMetrics } from "@/lib/api/sla";
import { SlaComplianceDashboard } from "@/components/analytics/sla-compliance-dashboard";
import type { SlaConfig } from "@/lib/types/database";

export const metadata = {
  title: "SLA Compliance - OKrunit",
  description: "Track SLA breach rates and compliance metrics.",
};

export default async function SlaCompliancePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership, org } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") {
    redirect("/requests");
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const metrics = await getSlaMetrics(membership.org_id, {
    from: thirtyDaysAgo.toISOString(),
    to: now.toISOString(),
  });

  return (
    <SlaComplianceDashboard
      metrics={metrics}
      slaConfig={org.sla_config as SlaConfig}
    />
  );
}

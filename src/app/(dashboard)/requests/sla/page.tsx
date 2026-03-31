import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { getSlaMetrics } from "@/lib/api/sla";
import { SlaComplianceDashboard } from "@/components/analytics/sla-compliance-dashboard";
import type { SlaConfig } from "@/lib/types/database";
import type { SlaMetrics } from "@/lib/api/sla";

export const metadata = {
  title: "SLA Compliance - OKrunit",
  description: "Track SLA breach rates and compliance metrics.",
};

// Demo data to preview the page layout with realistic numbers
const DEMO_METRICS: SlaMetrics = {
  total: 142,
  breached: 8,
  breach_rate: 5.63,
  avg_response_time_minutes: 22,
  per_priority: {
    critical: {
      total: 18,
      breached: 3,
      breach_rate: 16.67,
      avg_response_time_minutes: 11,
    },
    high: {
      total: 45,
      breached: 4,
      breach_rate: 8.89,
      avg_response_time_minutes: 38,
    },
    medium: {
      total: 52,
      breached: 1,
      breach_rate: 1.92,
      avg_response_time_minutes: 47,
    },
    low: {
      total: 27,
      breached: 0,
      breach_rate: 0,
      avg_response_time_minutes: 95,
    },
  },
};

export default async function SlaCompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership, org } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") {
    redirect("/requests");
  }

  const params = await searchParams;
  const showDemo = params.demo === "true";

  let metrics: SlaMetrics;

  if (showDemo) {
    metrics = DEMO_METRICS;
  } else {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    metrics = await getSlaMetrics(membership.org_id, {
      from: thirtyDaysAgo.toISOString(),
      to: now.toISOString(),
    });
  }

  return (
    <SlaComplianceDashboard
      metrics={metrics}
      slaConfig={org.sla_config as SlaConfig}
      showDemo={showDemo}
    />
  );
}

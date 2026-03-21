import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { VolumeChart } from "@/components/analytics/volume-chart";
import { ApprovalRateChart } from "@/components/analytics/approval-rate-chart";
import { ResponseTimeChart } from "@/components/analytics/response-time-chart";
import { Clock, CheckCircle, Timer, BarChart3 } from "lucide-react";
import type { ResponseTimeDataPoint } from "@/components/analytics/response-time-chart";
import type { VolumeDataPoint } from "@/components/analytics/volume-chart";
import type { ApprovalRateDataPoint } from "@/components/analytics/approval-rate-chart";

export const metadata = {
  title: "Analytics - OKRunit",
  description: "Dashboard analytics and approval statistics.",
};

function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dates.push(toDateKey(d));
  }
  return dates;
}

function formatResponseTime(ms: number): string {
  if (ms === 0) return "N/A";
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function calculateTrend(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

export default async function AnalyticsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  const orgId = membership.org_id;
  const admin = createAdminClient();

  const [
    { count: totalCount },
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    admin.from("approval_requests").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    admin.from("approval_requests").select("*", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "pending"),
    admin.from("approval_requests").select("*", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "approved"),
    admin.from("approval_requests").select("*", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "rejected"),
  ]);

  const approved = approvedCount ?? 0;
  const rejected = rejectedCount ?? 0;
  const decided = approved + rejected;
  const approvalRate = decided > 0 ? Math.round((approved / decided) * 10000) / 100 : 0;

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [{ count: volumeThisWeek }, { count: volumeLastWeek }] = await Promise.all([
    admin.from("approval_requests").select("*", { count: "exact", head: true }).eq("org_id", orgId).gte("created_at", oneWeekAgo.toISOString()),
    admin.from("approval_requests").select("*", { count: "exact", head: true }).eq("org_id", orgId).gte("created_at", twoWeeksAgo.toISOString()).lt("created_at", oneWeekAgo.toISOString()),
  ]);

  const { data: decidedApprovals } = await admin
    .from("approval_requests")
    .select("created_at, decided_at")
    .eq("org_id", orgId)
    .not("decided_at", "is", null)
    .in("status", ["approved", "rejected"]);

  let avgResponseTimeMs = 0;
  if (decidedApprovals && decidedApprovals.length > 0) {
    const totalMs = decidedApprovals.reduce((sum, row) => {
      const created = new Date(row.created_at).getTime();
      const decidedTime = new Date(row.decided_at!).getTime();
      return sum + (decidedTime - created);
    }, 0);
    avgResponseTimeMs = Math.round(totalMs / decidedApprovals.length);
  }

  const trend = calculateTrend(volumeThisWeek ?? 0, volumeLastWeek ?? 0);

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const { data: recentApprovals } = await admin
    .from("approval_requests")
    .select("created_at, decided_at, status")
    .eq("org_id", orgId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  const dateRange = getDateRange(30);

  const volumeByDate = new Map<string, number>();
  for (const date of dateRange) volumeByDate.set(date, 0);
  for (const row of recentApprovals ?? []) {
    const key = toDateKey(new Date(row.created_at));
    volumeByDate.set(key, (volumeByDate.get(key) ?? 0) + 1);
  }
  const volumeData: VolumeDataPoint[] = dateRange.map((date) => ({
    date,
    count: volumeByDate.get(date) ?? 0,
  }));

  const approvedByDate = new Map<string, number>();
  const rejectedByDate = new Map<string, number>();
  for (const date of dateRange) { approvedByDate.set(date, 0); rejectedByDate.set(date, 0); }
  for (const row of recentApprovals ?? []) {
    if (row.decided_at) {
      const key = toDateKey(new Date(row.decided_at));
      if (row.status === "approved") approvedByDate.set(key, (approvedByDate.get(key) ?? 0) + 1);
      else if (row.status === "rejected") rejectedByDate.set(key, (rejectedByDate.get(key) ?? 0) + 1);
    }
  }
  const approvalRateData: ApprovalRateDataPoint[] = dateRange.map((date) => ({
    date,
    approved: approvedByDate.get(date) ?? 0,
    rejected: rejectedByDate.get(date) ?? 0,
  }));

  const responseTimeByDate = new Map<string, { total: number; count: number }>();
  for (const date of dateRange) responseTimeByDate.set(date, { total: 0, count: 0 });
  for (const row of recentApprovals ?? []) {
    if (row.decided_at && (row.status === "approved" || row.status === "rejected")) {
      const key = toDateKey(new Date(row.decided_at));
      const entry = responseTimeByDate.get(key);
      if (entry) {
        entry.total += new Date(row.decided_at).getTime() - new Date(row.created_at).getTime();
        entry.count += 1;
      }
    }
  }
  const responseTimeData: ResponseTimeDataPoint[] = dateRange.map((date) => {
    const entry = responseTimeByDate.get(date);
    const avgMs = entry && entry.count > 0 ? entry.total / entry.count : 0;
    return { date, avg_response_time_hours: Math.round((avgMs / 3600000) * 100) / 100 };
  });

  const hasResponseData = responseTimeData.some((d) => d.avg_response_time_hours > 0);

  return (
    <PageContainer wide>
      <PageHeader
        title="Analytics"
        description="Approval statistics and trends for your organization."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Approvals"
          value={pendingCount ?? 0}
          icon={Clock}
          subtitle={`${totalCount ?? 0} total requests`}
          iconColor="text-amber-500"
        />
        <StatCard
          title="Approval Rate"
          value={`${approvalRate}%`}
          icon={CheckCircle}
          subtitle={`${approved} approved, ${rejected} rejected`}
          iconColor="text-emerald-500"
        />
        <StatCard
          title="Avg Response Time"
          value={formatResponseTime(avgResponseTimeMs)}
          icon={Timer}
          subtitle="Time to decision"
          iconColor="text-blue-500"
        />
        <StatCard
          title="Volume This Week"
          value={volumeThisWeek ?? 0}
          icon={BarChart3}
          trend={trend !== null ? { value: trend, label: "vs last week" } : undefined}
          subtitle={trend === null ? "No data from last week" : undefined}
          iconColor="text-violet-500"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <VolumeChart data={volumeData} />
        <ApprovalRateChart data={approvalRateData} />
      </div>

      {hasResponseData && (
        <div className="mt-6">
          <ResponseTimeChart data={responseTimeData} />
        </div>
      )}
    </PageContainer>
  );
}

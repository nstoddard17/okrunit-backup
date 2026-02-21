import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatsCards } from "@/components/analytics/stats-cards";
import { ResponseTimeChart } from "@/components/analytics/response-time-chart";
import { VolumeChart } from "@/components/analytics/volume-chart";
import { ApprovalRateChart } from "@/components/analytics/approval-rate-chart";
import type { AnalyticsStats } from "@/components/analytics/stats-cards";
import type { ResponseTimeDataPoint } from "@/components/analytics/response-time-chart";
import type { VolumeDataPoint } from "@/components/analytics/volume-chart";
import type { ApprovalRateDataPoint } from "@/components/analytics/approval-rate-chart";

export const metadata = {
  title: "Analytics - Gatekeeper",
  description: "Dashboard analytics and approval statistics.",
};

// ---- Helpers --------------------------------------------------------------

/**
 * Build a date string in YYYY-MM-DD format from a Date object.
 */
function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Generate an array of YYYY-MM-DD strings for the last N days (inclusive of today).
 */
function getDateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dates.push(toDateKey(d));
  }

  return dates;
}

// ---- Page -----------------------------------------------------------------

export default async function AnalyticsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  const orgId = membership.org_id;
  const admin = createAdminClient();

  // ------ Aggregate Stats (same logic as API route, fetched server-side) ------

  const [
    { count: totalCount },
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "pending"),
    admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "approved"),
    admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "rejected"),
  ]);

  const approved = approvedCount ?? 0;
  const rejected = rejectedCount ?? 0;
  const decided = approved + rejected;
  const approvalRate =
    decided > 0 ? Math.round((approved / decided) * 10000) / 100 : 0;

  // Volume this week vs last week
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [{ count: volumeThisWeek }, { count: volumeLastWeek }] =
    await Promise.all([
      admin
        .from("approval_requests")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .gte("created_at", oneWeekAgo.toISOString()),
      admin
        .from("approval_requests")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .gte("created_at", twoWeeksAgo.toISOString())
        .lt("created_at", oneWeekAgo.toISOString()),
    ]);

  // Average response time for decided approvals
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

  const stats: AnalyticsStats = {
    pending_count: pendingCount ?? 0,
    total_count: totalCount ?? 0,
    approved_count: approved,
    rejected_count: rejected,
    approval_rate: approvalRate,
    avg_response_time_ms: avgResponseTimeMs,
    volume_this_week: volumeThisWeek ?? 0,
    volume_last_week: volumeLastWeek ?? 0,
  };

  // ------ Time-Series Data (last 30 days) ------------------------------------

  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000,
  );

  const { data: recentApprovals } = await admin
    .from("approval_requests")
    .select("created_at, decided_at, status")
    .eq("org_id", orgId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  const dateRange = getDateRange(30);

  // --- Volume chart data: count of requests created per day ---
  const volumeByDate = new Map<string, number>();
  for (const date of dateRange) {
    volumeByDate.set(date, 0);
  }
  for (const row of recentApprovals ?? []) {
    const key = toDateKey(new Date(row.created_at));
    volumeByDate.set(key, (volumeByDate.get(key) ?? 0) + 1);
  }
  const volumeData: VolumeDataPoint[] = dateRange.map((date) => ({
    date,
    count: volumeByDate.get(date) ?? 0,
  }));

  // --- Approval rate chart data: approved vs rejected per day ---
  const approvedByDate = new Map<string, number>();
  const rejectedByDate = new Map<string, number>();
  for (const date of dateRange) {
    approvedByDate.set(date, 0);
    rejectedByDate.set(date, 0);
  }
  for (const row of recentApprovals ?? []) {
    if (row.decided_at) {
      const key = toDateKey(new Date(row.decided_at));
      if (row.status === "approved") {
        approvedByDate.set(key, (approvedByDate.get(key) ?? 0) + 1);
      } else if (row.status === "rejected") {
        rejectedByDate.set(key, (rejectedByDate.get(key) ?? 0) + 1);
      }
    }
  }
  const approvalRateData: ApprovalRateDataPoint[] = dateRange.map((date) => ({
    date,
    approved: approvedByDate.get(date) ?? 0,
    rejected: rejectedByDate.get(date) ?? 0,
  }));

  // --- Response time chart data: average response time per day ---
  const responseTimeByDate = new Map<string, { total: number; count: number }>();
  for (const date of dateRange) {
    responseTimeByDate.set(date, { total: 0, count: 0 });
  }
  for (const row of recentApprovals ?? []) {
    if (
      row.decided_at &&
      (row.status === "approved" || row.status === "rejected")
    ) {
      const key = toDateKey(new Date(row.decided_at));
      const entry = responseTimeByDate.get(key);
      if (entry) {
        const created = new Date(row.created_at).getTime();
        const decidedTime = new Date(row.decided_at).getTime();
        entry.total += decidedTime - created;
        entry.count += 1;
      }
    }
  }
  const responseTimeData: ResponseTimeDataPoint[] = dateRange.map((date) => {
    const entry = responseTimeByDate.get(date);
    const avgMs =
      entry && entry.count > 0 ? entry.total / entry.count : 0;
    return {
      date,
      avg_response_time_hours: Math.round((avgMs / 3600000) * 100) / 100,
    };
  });

  // Filter out leading zero-only days for cleaner charts
  const hasResponseData = responseTimeData.some(
    (d) => d.avg_response_time_hours > 0,
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Approval statistics and trends for your organization.
        </p>
      </div>

      {/* Summary stat cards */}
      <StatsCards stats={stats} />

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <VolumeChart data={volumeData} />
        <ApprovalRateChart data={approvalRateData} />
      </div>

      {/* Full-width response time chart */}
      {hasResponseData && (
        <ResponseTimeChart data={responseTimeData} />
      )}
    </div>
  );
}

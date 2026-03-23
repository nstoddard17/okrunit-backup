"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Clock, CheckCircle, Timer, BarChart3 } from "lucide-react";
import type { VolumeDataPoint } from "./volume-chart";
import type { ApprovalRateDataPoint } from "./approval-rate-chart";
import type { ResponseTimeDataPoint } from "./response-time-chart";
import { VolumeChart } from "./volume-chart";
import { ApprovalRateChart } from "./approval-rate-chart";
import { ResponseTimeChart } from "./response-time-chart";

// ---- Types ----------------------------------------------------------------

export interface AnalyticsDashboardProps {
  /** Stat card data — all primitives, safe to pass from server components */
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    decided: number;
    approvalRate: number;
  };
  /** Trend data compared to previous period */
  trends: {
    totalTrend: number | null;
    pendingTrend: number | null;
    approvalRateTrend: number | null;
    decidedTrend: number | null;
  };
  /** Chart data — arrays of serializable objects */
  volumeData: VolumeDataPoint[];
  approvalRateData: ApprovalRateDataPoint[];
  responseTimeData: ResponseTimeDataPoint[];
}

// ---- Component ------------------------------------------------------------

export function AnalyticsDashboard({
  stats,
  trends,
  volumeData,
  approvalRateData,
  responseTimeData,
}: AnalyticsDashboardProps) {
  const makeTrend = (value: number | null, label: string) =>
    value !== null ? { value, label } : undefined;

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Requests"
          value={stats.total}
          icon={BarChart3}
          subtitle={!trends.totalTrend ? "All time" : undefined}
          trend={makeTrend(trends.totalTrend, "vs last 30 days")}
          iconColor="text-violet-500"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          subtitle={!trends.pendingTrend ? "Awaiting decision" : undefined}
          trend={makeTrend(trends.pendingTrend, "vs last 30 days")}
          iconColor="text-amber-500"
        />
        <StatCard
          title="Approval Rate"
          value={`${stats.approvalRate}%`}
          icon={CheckCircle}
          subtitle={
            !trends.approvalRateTrend
              ? `${stats.approved} approved, ${stats.rejected} rejected`
              : undefined
          }
          trend={makeTrend(trends.approvalRateTrend, "vs last 30 days")}
          iconColor="text-emerald-500"
        />
        <StatCard
          title="Decided"
          value={stats.decided}
          icon={Timer}
          subtitle={!trends.decidedTrend ? "Approved + rejected" : undefined}
          trend={makeTrend(trends.decidedTrend, "vs last 30 days")}
          iconColor="text-blue-500"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <VolumeChart data={volumeData} />
        </div>
        <ApprovalRateChart data={approvalRateData} />
        <ResponseTimeChart data={responseTimeData} />
      </div>
    </div>
  );
}

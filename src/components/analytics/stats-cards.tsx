"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Clock,
  CheckCircle,
  Timer,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";

// ---- Types ----------------------------------------------------------------

export interface AnalyticsStats {
  pending_count: number;
  total_count: number;
  approved_count: number;
  rejected_count: number;
  approval_rate: number;
  avg_response_time_ms: number;
  volume_this_week: number;
  volume_last_week: number;
}

interface StatsCardsProps {
  stats: AnalyticsStats;
}

// ---- Helpers --------------------------------------------------------------

/**
 * Format milliseconds into a human-readable duration.
 * < 60 minutes: "Xm"
 * >= 60 minutes: "Xh Ym"
 */
function formatResponseTime(ms: number): string {
  if (ms === 0) return "N/A";

  const totalMinutes = Math.round(ms / 60000);

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

/**
 * Calculate the percentage change between two values.
 */
function calculateTrend(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

// ---- Component ------------------------------------------------------------

export function StatsCards({ stats }: StatsCardsProps) {
  const trend = calculateTrend(stats.volume_this_week, stats.volume_last_week);
  const trendIsPositive = trend !== null && trend >= 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Pending Approvals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pending Approvals
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending_count}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.total_count} total requests
          </p>
        </CardContent>
      </Card>

      {/* Approval Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Approval Rate
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.approval_rate}%</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.approved_count} approved, {stats.rejected_count} rejected
          </p>
        </CardContent>
      </Card>

      {/* Average Response Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg Response Time
          </CardTitle>
          <Timer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatResponseTime(stats.avg_response_time_ms)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Time to decision
          </p>
        </CardContent>
      </Card>

      {/* Volume This Week */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Volume This Week
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.volume_this_week}</div>
          {trend !== null ? (
            <div className="mt-1 flex items-center gap-1 text-xs">
              {trendIsPositive ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span
                className={
                  trendIsPositive ? "text-emerald-500" : "text-destructive"
                }
              >
                {trendIsPositive ? "+" : ""}
                {trend}%
              </span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              No data from last week
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

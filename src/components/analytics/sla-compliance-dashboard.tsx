"use client";

import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SlaMetrics } from "@/lib/api/sla";
import type { SlaConfig } from "@/lib/types/database";

const PRIORITIES = ["critical", "high", "medium", "low"] as const;

const PRIORITY_STYLES: Record<string, { color: string; bg: string }> = {
  critical: { color: "text-red-600", bg: "bg-red-500/10" },
  high: { color: "text-orange-600", bg: "bg-orange-500/10" },
  medium: { color: "text-blue-600", bg: "bg-blue-500/10" },
  low: { color: "text-zinc-500", bg: "bg-zinc-500/10" },
};

function formatMinutes(minutes: number): string {
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

function complianceColor(rate: number): string {
  if (rate >= 95) return "text-emerald-600";
  if (rate >= 80) return "text-amber-600";
  return "text-red-600";
}

function complianceBg(rate: number): string {
  if (rate >= 95) return "bg-emerald-500/10";
  if (rate >= 80) return "bg-amber-500/10";
  return "bg-red-500/10";
}

interface SlaComplianceDashboardProps {
  metrics: SlaMetrics;
  slaConfig: SlaConfig;
}

export function SlaComplianceDashboard({ metrics, slaConfig }: SlaComplianceDashboardProps) {
  const complianceRate = metrics.total > 0 ? Math.round((1 - metrics.breach_rate / 100) * 10000) / 100 : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-medium text-primary mb-0.5">Insights</p>
        <h1 className="text-xl font-semibold tracking-tight">SLA Compliance</h1>
        <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Compliance Rate */}
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-[var(--card)] px-4 py-3.5">
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", complianceBg(complianceRate))}>
            <ShieldCheck className={cn("size-5", complianceColor(complianceRate))} />
          </div>
          <div>
            <p className={cn("text-2xl font-bold tracking-tight leading-none", complianceColor(complianceRate))}>
              {complianceRate}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Compliance</p>
          </div>
        </div>

        {/* Total with SLA */}
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-[var(--card)] px-4 py-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
            <TrendingUp className="size-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight leading-none">{metrics.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Tracked</p>
          </div>
        </div>

        {/* Breached */}
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-[var(--card)] px-4 py-3.5">
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", metrics.breached > 0 ? "bg-red-500/10" : "bg-emerald-500/10")}>
            {metrics.breached > 0 ? (
              <ShieldAlert className="size-5 text-red-500" />
            ) : (
              <ShieldCheck className="size-5 text-emerald-500" />
            )}
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight leading-none">{metrics.breached}</p>
            <p className="text-xs text-muted-foreground mt-1">Breached</p>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-[var(--card)] px-4 py-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
            <Clock className="size-5 text-violet-500" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight leading-none">
              {metrics.avg_response_time_minutes > 0
                ? formatMinutes(metrics.avg_response_time_minutes)
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Avg Response</p>
          </div>
        </div>
      </div>

      {/* Per-priority breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Compliance by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.total === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <ShieldCheck className="size-6 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No SLA-tracked requests in the last 30 days</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Requests with SLA deadlines will appear here once they come in.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {PRIORITIES.map((priority) => {
                const data = metrics.per_priority[priority];
                const slaMinutes = slaConfig[priority];
                const priorityComplianceRate = data.total > 0
                  ? Math.round((1 - data.breach_rate / 100) * 10000) / 100
                  : 100;
                const style = PRIORITY_STYLES[priority];

                return (
                  <div key={priority} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs capitalize", style.color)}>
                          {priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          SLA: {slaMinutes ? formatMinutes(slaMinutes) : "Not set"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">
                          {data.total} tracked
                        </span>
                        {data.breached > 0 && (
                          <span className="flex items-center gap-1 text-red-500">
                            <AlertTriangle className="size-3" />
                            {data.breached} breached
                          </span>
                        )}
                        <span className={cn("font-semibold", data.total > 0 ? complianceColor(priorityComplianceRate) : "text-muted-foreground")}>
                          {data.total > 0 ? `${priorityComplianceRate}%` : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {data.total > 0 && (
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            priorityComplianceRate >= 95
                              ? "bg-emerald-500"
                              : priorityComplianceRate >= 80
                                ? "bg-amber-500"
                                : "bg-red-500",
                          )}
                          style={{ width: `${Math.min(100, priorityComplianceRate)}%` }}
                        />
                      </div>
                    )}

                    {/* Response time — only show when this priority has tracked requests */}
                    {data.total > 0 && data.avg_response_time_minutes > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        Avg response: {formatMinutes(data.avg_response_time_minutes)}
                        {slaMinutes && data.avg_response_time_minutes > slaMinutes && (
                          <span className="text-red-500 font-medium ml-1">
                            (exceeds SLA by {formatMinutes(data.avg_response_time_minutes - slaMinutes)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SLA Configuration reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Current SLA Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRIORITIES.map((priority) => {
              const minutes = slaConfig[priority];
              const style = PRIORITY_STYLES[priority];
              return (
                <div
                  key={priority}
                  className={cn("rounded-lg border border-border/50 px-3 py-2 text-center", style.bg)}
                >
                  <p className={cn("text-xs font-medium capitalize", style.color)}>{priority}</p>
                  <p className="text-lg font-bold mt-0.5">
                    {minutes ? formatMinutes(minutes) : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {minutes ? "target" : "no SLA"}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

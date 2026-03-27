"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DailyRequestData {
  date: string; // YYYY-MM-DD
  total: number;
  approved: number;
  rejected: number;
  pending: number;
}

export interface SourceBreakdown {
  source: string;
  count: number;
}

export interface PriorityBreakdown {
  priority: string;
  count: number;
}

interface UsageChartsProps {
  dailyData: DailyRequestData[];
  sourceBreakdown: SourceBreakdown[];
  priorityBreakdown: PriorityBreakdown[];
  planLimit: number | null; // null = unlimited
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLORS = {
  approved: "oklch(0.55 0.18 155)",
  rejected: "oklch(0.60 0.20 25)",
  pending: "oklch(0.75 0.15 75)",
};

const PIE_COLORS = [
  "oklch(0.55 0.18 155)",
  "oklch(0.55 0.15 250)",
  "oklch(0.65 0.20 25)",
  "oklch(0.75 0.15 75)",
  "oklch(0.55 0.15 300)",
  "oklch(0.60 0.12 200)",
  "oklch(0.70 0.10 50)",
  "oklch(0.50 0.15 170)",
];

const PRIORITY_COLORS: Record<string, string> = {
  critical: "oklch(0.60 0.20 25)",
  high: "oklch(0.70 0.18 50)",
  medium: "oklch(0.55 0.15 250)",
  low: "oklch(0.65 0.05 265)",
};

type TimeRange = "7d" | "30d";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UsageCharts({
  dailyData,
  sourceBreakdown,
  priorityBreakdown,
  planLimit,
}: UsageChartsProps) {
  const [range, setRange] = useState<TimeRange>("30d");

  const filteredData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (range === "7d" ? 7 : 30));
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return dailyData.filter((d) => d.date >= cutoffStr);
  }, [dailyData, range]);

  const totalInRange = filteredData.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="space-y-6">
      {/* Daily requests area chart */}
      <div className="rounded-xl border border-border/50 bg-[var(--card)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Daily Requests</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalInRange} total requests
              {planLimit !== null && (
                <span> &middot; {planLimit} plan limit</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border/50 p-0.5">
            {(["7d", "30d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  range === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === "7d" ? "7 days" : "30 days"}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.55 0.18 155)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="oklch(0.55 0.18 155)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => {
                  const d = new Date(v + "T00:00:00");
                  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                }}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(v) => {
                  const d = new Date(String(v) + "T00:00:00");
                  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="oklch(0.55 0.18 155)"
                strokeWidth={2}
                fill="url(#gradTotal)"
                name="Total"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status breakdown bar chart + pie charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status breakdown */}
        <div className="rounded-xl border border-border/50 bg-[var(--card)] p-5">
          <h3 className="text-sm font-semibold mb-1">By Status</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Approved, rejected, and pending requests
          </p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => {
                    const d = new Date(v + "T00:00:00");
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => {
                    const d = new Date(String(v) + "T00:00:00");
                    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  }}
                />
                <Bar dataKey="approved" stackId="a" fill={STATUS_COLORS.approved} name="Approved" radius={[0, 0, 0, 0]} />
                <Bar dataKey="rejected" stackId="a" fill={STATUS_COLORS.rejected} name="Rejected" />
                <Bar dataKey="pending" stackId="a" fill={STATUS_COLORS.pending} name="Pending" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source breakdown pie */}
        <div className="rounded-xl border border-border/50 bg-[var(--card)] p-5">
          <h3 className="text-sm font-semibold mb-1">By Source</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Where requests originate from
          </p>
          {sourceBreakdown.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="h-[180px] w-[180px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceBreakdown}
                      dataKey="count"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {sourceBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {sourceBreakdown.map((s, i) => (
                  <div key={s.source} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="capitalize text-xs">{s.source || "Unknown"}</span>
                    </div>
                    <span className="text-xs font-medium tabular-nums">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-12">No data yet</p>
          )}
        </div>
      </div>

      {/* Priority breakdown */}
      <div className="rounded-xl border border-border/50 bg-[var(--card)] p-5">
        <h3 className="text-sm font-semibold mb-1">By Priority</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Request volume by priority level
        </p>
        {priorityBreakdown.length > 0 ? (
          <div className="space-y-3">
            {priorityBreakdown.map((p) => {
              const total = priorityBreakdown.reduce((s, x) => s + x.count, 0);
              const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
              return (
                <div key={p.priority} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium capitalize">{p.priority}</span>
                    <span className="text-muted-foreground tabular-nums">{p.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: PRIORITY_COLORS[p.priority] ?? "var(--primary)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">No data yet</p>
        )}
      </div>
    </div>
  );
}

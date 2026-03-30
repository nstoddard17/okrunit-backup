"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bug,
  AlertTriangle,
  RotateCcw,
  Search,
  CheckCircle,
  EyeOff,
  RefreshCw,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ErrorIssue, ErrorSeverity, ErrorIssueStatus } from "@/lib/monitoring/types";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const SEVERITY_STYLES: Record<ErrorSeverity, string> = {
  fatal: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  error: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
};

const STATUS_STYLES: Record<ErrorIssueStatus, { color: string; icon: typeof Bug }> = {
  unresolved: { color: "text-red-500", icon: AlertTriangle },
  resolved: { color: "text-emerald-500", icon: CheckCircle },
  ignored: { color: "text-muted-foreground", icon: EyeOff },
  regressed: { color: "text-amber-500", icon: RotateCcw },
};

interface StatsData {
  unresolved: number;
  today: number;
  regressed: number;
}

export function ErrorMonitorTab() {
  const [issues, setIssues] = useState<ErrorIssue[]>([]);
  const [stats, setStats] = useState<StatsData>({ unresolved: 0, today: 0, regressed: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("unresolved");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("last_seen");

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (severityFilter && severityFilter !== "all") params.set("severity", severityFilter);
      if (search) params.set("search", search);
      params.set("sort", sort);
      params.set("limit", "50");

      const res = await fetch(`/api/v1/admin/errors?${params}`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues);
        setTotal(data.total);
        setStats(data.stats);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter, search, sort]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  async function handleStatusChange(issueId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/v1/admin/errors/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchIssues();
      }
    } catch {
      // Silently fail
    }
  }

  const statCards = [
    { label: "Unresolved", value: stats.unresolved, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Errors Today", value: stats.today, icon: Bug, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Regressions", value: stats.regressed, icon: RotateCcw, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-[var(--card)] px-4 py-3.5"
            >
              <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", stat.bg)}>
                <Icon className={cn("size-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search errors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-white dark:bg-zinc-900"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-zinc-900">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="unresolved">Unresolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="ignored">Ignored</SelectItem>
            <SelectItem value="regressed">Regressed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[130px] h-9 bg-white dark:bg-zinc-900">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="fatal">Fatal</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-zinc-900">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_seen">Last Seen</SelectItem>
            <SelectItem value="first_seen">First Seen</SelectItem>
            <SelectItem value="event_count">Most Events</SelectItem>
            <SelectItem value="affected_users">Most Users</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchIssues} className="h-9 gap-1.5 bg-white dark:bg-zinc-900">
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Issues list */}
      {issues.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16 text-center">
          <Bug className="size-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No errors found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {statusFilter !== "all" || severityFilter !== "all" || search
              ? "Try adjusting your filters"
              : "Errors will appear here when they occur in production"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => {
            const statusConfig = STATUS_STYLES[issue.status];
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={issue.id}
                className="group flex items-start gap-3 rounded-xl border border-border/50 bg-[var(--card)] px-4 py-3 transition-colors hover:border-border"
              >
                {/* Status icon */}
                <StatusIcon className={cn("size-4 mt-0.5 shrink-0", statusConfig.color)} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/errors/${issue.id}`}
                      className="text-sm font-medium truncate hover:underline"
                    >
                      {issue.title}
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    <Badge variant="secondary" className={cn("text-[10px]", SEVERITY_STYLES[issue.severity])}>
                      {issue.severity}
                    </Badge>
                    {issue.service && (
                      <Badge variant="secondary" className="text-[10px]">
                        {issue.service}
                      </Badge>
                    )}
                    <span className="flex items-center gap-1">
                      <TrendingUp className="size-3" />
                      {issue.event_count} event{issue.event_count !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3" />
                      {issue.affected_users} user{issue.affected_users !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {timeAgo(issue.last_seen_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {issue.status !== "resolved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 bg-white dark:bg-card"
                      onClick={() => handleStatusChange(issue.id, "resolved")}
                    >
                      <CheckCircle className="size-3 text-emerald-500" />
                      Resolve
                    </Button>
                  )}
                  {issue.status !== "ignored" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 bg-white dark:bg-card"
                      onClick={() => handleStatusChange(issue.id, "ignored")}
                    >
                      <EyeOff className="size-3 text-muted-foreground" />
                      Ignore
                    </Button>
                  )}
                  {(issue.status === "resolved" || issue.status === "ignored") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 bg-white dark:bg-card"
                      onClick={() => handleStatusChange(issue.id, "unresolved")}
                    >
                      <RotateCcw className="size-3 text-amber-500" />
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > issues.length && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {issues.length} of {total} issues
        </p>
      )}
    </div>
  );
}

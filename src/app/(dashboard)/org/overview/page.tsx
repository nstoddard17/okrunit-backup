import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getOrgContext } from "@/lib/org-context";
import { JoinedToast } from "@/components/org/joined-toast";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SourceAvatar, SourceBadge } from "@/components/approvals/source-icons";
import {
  Hourglass,
  ShieldCheck,
  Unplug,
  UsersRound,
  ArrowUpRight,
  Clock,
  ClipboardList,
  TrendingUp,
  Activity,
  User2,
} from "lucide-react";
import type { ApprovalRequest } from "@/lib/types/database";

export const metadata = {
  title: "Overview - OKrunit",
  description: "Organization overview and quick actions.",
};

export default async function V2OrgOverviewPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership, org } = ctx;

  const admin = createAdminClient();
  const supabase = await createClient();

  const [
    { data: statusRows },
    { count: connectionCount },
    { count: memberCount },
    { data: recentActivity },
  ] = await Promise.all([
    // Single query for all status counts instead of 3 separate COUNT queries
    admin
      .from("approval_requests")
      .select("status")
      .eq("org_id", org.id)
      .in("status", ["pending", "approved", "rejected"]),
    admin
      .from("connections")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id),
    admin
      .from("org_memberships")
      .select("*", { count: "exact", head: true })
      .eq("org_id", membership.org_id),
    supabase
      .from("approval_requests")
      .select("id, title, status, priority, action_type, source, created_at, decided_at, connection_id, created_by")
      .eq("org_id", membership.org_id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  // Count statuses from single query result
  const statusCounts = { pending: 0, approved: 0, rejected: 0 };
  for (const row of statusRows ?? []) {
    if (row.status in statusCounts) statusCounts[row.status as keyof typeof statusCounts]++;
  }
  const pendingCount = statusCounts.pending;
  const approvedCount = statusCounts.approved;
  const rejectedCount = statusCounts.rejected;

  // Build connection + creator lookups in parallel (previously sequential)
  const connectionIds = [...new Set(
    (recentActivity ?? [])
      .map((a) => a.connection_id)
      .filter(Boolean) as string[]
  )];

  const creatorUserIds = [...new Set(
    (recentActivity ?? [])
      .map((a) => (a.created_by as ApprovalRequest["created_by"])?.user_id)
      .filter(Boolean) as string[]
  )];

  const [connectionNameMap, creatorNameMap] = await Promise.all([
    // Connection names
    connectionIds.length > 0
      ? supabase
          .from("connections")
          .select("id, name")
          .in("id", connectionIds)
          .then(({ data }) =>
            Object.fromEntries((data ?? []).map((c) => [c.id, c.name]))
          )
      : Promise.resolve({} as Record<string, string>),
    // Creator profiles
    creatorUserIds.length > 0
      ? admin
          .from("user_profiles")
          .select("id, full_name, email")
          .in("id", creatorUserIds)
          .then(({ data }) =>
            Object.fromEntries(
              (data ?? []).map((p) => [p.id, p.full_name || p.email || p.id.slice(0, 8)])
            )
          )
      : Promise.resolve({} as Record<string, string>),
  ]);

  const isAdmin = membership.role === "owner" || membership.role === "admin";
  const totalRequests = (approvedCount ?? 0) + (rejectedCount ?? 0) + (pendingCount ?? 0);
  const approvalRate = totalRequests > 0 ? Math.round(((approvedCount ?? 0) / totalRequests) * 100) : 0;

  const stats = [
    {
      label: "Pending",
      value: pendingCount ?? 0,
      icon: Hourglass,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      href: "/requests",
    },
    {
      label: "Approved",
      value: approvedCount ?? 0,
      icon: ShieldCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: null,
    },
    {
      label: "Approval Rate",
      value: `${approvalRate}%`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: null,
    },
    {
      label: "Connections",
      value: connectionCount ?? 0,
      icon: Unplug,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/requests/connections",
    },
    {
      label: "Members",
      value: memberCount ?? 0,
      icon: UsersRound,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      href: "/org/members",
    },
  ];

  const statusBorderColor: Record<string, string> = {
    pending: "border-l-amber-400",
    approved: "border-l-emerald-400",
    rejected: "border-l-red-400",
    cancelled: "border-l-zinc-300",
    expired: "border-l-zinc-300",
  };

  const statusBadgeStyle: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
    cancelled: "bg-zinc-100 text-zinc-600",
    expired: "bg-zinc-100 text-zinc-600",
  };

  const priorityStyle: Record<string, string> = {
    critical: "border border-red-300 text-red-600 bg-transparent",
    high: "border border-orange-300 text-orange-600 bg-transparent",
    medium: "border border-blue-300 text-blue-600 bg-transparent",
    low: "border border-zinc-300 text-zinc-500 bg-transparent",
  };

  return (
    <div className="space-y-8">
      <Suspense><JoinedToast /></Suspense>
      {/* Org header — only on overview */}
      <div>
        <p className="text-xs font-medium text-primary mb-0.5">Organization</p>
        <h1 className="text-xl font-semibold tracking-tight">{org.name}</h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const inner = (
            <div className="group relative flex items-center gap-3 rounded-xl border border-border/50 bg-[var(--card)] px-4 py-3.5 transition-colors hover:border-border">
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                <Icon className={`size-5 ${stat.color}`} strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
              {stat.href && (
                <ArrowUpRight className="absolute right-3 top-3 size-3.5 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" />
              )}
            </div>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href}>{inner}</Link>
          ) : (
            <div key={stat.label}>{inner}</div>
          );
        })}
      </div>

      {/* Recent activity — request card style */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Recent Activity</h2>
          </div>
          <Link
            href="/requests"
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View all
          </Link>
        </div>

        {recentActivity && recentActivity.length > 0 ? (
          <div className="grid gap-3">
            {recentActivity.map((item) => (
              <Link
                key={item.id}
                href="/requests"
                className={`group flex items-center gap-3 rounded-xl border-0 border-l-4 bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)] ${
                  statusBorderColor[item.status] ?? "border-l-zinc-300"
                }`}
              >
                {/* Source icon */}
                <SourceAvatar
                  approval={item as unknown as ApprovalRequest}
                  connectionName={item.connection_id ? connectionNameMap[item.connection_id] : undefined}
                  size="md"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.status === "pending" && (
                      <span className="relative flex size-2 shrink-0">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                      </span>
                    )}
                    <p className="truncate text-sm font-medium">{item.title}</p>
                  </div>
                  <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                    {/* Source */}
                    <SourceBadge
                      approval={item as unknown as ApprovalRequest}
                      connectionName={item.connection_id ? connectionNameMap[item.connection_id] : undefined}
                    />
                    {/* Creator */}
                    {item.created_by && (
                      <>
                        <span className="text-muted-foreground/40">|</span>
                        <span className="flex items-center gap-1 truncate">
                          <User2 className="size-3 shrink-0" />
                          {(() => {
                            const cb = item.created_by as ApprovalRequest["created_by"];
                            if (cb?.user_id && creatorNameMap[cb.user_id]) return creatorNameMap[cb.user_id];
                            return cb?.connection_name ?? cb?.client_name ?? "API";
                          })()}
                        </span>
                      </>
                    )}
                    {item.action_type && (
                      <>
                        <span className="text-muted-foreground/40">|</span>
                        <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">
                          {item.action_type}
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground/40">|</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {item.priority && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                      priorityStyle[item.priority] ?? "bg-zinc-100 text-zinc-600"
                    }`}>
                      {item.priority}
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                    statusBadgeStyle[item.status] ?? "bg-zinc-100 text-zinc-600"
                  }`}>
                    {item.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16 text-center">
            <ClipboardList className="size-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No requests yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Requests will appear here as they come in
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

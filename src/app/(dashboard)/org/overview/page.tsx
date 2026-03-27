import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Hourglass,
  ShieldCheck,
  Unplug,
  UsersRound,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  ClipboardList,
  TrendingUp,
  Activity,
} from "lucide-react";

export const metadata = {
  title: "Overview - OKRunit",
  description: "Organization overview and quick actions.",
};

export default async function V2OrgOverviewPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership, org } = ctx;

  const admin = createAdminClient();
  const supabase = await createClient();

  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
    { count: connectionCount },
    { count: memberCount },
    { data: recentActivity },
  ] = await Promise.all([
    admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id)
      .eq("status", "pending"),
    admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id)
      .eq("status", "approved"),
    admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id)
      .eq("status", "rejected"),
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
      .select("id, title, status, created_at, decided_at")
      .eq("org_id", membership.org_id)
      .order("created_at", { ascending: false })
      .limit(8),
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

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const inner = (
            <div className="group relative rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-border">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex size-9 items-center justify-center rounded-lg ${stat.bg}`}>
                  <Icon className={`size-4.5 ${stat.color}`} strokeWidth={1.75} />
                </div>
                {stat.href && (
                  <ArrowUpRight className="size-3.5 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
                )}
              </div>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href}>{inner}</Link>
          ) : (
            <div key={stat.label}>{inner}</div>
          );
        })}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="lg:col-span-2">
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
            <div className="rounded-xl border border-border/50 divide-y divide-border/40">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                    item.status === "pending"
                      ? "bg-amber-500/10 text-amber-500"
                      : item.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : item.status === "rejected"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-muted text-muted-foreground"
                  }`}>
                    {item.status === "pending" ? (
                      <Clock className="size-3.5" />
                    ) : item.status === "approved" ? (
                      <CheckCircle className="size-3.5" />
                    ) : (
                      <XCircle className="size-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground/60">
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${
                    item.status === "pending"
                      ? "bg-amber-500/10 text-amber-600"
                      : item.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : item.status === "rejected"
                          ? "bg-red-500/10 text-red-600"
                          : "bg-muted text-muted-foreground"
                  }`}>
                    {item.status}
                  </span>
                </div>
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

        {/* Sidebar - Metrics & Quick Links */}
        <div className="space-y-6">
          {/* Approval rate */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Metrics</h2>
            </div>
            <div className="rounded-xl border border-border/50 p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Approval rate</span>
                  <span className="font-semibold">{approvalRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${approvalRate}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-lg font-bold">{totalRequests}</p>
                  <p className="text-[11px] text-muted-foreground">Total requests</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-lg font-bold">{rejectedCount ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground">Rejected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick links */}
          {isAdmin && (
            <div>
              <h2 className="text-sm font-semibold mb-3">Quick Links</h2>
              <div className="space-y-1.5">
                {[
                  { label: "Pending requests", href: "/requests", count: pendingCount },
                  { label: "Connections", href: "/requests/connections", count: connectionCount },
                  { label: "Invite members", href: "/org/invites", count: null },
                  { label: "API Playground", href: "/playground", count: null },
                ].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="text-muted-foreground hover:text-foreground transition-colors">{link.label}</span>
                    {link.count !== null && link.count !== undefined && (link.count ?? 0) > 0 && (
                      <span className="text-xs font-medium text-muted-foreground bg-muted rounded-md px-1.5 py-0.5">
                        {link.count}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getOrgContext } from "@/lib/org-context";
import { JoinedToast } from "@/components/org/joined-toast";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { OnboardingTutorial } from "@/components/onboarding/onboarding-tutorial";
import { RecentActivity } from "@/components/overview/recent-activity";
import {
  AlertTriangle,
  Hourglass,
  ShieldCheck,
  Unplug,
  UsersRound,
  ArrowUpRight,
  TrendingUp,
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
    { count: slaBreachedCount },
    { count: escalatedCount },
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
    // SLA breached pending requests
    admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id)
      .eq("status", "pending")
      .eq("sla_breached", true),
    // Currently escalated requests
    admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id)
      .eq("status", "pending")
      .gt("escalation_level", 0),
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


  return (
    <div className="space-y-8">
      <Suspense><JoinedToast /></Suspense>
      {/* Alert banners */}
      {(slaBreachedCount ?? 0) > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="font-medium">{slaBreachedCount} pending request{(slaBreachedCount ?? 0) !== 1 ? "s have" : " has"} breached SLA deadlines.</span>
          <Link href="/requests" className="ml-auto text-xs font-medium underline">View</Link>
        </div>
      )}
      {(escalatedCount ?? 0) > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="font-medium">{escalatedCount} request{(escalatedCount ?? 0) !== 1 ? "s are" : " is"} currently escalated.</span>
          <Link href="/requests" className="ml-auto text-xs font-medium underline">View</Link>
        </div>
      )}

      {/* Onboarding tutorial — shown until dismissed */}
      <OnboardingTutorial />

      {/* Org header — only on overview */}
      <div data-tour="overview-main" className="space-y-8">
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

        {/* Recent activity — realtime client component */}
        <RecentActivity
          initialItems={(recentActivity ?? []) as unknown as ApprovalRequest[]}
          connectionNameMap={connectionNameMap}
          creatorNameMap={creatorNameMap}
          orgId={org.id}
        />
      </div>
    </div>
  );
}

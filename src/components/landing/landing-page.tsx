"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock3,
  Filter,
  Home,
  KeyRound,
  MessageSquare,
  Plus,
  Route,
  Settings,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { HeroNav } from "@/components/landing/hero-nav";
import { PriorityBadge } from "@/components/approvals/priority-badge";
import { SOURCE_CONFIG } from "@/components/approvals/source-icons";
import { PLATFORM_ICONS } from "@/components/messaging/platform-card";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ApprovalPriority, MessagingPlatform } from "@/lib/types/database";
import type { LucideIcon } from "lucide-react";

interface LandingPageProps {
  user: { email: string; full_name: string | null } | null;
}

type ProductSource = keyof typeof SOURCE_CONFIG;
type RequestStatus = "pending" | "approved" | "rejected";
type MetricTone = "amber" | "emerald" | "blue";

interface RequestItem {
  title: string;
  source: ProductSource;
  priority: ApprovalPriority;
  status: RequestStatus;
  age: string;
  actionType: string;
  owner: string;
}

interface MetricItem {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  tone: MetricTone;
}

interface QuickActionItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface AuditEntry {
  time: string;
  action: string;
  resourceType: string;
  resourceId: string;
  actor: string;
  ip: string;
  details?: string;
}

const sourceOrder: ProductSource[] = ["zapier", "make", "n8n", "api", "windmill"];

const heroMetrics: MetricItem[] = [
  {
    title: "Pending Requests",
    value: "12",
    subtitle: "Awaiting decision",
    icon: Clock3,
    tone: "amber",
  },
  {
    title: "Approved Today",
    value: "184",
    subtitle: "92% approval rate",
    icon: CheckCircle2,
    tone: "emerald",
  },
  {
    title: "Active Connections",
    value: "8",
    subtitle: "Zapier, Make, n8n, API",
    icon: KeyRound,
    tone: "blue",
  },
];

const queueAttention: RequestItem[] = [
  {
    title: "Deploy v3.2 to production",
    source: "api",
    priority: "critical",
    status: "pending",
    age: "2m ago",
    actionType: "deploy.production",
    owner: "Ops",
  },
  {
    title: "Delete 10,247 stale user records",
    source: "zapier",
    priority: "high",
    status: "pending",
    age: "5m ago",
    actionType: "bulk_delete",
    owner: "Operations",
  },
  {
    title: "Update billing address for Acme Corp",
    source: "make",
    priority: "medium",
    status: "pending",
    age: "9m ago",
    actionType: "crm.update",
    owner: "Revenue",
  },
];

const queueResolved: RequestItem[] = [
  {
    title: "Rotate webhook signing secret",
    source: "api",
    priority: "medium",
    status: "approved",
    age: "14m ago",
    actionType: "key.rotate",
    owner: "Platform",
  },
  {
    title: "Send bulk notification to 50k users",
    source: "n8n",
    priority: "high",
    status: "rejected",
    age: "18m ago",
    actionType: "notification.bulk",
    owner: "Lifecycle",
  },
  {
    title: "Archive 1,200 inactive accounts",
    source: "zapier",
    priority: "medium",
    status: "approved",
    age: "22m ago",
    actionType: "account.archive",
    owner: "Operations",
  },
];

const quickActions: QuickActionItem[] = [
  {
    href: "/requests",
    label: "View pending requests",
    icon: ClipboardList,
    badge: "12",
  },
  {
    href: "/connections",
    label: "Create connection",
    icon: Plus,
  },
  {
    href: "/org/invites",
    label: "Invite team member",
    icon: UserPlus,
  },
  {
    href: "/playground",
    label: "API Playground",
    icon: KeyRound,
  },
];

const approvalStateItems: RequestItem[] = [
  {
    title: "Run nightly customer export",
    source: "make",
    priority: "medium",
    status: "approved",
    age: "27m ago",
    actionType: "export.customer",
    owner: "Revenue",
  },
  {
    title: "Purge abandoned trial workspaces",
    source: "zapier",
    priority: "high",
    status: "rejected",
    age: "41m ago",
    actionType: "workspace.purge",
    owner: "Support",
  },
  {
    title: "Grant finance role to contractor",
    source: "api",
    priority: "critical",
    status: "pending",
    age: "1h ago",
    actionType: "role.assign",
    owner: "Security",
  },
];

const queueDeepDiveAttention: RequestItem[] = [
  ...queueAttention,
  {
    title: "Rotate production database password",
    source: "windmill",
    priority: "critical",
    status: "pending",
    age: "12m ago",
    actionType: "db.rotate",
    owner: "Platform",
  },
];

const queueDeepDiveResolved: RequestItem[] = [
  ...queueResolved,
  {
    title: "Re-run billing sync for Q2 invoices",
    source: "make",
    priority: "low",
    status: "approved",
    age: "31m ago",
    actionType: "billing.sync",
    owner: "Finance",
  },
];

const routePlatforms: Record<
  MessagingPlatform,
  { label: string; color: string }
> = {
  slack: { label: "Slack", color: "#4A154B" },
  discord: { label: "Discord", color: "#5865F2" },
  teams: { label: "Microsoft Teams", color: "#6264A7" },
  telegram: { label: "Telegram", color: "#0088CC" },
};

const routingOutcomes: RequestItem[] = [
  {
    title: "Deploy v3.2 to production",
    source: "api",
    priority: "critical",
    status: "pending",
    age: "2m ago",
    actionType: "deploy.production",
    owner: "#ops-critical",
  },
  {
    title: "Archive 1,200 inactive accounts",
    source: "zapier",
    priority: "medium",
    status: "approved",
    age: "22m ago",
    actionType: "account.archive",
    owner: "RevOps",
  },
  {
    title: "Send bulk notification to 50k users",
    source: "n8n",
    priority: "high",
    status: "rejected",
    age: "18m ago",
    actionType: "notification.bulk",
    owner: "Lifecycle",
  },
];

const auditEntries: AuditEntry[] = [
  {
    time: "1m ago",
    action: "approval.approve",
    resourceType: "approval_request",
    resourceId: "req_01HZZ9V4V4S9Y6WQJ3",
    actor: "User: sarah.k",
    ip: "76.29.14.8",
  },
  {
    time: "4m ago",
    action: "flow.update",
    resourceType: "approval_flow",
    resourceId: "flow_prod_deploy",
    actor: "User: mike.r",
    ip: "76.29.14.8",
    details: `{
  "approver_mode": "designated",
  "required_approvals": 2,
  "is_sequential": true
}`,
  },
  {
    time: "7m ago",
    action: "approval.reject",
    resourceType: "approval_request",
    resourceId: "req_01HZZ9S8BEMAZR6Y3Q",
    actor: "User: priya.n",
    ip: "41.82.110.13",
  },
  {
    time: "11m ago",
    action: "route.update",
    resourceType: "messaging_connection",
    resourceId: "slack_ops_critical",
    actor: "User: sarah.k",
    ip: "76.29.14.8",
  },
  {
    time: "14m ago",
    action: "approval.create",
    resourceType: "approval_request",
    resourceId: "req_01HZZ9Q9X31W7V2ZP5",
    actor: "Conn: api_prod",
    ip: "34.221.19.44",
  },
];

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let timer: number | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        timer = window.setTimeout(() => setVisible(true), delay);
        observer.disconnect();
      },
      { threshold: 0.08 },
    );

    observer.observe(element);
    return () => {
      if (timer) window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        visible
          ? "translate-y-0 opacity-100 scale-100 blur-0"
          : "translate-y-8 opacity-0 scale-[0.98] blur-[2px]",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <Badge
      variant="outline"
      className="rounded-full border-emerald-200 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
    >
      {children}
    </Badge>
  );
}

function SourcePill({
  source,
  showLabel = true,
  size = "md",
}: {
  source: ProductSource;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  const config = SOURCE_CONFIG[source];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        showLabel ? "gap-2 pl-1.5 pr-3" : "p-1.5",
        size === "sm" ? "py-1" : "py-1.5",
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full",
          size === "sm" ? "size-6" : "size-7",
          config.bgColor,
        )}
      >
        <Icon className={cn(size === "sm" ? "size-3" : "size-3.5", config.color)} />
      </span>
      {showLabel && (
        <span className="text-xs font-medium text-slate-700">{config.label}</span>
      )}
    </span>
  );
}

function StatusPill({ status }: { status: RequestStatus }) {
  const config = {
    pending: {
      label: "Pending",
      icon: Clock3,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    approved: {
      label: "Approved",
      icon: CheckCircle2,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    rejected: {
      label: "Rejected",
      icon: XCircle,
      className: "border-red-200 bg-red-50 text-red-700",
    },
  }[status];

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border px-2.5 py-1 text-[11px] font-semibold shadow-none",
        config.className,
      )}
    >
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}

function MetricCard({
  metric,
  className,
}: {
  metric: MetricItem;
  className?: string;
}) {
  const Icon = metric.icon;
  const tone = {
    amber: {
      wrap: "border-amber-200 bg-amber-50",
      icon: "text-amber-600",
      dot: "bg-amber-500",
    },
    emerald: {
      wrap: "border-emerald-200 bg-emerald-50",
      icon: "text-emerald-600",
      dot: "bg-emerald-500",
    },
    blue: {
      wrap: "border-sky-200 bg-sky-50",
      icon: "text-sky-600",
      dot: "bg-sky-500",
    },
  }[metric.tone];

  return (
    <Card
      className={cn(
        "w-full max-w-[240px] gap-0 rounded-[26px] border-white/80 bg-white/95 py-0 lp-shadow-float",
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {metric.title}
            </p>
            <p className="text-4xl font-semibold leading-none tracking-tight text-slate-950">
              {metric.value}
            </p>
          </div>
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl border",
              tone.wrap,
            )}
          >
            <Icon className={cn("size-5", tone.icon)} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
          <span className={cn("size-2 rounded-full", tone.dot)} />
          <span>{metric.subtitle}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function SidebarContext() {
  const navItems = [
    { label: "Org", icon: Home, active: false },
    { label: "Requests", icon: ClipboardList, active: true, badge: "12" },
    { label: "Connections", icon: KeyRound, active: false },
    { label: "Routes", icon: Route, active: false },
    { label: "Messaging", icon: MessageSquare, active: false },
    { label: "Analytics", icon: BarChart3, active: false },
    { label: "Settings", icon: Settings, active: false },
  ];

  return (
    <div className="w-[118px] rounded-[30px] border border-white/15 bg-[linear-gradient(180deg,var(--sidebar-gradient-from),var(--sidebar-gradient-to))] p-3 text-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
      <div className="mb-4 flex items-center justify-center rounded-[22px] bg-white/12 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
        <Image
          src="/logo-icon.png"
          alt="OKRunit"
          width={44}
          height={44}
          className="size-11 object-contain"
        />
      </div>
      <div className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={cn(
                "group flex flex-col items-center gap-1 rounded-[18px] px-2 py-2.5 text-center transition-colors",
                item.active ? "bg-white/16 text-white" : "text-white/76 hover:bg-white/10",
              )}
            >
              <div className="relative flex size-9 items-center justify-center rounded-2xl bg-white/10">
                <Icon className="size-[18px]" />
                {item.badge && (
                  <span className="absolute -right-1 -top-1 flex size-[18px] items-center justify-center rounded-full bg-white text-[9px] font-bold text-[var(--sidebar-gradient-to)]">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 border-t border-white/15 pt-3">
        <div className="rounded-[18px] bg-white/10 px-3 py-2 text-center text-[10px] font-medium text-white/80">
          More
        </div>
      </div>
    </div>
  );
}

function RequestRow({
  item,
  compact = false,
  subdued = false,
  showChevron = true,
}: {
  item: RequestItem;
  compact?: boolean;
  subdued?: boolean;
  showChevron?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[22px] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        compact && "px-3.5 py-3",
        subdued && "opacity-80",
      )}
    >
      <SourcePill source={item.source} showLabel={false} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {item.status === "pending" && (
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-full rounded-full bg-amber-400 opacity-75 lp-pulse-dot" />
              <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
            </span>
          )}
          <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{SOURCE_CONFIG[item.source].label}</span>
          <span className="text-slate-300">·</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
            {item.actionType}
          </span>
          <span className="text-slate-300">·</span>
          <span>{item.age}</span>
          <span className="text-slate-300">·</span>
          <span>{item.owner}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden sm:block">
          <PriorityBadge priority={item.priority} />
        </div>
        <StatusPill status={item.status} />
        {showChevron && <ChevronRight className="hidden size-4 text-slate-300 sm:block" />}
      </div>
    </div>
  );
}

function QueuePanel({
  attentionItems,
  resolvedItems,
  title = "Approval Queue",
  description = "Requests grouped the same way the dashboard surfaces them: pending first, resolved beneath.",
}: {
  attentionItems: RequestItem[];
  resolvedItems: RequestItem[];
  title?: string;
  description?: string;
}) {
  return (
    <Card className="overflow-hidden rounded-[32px] border-white/70 bg-white/95 py-0 lp-shadow-hero">
      <CardHeader className="border-b border-slate-100 px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <CardTitle className="text-lg text-slate-950">{title}</CardTitle>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 justify-start px-0 text-sm text-slate-600 md:justify-center md:px-3"
          >
            <Link href="/requests">
              View all requests
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            Needs Your Attention
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600"
          >
            Live Queue
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600"
          >
            Status First
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">Needs Your Attention</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {attentionItems.length}
            </span>
          </div>
          <div className="space-y-3">
            {attentionItems.map((item) => (
              <RequestRow key={`${item.title}-${item.age}`} item={item} compact />
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">Previously Resolved</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
              {resolvedItems.length}
            </span>
          </div>
          <div className="space-y-3">
            {resolvedItems.map((item) => (
              <RequestRow
                key={`${item.title}-${item.age}`}
                item={item}
                compact
                subdued
                showChevron={false}
              />
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function QuickActionsPanel({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[28px] border-white/80 bg-white/95 py-0 lp-shadow-float",
        className,
      )}
    >
      <CardHeader className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base text-slate-950">Quick Actions</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              The same shortcut panel from org overview, lifted into the hero.
            </p>
          </div>
          <Badge
            variant="outline"
            className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
          >
            Admin
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-5">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="outline"
              className="h-12 w-full justify-start gap-2 rounded-2xl border-slate-200 bg-white text-left text-sm"
              asChild
            >
              <Link href={action.href}>
                <Icon className="size-4 text-primary" />
                <span>{action.label}</span>
                {action.badge && (
                  <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {action.badge}
                  </span>
                )}
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}

function MetaField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5 rounded-[20px] border border-slate-200/80 bg-slate-50/80 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <div className="text-sm font-medium text-slate-900">{children}</div>
    </div>
  );
}

function ApprovalDecisionCard({ className }: { className?: string }) {
  const approvers = [
    { name: "Sarah K.", state: "done" },
    { name: "Mike R.", state: "next" },
    { name: "Priya N.", state: "waiting" },
  ] as const;

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[30px] border-white/80 bg-white/98 py-0 lp-shadow-float",
        className,
      )}
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status="pending" />
          <PriorityBadge priority="critical" />
        </div>
        <h3 className="mt-3 text-lg font-semibold text-slate-950">
          Deploy v3.2 to production
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          API source · deploy.production · created 2m ago
        </p>
      </div>
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <MetaField label="Source">
            <SourcePill source="api" size="sm" />
          </MetaField>
          <MetaField label="Required Role">
            <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">
              Admin+
            </Badge>
          </MetaField>
          <MetaField label="Action Type">
            <span className="font-mono text-xs text-slate-700">deploy.production</span>
          </MetaField>
          <MetaField label="Created By">api-prod connection</MetaField>
        </div>

        <div className="rounded-[24px] border border-slate-200/80 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-slate-500" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Approval Chain
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900">2 of 3 approvals required</span>
            <span className="text-slate-500">67%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full w-2/3 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-4 space-y-2.5">
            {approvers.map((approver) => (
              <div key={approver.name} className="flex items-center gap-2.5 text-sm">
                {approver.state === "done" ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : approver.state === "next" ? (
                  <ArrowRight className="size-4 text-sky-600" />
                ) : (
                  <Circle className="size-4 text-slate-300" />
                )}
                <span
                  className={cn(
                    approver.state === "next" ? "font-semibold text-slate-900" : "text-slate-600",
                  )}
                >
                  {approver.name}
                  {approver.state === "next" && " (next)"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200/80 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Comment (optional)
          </p>
          <div className="mt-2 min-h-[84px] rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
            Add a comment about your decision...
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="destructive" className="h-11 rounded-2xl">
            <XCircle className="size-4" />
            Reject
          </Button>
          <Button variant="success" className="h-11 rounded-2xl">
            <CheckCircle2 className="size-4" />
            Approve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ApprovalStatesPanel() {
  return (
    <Card className="overflow-hidden rounded-[30px] border-white/80 bg-white/95 py-0 lp-shadow-panel">
      <CardHeader className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base text-slate-950">Approval Card States</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Pending, approved, and rejected requests shown with the same request metadata.
            </p>
          </div>
          <Badge
            variant="outline"
            className="rounded-full border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600"
          >
            Live States
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {approvalStateItems.map((item) => (
          <div
            key={`${item.title}-${item.age}`}
            className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{SOURCE_CONFIG[item.source].label}</span>
                  <span className="text-slate-300">·</span>
                  <span>{item.age}</span>
                  <span className="text-slate-300">·</span>
                  <span>{item.owner}</span>
                </div>
              </div>
              <StatusPill status={item.status} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PriorityBadge priority={item.priority} />
              <Badge
                variant="outline"
                className="rounded-full border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
              >
                {item.actionType}
              </Badge>
            </div>
          </div>
        ))}

        <div className="rounded-[24px] border border-slate-200/80 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <UserCheck className="size-4 text-slate-500" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Assigned Approvers
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <AvatarGroup>
              {["SK", "MR", "PN"].map((initials) => (
                <Avatar key={initials}>
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
            <span className="text-xs font-medium text-slate-500">Sequential, 2 approvals required</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RoutingSystemPanel() {
  const SlackIcon = PLATFORM_ICONS.slack;
  const slackMeta = routePlatforms.slack;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-[30px] border-white/80 bg-white/95 py-0 lp-shadow-panel">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <SourcePill source="api" showLabel={false} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-semibold text-slate-900">
                  API / production-deploy
                </span>
                <Badge className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                  Configured
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <UserCheck className="size-3" />
                  Sequential: Sarah K. → Mike R.
                </span>
                <span className="text-slate-300">·</span>
                <span>126 requests</span>
                <span className="text-slate-300">·</span>
                <span>Last 3m ago</span>
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-slate-300" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-slate-200/80 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Approval Rules
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">2 approvers, sequential order</p>
              <p className="mt-1 text-xs text-slate-500">Admins only, next 100 requests</p>
            </div>
            <div className="rounded-[22px] border border-slate-200/80 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Team Routing
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">Ops team owns production deploys</p>
              <p className="mt-1 text-xs text-slate-500">Escalate after 5 minutes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[30px] border-white/80 bg-white/95 py-0 lp-shadow-panel">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-2xl shadow-sm"
                style={{ backgroundColor: slackMeta.color }}
              >
                <SlackIcon className="size-5 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">#ops-critical</span>
                  <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">
                    {slackMeta.label}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">Primary incident response channel</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-full border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600"
              >
                <Filter className="size-3" />
                Filtered
              </Badge>
              <Badge className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-white">
                3 sources
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Notify From
            </p>
            <div className="flex flex-wrap gap-2">
              {(["api", "zapier", "n8n"] as ProductSource[]).map((source) => (
                <SourcePill key={source} source={source} size="sm" />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Recent Outcomes
            </p>
            <div className="space-y-3">
              {routingOutcomes.map((item) => (
                <RequestRow
                  key={`${item.title}-${item.age}`}
                  item={item}
                  compact
                  showChevron={false}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function actionVariant(action: string) {
  const normalized = action.toLowerCase();
  if (normalized.includes("reject")) return "destructive";
  if (normalized.includes("approve") || normalized.includes("create")) return "default";
  if (normalized.includes("update")) return "secondary";
  return "outline";
}

function AuditTrailPanel() {
  return (
    <Card className="overflow-hidden rounded-[32px] border-white/80 bg-white/95 py-0 lp-shadow-panel">
      <CardHeader className="border-b border-slate-100 px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <CardTitle className="text-lg text-slate-950">Audit Trail</CardTitle>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Every decision, flow change, and route update lands in the same history view with actor,
              timestamp, resource, and details.
            </p>
          </div>
          <span className="text-sm text-slate-500">5 of 5 entries</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            All actions
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            approval_request
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="px-4">Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource Type</TableHead>
                <TableHead>Resource ID</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead className="px-4">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditEntries.map((entry) => (
                <Fragment key={entry.resourceId}>
                  <TableRow className="border-slate-200 hover:bg-slate-50/80">
                    <TableCell className="px-4 text-xs text-slate-500">{entry.time}</TableCell>
                    <TableCell>
                      <Badge variant={actionVariant(entry.action)}>{entry.action}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">{entry.resourceType}</TableCell>
                    <TableCell className="max-w-[200px] truncate font-mono text-xs text-slate-500">
                      {entry.resourceId}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{entry.actor}</TableCell>
                    <TableCell className="px-4 font-mono text-xs text-slate-500">{entry.ip}</TableCell>
                  </TableRow>
                  {entry.details && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="bg-slate-50/70 p-0">
                        <div className="px-6 py-4">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Details
                          </p>
                          <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
                            {entry.details}
                          </pre>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function HeroProductSystem() {
  return (
    <div className="relative">
      <div className="absolute -left-12 top-24 hidden size-56 rounded-full bg-emerald-200/30 blur-3xl lg:block" />
      <div className="absolute right-0 top-0 hidden size-72 rounded-full bg-sky-200/25 blur-3xl lg:block" />

      <div className="space-y-4 lg:hidden">
        <div className="grid gap-3 sm:grid-cols-2">
          {heroMetrics.slice(0, 2).map((metric) => (
            <MetricCard key={metric.title} metric={metric} />
          ))}
        </div>
        <MetricCard metric={heroMetrics[2]} className="max-w-none" />
        <QueuePanel attentionItems={queueAttention} resolvedItems={queueResolved} />
        <ApprovalDecisionCard />
        <QuickActionsPanel />
      </div>

      <div className="gk-v2 force-light relative hidden h-[760px] lg:block">
        <div className="absolute inset-x-10 top-20 h-[560px] rounded-[42px] border border-white/55 bg-white/35 backdrop-blur-[2px]" />
        <div className="absolute left-0 top-[150px] z-0 opacity-95">
          <SidebarContext />
        </div>

        <MetricCard metric={heroMetrics[0]} className="absolute left-24 top-0 z-20 lp-float" />
        <MetricCard metric={heroMetrics[1]} className="absolute left-[300px] top-12 z-20 lp-float-slow" />
        <MetricCard metric={heroMetrics[2]} className="absolute left-[520px] top-2 z-20 lp-float-offset" />

        <div className="absolute left-[110px] top-[130px] z-10 w-[680px]">
          <QueuePanel
            attentionItems={queueAttention}
            resolvedItems={queueResolved}
            title="Activity Feed"
            description="The live queue, transformed into a marketing-grade system without losing the underlying product structure."
          />
        </div>

        <QuickActionsPanel className="absolute right-0 top-[220px] z-30 w-[320px] lp-float-slow" />
        <ApprovalDecisionCard className="absolute left-[430px] top-[345px] z-40 w-[420px] lp-float" />
      </div>
    </div>
  );
}

function FeatureSection({
  id,
  eyebrow,
  title,
  description,
  bullets,
  visual,
  reverse = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  visual: ReactNode;
  reverse?: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-28 py-20 sm:py-24">
      <div
        className={cn(
          "mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8",
          reverse && "lg:grid-cols-[1.05fr_0.95fr]",
        )}
      >
        <FadeIn className={cn(reverse && "lg:order-2")}>
          <div className="max-w-xl space-y-6">
            <SectionEyebrow>{eyebrow}</SectionEyebrow>
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {title}
              </h2>
              <p className="text-base leading-8 text-slate-600">{description}</p>
            </div>
            <div className="space-y-3">
              {bullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-3 text-sm leading-7 text-slate-600">
                  <span className="mt-2 size-2 rounded-full bg-emerald-500" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={80} className={cn(reverse && "lg:order-1")}>
          {visual}
        </FadeIn>
      </div>
    </section>
  );
}

export function LandingPage({ user }: LandingPageProps) {
  return (
    <div className="gk-v2 force-light min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f3f7f4_0%,#f8fbf9_20%,#ffffff_52%,#f4f7f8_100%)] font-[var(--font-dm-sans)] text-[var(--foreground)]">
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo-icon.png" alt="OKRunit" width={40} height={40} className="size-10" />
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-slate-500">OKRUNIT</p>
              <p className="text-lg font-semibold text-slate-950">Approval Gateway</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
            <a href="#hero" className="transition-colors hover:text-slate-950">
              System
            </a>
            <a href="#approvals" className="transition-colors hover:text-slate-950">
              Approval Flow
            </a>
            <a href="#queue" className="transition-colors hover:text-slate-950">
              Queue
            </a>
            <a href="#routing" className="transition-colors hover:text-slate-950">
              Routing
            </a>
            <a href="#audit" className="transition-colors hover:text-slate-950">
              Audit Trail
            </a>
          </nav>

          <HeroNav user={user} />
        </div>
      </header>

      <main>
        <section id="hero" className="relative">
          <div className="mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
            <div className="grid gap-14 xl:grid-cols-[0.92fr_1.08fr] xl:items-center">
              <FadeIn>
                <div className="max-w-xl space-y-8">
                  <SectionEyebrow>Real Product UI, Reframed</SectionEyebrow>
                  <div className="space-y-5">
                    <h1 className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                      Human approval, shown as the real operating system behind every request.
                    </h1>
                    <p className="text-lg leading-8 text-slate-600">
                      The landing page is built from the same request queue, decision state, metric cards,
                      sidebar context, and quick actions your team sees in the product. No fake dashboard.
                      No decorative SaaS panels. Just the real system, with more depth and clearer hierarchy.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button size="lg" className="h-12 rounded-2xl px-6 text-sm" asChild>
                      <Link href={user ? "/org/overview" : "/signup"}>
                        {user ? "Go to Dashboard" : "Start Free"}
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 rounded-2xl border-slate-200 bg-white px-6 text-sm"
                      asChild
                    >
                      <Link href="/docs">
                        View Docs
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-500">
                      Sources already routed through the queue
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {sourceOrder.map((source) => (
                        <SourcePill key={source} source={source} />
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={120}>
                <HeroProductSystem />
              </FadeIn>
            </div>
          </div>
        </section>

        <section className="pb-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[34px] border border-white/75 bg-white/85 p-6 lp-shadow-panel">
              <div className="grid gap-4 lg:grid-cols-3">
                {heroMetrics.map((metric, index) => (
                  <FadeIn key={metric.title} delay={index * 70}>
                    <MetricCard metric={metric} className="max-w-none" />
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        <FeatureSection
          id="approvals"
          eyebrow="Approval Flow"
          title="Review the full request, the approvers, and the decision state in one place."
          description="The approval experience is not reduced to a floating CTA. The real UI shows status, source, role requirements, progress through the chain, and the actual approve or reject action side by side."
          bullets={[
            "Critical requests keep the full metadata grid instead of hiding context behind a modal step.",
            "Sequential and multi-approver flows stay visible, including who approved already and who is next.",
            "Approved, rejected, and still-pending cards keep the same structure so the queue reads instantly.",
          ]}
          visual={
            <div className="rounded-[36px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,250,248,0.98))] p-4 sm:p-6 lp-shadow-panel">
              <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <ApprovalDecisionCard />
                <ApprovalStatesPanel />
              </div>
            </div>
          }
        />

        <FeatureSection
          id="queue"
          eyebrow="Queue System"
          title="Run the day from a queue that separates active risk from resolved history."
          description="The queue is the product’s core: pending requests get the visual weight, resolved items drop below, and operators can scan source, action type, timestamps, priority, and state without opening every row."
          bullets={[
            "Needs Your Attention and Previously Resolved are preserved from the product list instead of flattened into one generic table.",
            "Request rows keep the same structure your team already uses: source marker, action type, age, owner, priority, and status.",
            "The queue looks polished enough for the homepage but still feels like something an operator could use immediately.",
          ]}
          reverse
          visual={
            <div className="relative pt-4">
              <div className="absolute left-6 top-0 hidden xl:block">
                <MetricCard metric={heroMetrics[0]} className="lp-float" />
              </div>
              <div className="xl:pl-24 xl:pt-10">
                <QueuePanel
                  attentionItems={queueDeepDiveAttention}
                  resolvedItems={queueDeepDiveResolved}
                  title="Approval Queue"
                  description="The activity feed stays operational: grouped rows, visible status chips, and enough metadata to make the next decision without guessing."
                />
              </div>
            </div>
          }
        />

        <FeatureSection
          id="routing"
          eyebrow="Routing"
          title="Configure who must approve and where the request gets routed without leaving the system."
          description="Routing is shown with the real flow and channel patterns from the product: source-specific approval rules, messaging destinations, filters by source, and recent outcomes directly beneath the configuration."
          bullets={[
            "Flows carry source ownership, request counts, and last activity so routing feels tied to real traffic.",
            "Messaging channels show exactly which sources notify them instead of disappearing into a separate settings screen.",
            "Recent outcomes keep approved, rejected, and pending states visible so route behavior is easy to verify.",
          ]}
          visual={
            <div className="rounded-[36px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,249,252,0.98))] p-4 sm:p-6 lp-shadow-panel">
              <RoutingSystemPanel />
            </div>
          }
        />

        <FeatureSection
          id="audit"
          eyebrow="Audit Trail"
          title="Keep a readable history of every decision, rule change, and route update."
          description="The audit section is presented as the actual history UI: timestamp, action badge, resource, actor, IP address, and expanded details when a flow or route changes under the hood."
          bullets={[
            "Approval decisions, flow edits, and route changes appear in one history instead of splitting trust signals across multiple panels.",
            "Rows stay dense and table-driven so the interface reads like a working tool, not a decorative timeline.",
            "Expanded details make it obvious that configuration changes are tracked with real payload data.",
          ]}
          reverse
          visual={<AuditTrailPanel />}
        />

        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[40px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,248,243,0.98))] p-8 sm:p-10 lg:p-12 lp-shadow-panel">
              <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <FadeIn>
                  <div className="max-w-xl space-y-6">
                    <SectionEyebrow>Same Product, Higher Signal</SectionEyebrow>
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                      Start in the same interface your approvers will use on day one.
                    </h2>
                    <p className="text-base leading-8 text-slate-600">
                      Everything on this page comes from real product patterns: the queue, the status system,
                      the quick actions, the routing configuration, and the audit history. That is the point.
                      The homepage should feel like proof, not an illustration.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button size="lg" className="h-12 rounded-2xl px-6 text-sm" asChild>
                        <Link href={user ? "/org/overview" : "/signup"}>
                          {user ? "Open Dashboard" : "Create Workspace"}
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-12 rounded-2xl border-slate-200 bg-white px-6 text-sm"
                        asChild
                      >
                        <Link href="/requests">
                          View Request Queue
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </FadeIn>

                <FadeIn delay={100}>
                  <div className="relative pt-6 sm:pt-10">
                    <div className="absolute left-0 top-0 hidden sm:block">
                      <MetricCard metric={heroMetrics[1]} className="lp-float-slow" />
                    </div>
                    <div className="sm:pl-24">
                      <QuickActionsPanel />
                    </div>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/70 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/logo-icon.png" alt="OKRunit" width={28} height={28} className="size-7" />
            <span>OKRunit</span>
            <span className="text-slate-300">·</span>
            <span>Human approval for automations and agents</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/docs" className="transition-colors hover:text-slate-950">
              Docs
            </Link>
            <Link href="/login" className="transition-colors hover:text-slate-950">
              Log in
            </Link>
            <Link href="/signup" className="transition-colors hover:text-slate-950">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Shield,
  Zap,
  Bell,
  GitBranch,
  Code2,
  Menu,
  X,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Lock,
  Eye,
  Clock,
  Users,
  Settings,
  Activity,
  Bot,
  FileCheck,
  ShieldCheck,
  Layers,
  AlertTriangle,
  Gauge,
  Building2,
  Headphones,
  KeyRound,
  Network,
} from "lucide-react";
import { HeroNav } from "@/components/landing/hero-nav";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface LandingPageProps {
  user: { email: string; full_name: string | null } | null;
}

/* ------------------------------------------------------------------ */
/*  Scroll-triggered fade-in with IntersectionObserver                  */
/* ------------------------------------------------------------------ */

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible
          ? "translate-y-0 opacity-100 scale-100 blur-0"
          : "translate-y-8 opacity-0 scale-[0.98] blur-[2px]"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Integration logos are served from /public/logos/ as SVG files        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Hero product UI mockup panels (rendered as code, not images)       */
/* ------------------------------------------------------------------ */

function HeroQueuePanel() {
  const items = [
    { title: "Delete 10,247 stale user records", source: "Zapier", priority: "high", status: "pending", time: "2m" },
    { title: "Deploy v3.2 to production", source: "GitHub Actions", priority: "critical", status: "pending", time: "5m" },
    { title: "Update billing for Acme Corp", source: "Make", priority: "medium", status: "approved", time: "12m" },
  ];
  const priorityColors: Record<string, string> = { critical: "bg-red-50 text-red-700", high: "bg-amber-50 text-amber-700", medium: "bg-blue-50 text-blue-700" };
  const statusColors: Record<string, string> = { pending: "bg-amber-50 text-amber-700", approved: "bg-emerald-50 text-emerald-700" };

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white lp-shadow-hero overflow-hidden" style={{ width: 380 }}>
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b border-gray-100 px-4 py-2.5">
        <div className="size-2 rounded-full bg-red-300" />
        <div className="size-2 rounded-full bg-amber-300" />
        <div className="size-2 rounded-full bg-emerald-300" />
        <span className="ml-2 text-[10px] font-medium text-gray-400">Approval Queue</span>
        <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-medium text-amber-700">3 pending</span>
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-2.5 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-gray-800">{item.title}</p>
              <p className="text-[9px] text-gray-400">{item.source} &middot; {item.time} ago</p>
            </div>
            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-medium ${priorityColors[item.priority]}`}>
              {item.priority}
            </span>
            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-medium capitalize ${statusColors[item.status]}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroApprovalCard() {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 lp-shadow-float" style={{ width: 280 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50">
            <Clock className="size-3.5 text-amber-600" />
          </div>
          <span className="text-xs font-semibold text-gray-900">Review Required</span>
        </div>
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">Critical</span>
      </div>
      <div className="mt-3 rounded-xl bg-gray-50 p-3">
        <p className="text-[11px] font-medium text-gray-800">Deploy v3.2 to production</p>
        <p className="mt-1 text-[10px] text-gray-500">Source: GitHub Actions &middot; deploy</p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex -space-x-1.5">
          <div className="size-5 rounded-full bg-emerald-200 ring-2 ring-white" />
          <div className="size-5 rounded-full bg-blue-200 ring-2 ring-white" />
        </div>
        <div className="flex gap-1.5">
          <button className="rounded-lg bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600">Reject</button>
          <button className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white">Approve</button>
        </div>
      </div>
    </div>
  );
}

function HeroWorkflowNode() {
  return (
    <div className="rounded-xl border border-gray-200/60 bg-white p-3 lp-shadow-card" style={{ width: 200 }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex size-5 items-center justify-center rounded-md bg-emerald-50">
          <Shield className="size-2.5 text-emerald-600" />
        </div>
        <span className="text-[10px] font-semibold text-gray-700">Workflow Gate</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5">
          <div className="size-1.5 rounded-full bg-emerald-500" />
          <span className="text-[9px] text-gray-600">Automation paused</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-amber-50/70 px-2 py-1.5">
          <Clock className="size-2.5 text-amber-500" />
          <span className="text-[9px] text-amber-700">Awaiting decision...</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5">
          <Zap className="size-2.5 text-gray-400" />
          <span className="text-[9px] text-gray-400">Resume on approve</span>
        </div>
      </div>
    </div>
  );
}

function HeroNotificationCard() {
  return (
    <div className="rounded-xl border border-gray-200/60 bg-white p-3 lp-shadow-card" style={{ width: 220 }}>
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-md bg-violet-50">
          <Bell className="size-3 text-violet-600" />
        </div>
        <span className="text-[10px] font-semibold text-gray-800">Notification Sent</span>
      </div>
      <div className="mt-2 space-y-1.5">
        {[
          { name: "Slack", color: "bg-purple-500" },
          { name: "Email", color: "bg-blue-500" },
          { name: "Discord", color: "bg-indigo-500" },
        ].map((ch) => (
          <div key={ch.name} className="flex items-center gap-1.5">
            <div className={`size-1.5 rounded-full ${ch.color}`} />
            <span className="text-[10px] text-gray-500">{ch.name}</span>
            <CheckCircle className="ml-auto size-2.5 text-emerald-500" />
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroCallbackCard() {
  return (
    <div className="rounded-xl border border-gray-200/60 bg-white p-3 lp-shadow-card" style={{ width: 200 }}>
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-md bg-emerald-50">
          <Zap className="size-3 text-emerald-600" />
        </div>
        <span className="text-[10px] font-semibold text-gray-800">Callback Fired</span>
      </div>
      <div className="mt-2 rounded-lg bg-gray-900 p-2">
        <code className="text-[9px] leading-relaxed text-emerald-400">
          POST /webhook<br />
          <span className="text-gray-500">{"{"}&quot;status&quot;:&quot;approved&quot;{"}"}</span>
        </code>
      </div>
    </div>
  );
}

function HeroStatsCard() {
  return (
    <div className="rounded-xl border border-gray-200/60 bg-white p-3 lp-shadow-card" style={{ width: 180 }}>
      <span className="text-[10px] font-medium text-gray-500">Avg Response Time</span>
      <p className="mt-0.5 text-lg font-bold text-gray-900">2m 14s</p>
      <div className="mt-2 flex items-center gap-1">
        <div className="h-1 flex-1 rounded-full bg-gray-100">
          <div className="h-1 w-3/4 rounded-full bg-emerald-500" />
        </div>
        <span className="text-[9px] text-emerald-600">-18%</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature row panels (realistic product UI)                          */
/* ------------------------------------------------------------------ */

function FeaturePanelApprovalQueue() {
  const items = [
    { title: "Deploy v3.2 to production", source: "GitHub Actions", priority: "critical", status: "pending", time: "2m ago" },
    { title: "Update billing address for Acme Corp", source: "Make", priority: "medium", status: "pending", time: "5m ago" },
    { title: "Archive 1,200 inactive accounts", source: "Zapier", priority: "high", status: "approved", time: "12m ago" },
    { title: "Send bulk notification to 50k users", source: "n8n", priority: "high", status: "rejected", time: "18m ago" },
  ];
  const priorityColors: Record<string, string> = {
    critical: "bg-red-50 text-red-700",
    high: "bg-amber-50 text-amber-700",
    medium: "bg-blue-50 text-blue-700",
  };
  const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
  };

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white lp-shadow-panel overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-gray-700">Approval Queue</span>
        </div>
        <span className="text-[10px] text-gray-400">4 requests</span>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-gray-800">{item.title}</p>
              <p className="mt-0.5 text-[10px] text-gray-400">{item.source} &middot; {item.time}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium ${priorityColors[item.priority]}`}>
              {item.priority}
            </span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium capitalize ${statusColors[item.status]}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturePanelRoutingRules() {
  const rules = [
    { condition: 'priority = "critical"', action: "Route to #ops-critical", icon: AlertTriangle, color: "text-red-500 bg-red-50" },
    { condition: 'source = "production"', action: "Require 2 approvals", icon: Users, color: "text-blue-500 bg-blue-50" },
    { condition: 'action_type = "delete"', action: "Escalate to Team Lead", icon: ShieldCheck, color: "text-amber-500 bg-amber-50" },
    { condition: 'risk_score < 3', action: "Auto-approve", icon: Zap, color: "text-emerald-500 bg-emerald-50" },
  ];

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white lp-shadow-panel overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="size-3.5 text-gray-500" />
          <span className="text-xs font-semibold text-gray-700">Routing Rules</span>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Active</span>
      </div>
      <div className="p-4 space-y-2.5">
        {rules.map((rule, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
            <div className={`flex size-7 items-center justify-center rounded-lg ${rule.color.split(" ")[1]}`}>
              <rule.icon className={`size-3.5 ${rule.color.split(" ")[0]}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-mono text-gray-600">{rule.condition}</p>
              <p className="text-[11px] font-medium text-gray-800">{rule.action}</p>
            </div>
            <ChevronRight className="size-3 shrink-0 text-gray-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturePanelAuditLog() {
  const entries = [
    { user: "Sarah K.", action: "Approved", target: "Deploy v3.2 to production", time: "2m ago", avatar: "bg-emerald-200" },
    { user: "Mike R.", action: "Rejected", target: "Delete staging database", time: "14m ago", avatar: "bg-red-200" },
    { user: "System", action: "Auto-approved", target: "Update DNS record TTL", time: "22m ago", avatar: "bg-blue-200" },
    { user: "Jane P.", action: "Approved", target: "Send monthly report email", time: "1h ago", avatar: "bg-violet-200" },
  ];
  const actionColors: Record<string, string> = {
    Approved: "text-emerald-600",
    Rejected: "text-red-600",
    "Auto-approved": "text-blue-600",
  };

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white lp-shadow-panel overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="size-3.5 text-gray-500" />
          <span className="text-xs font-semibold text-gray-700">Audit Trail</span>
        </div>
        <span className="text-[10px] text-gray-400">Real-time</span>
      </div>
      <div className="divide-y divide-gray-50">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            <div className={`size-6 shrink-0 rounded-full ${entry.avatar} ring-2 ring-white`} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-gray-700">
                <span className="font-semibold">{entry.user}</span>{" "}
                <span className={`font-medium ${actionColors[entry.action]}`}>{entry.action.toLowerCase()}</span>
              </p>
              <p className="truncate text-[10px] text-gray-400">{entry.target}</p>
            </div>
            <span className="shrink-0 text-[10px] text-gray-400">{entry.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Integration data                                                    */
/* ------------------------------------------------------------------ */

const integrationTiles = [
  { name: "Zapier", logo: "/logos/platforms/zapier.png" },
  { name: "Make", logo: "/logos/platforms/make.png" },
  { name: "n8n", logo: "/logos/platforms/n8n.png" },
  { name: "GitHub Actions", logo: "/logos/platforms/github.png" },
  { name: "Windmill", logo: "/logos/platforms/windmill.png" },
  { name: "Temporal", logo: "/logos/platforms/temporal.png" },
  { name: "Prefect", logo: "/logos/platforms/prefect.png" },
  { name: "Dagster", logo: "/logos/platforms/dagster.png" },
  { name: "Pipedream", logo: "/logos/platforms/pipedream.png" },
  { name: "Slack", logo: "/logos/platforms/slack.png" },
  { name: "Microsoft Teams", logo: "/logos/platforms/teams.png" },
  { name: "Discord", logo: "/logos/platforms/discord.png" },
  { name: "Telegram", logo: "/logos/platforms/telegram.png" },
  { name: "Email (Resend)", logo: "/logos/platforms/resend.png" },
];

/* ------------------------------------------------------------------ */
/*  Use-case / solutions tab data                                      */
/* ------------------------------------------------------------------ */

const solutionsTabs = [
  {
    id: "devops",
    label: "DevOps Teams",
    heading: "Gate production deployments with human oversight",
    paragraph: "CI/CD pipelines move fast. OKRunit adds a checkpoint before destructive production actions — deployments, database migrations, infrastructure changes — without slowing down your non-critical flows.",
    bullets: [
      "Auto-approve staging deploys, gate production",
      "Require 2+ approvals for infrastructure changes",
      "Integrate with GitHub Actions and Temporal",
      "Full audit trail for compliance",
    ],
    visual: "devops",
  },
  {
    id: "ai-teams",
    label: "AI Agent Teams",
    heading: "Keep AI agents on a leash",
    paragraph: "Your AI agents can do amazing things — and terrifying things. OKRunit ensures a human reviews high-stakes actions before agents execute them. Build autonomous workflows with a safety net.",
    bullets: [
      "Pause agent actions that exceed risk thresholds",
      "Auto-approve routine decisions, escalate edge cases",
      "Real-time Slack notifications for time-sensitive approvals",
      "Callbacks resume agent execution instantly",
    ],
    visual: "ai",
  },
  {
    id: "ops",
    label: "Operations",
    heading: "Stop dangerous automations before they execute",
    paragraph: "Bulk deletes, mass emails, data exports — your Zapier zaps and Make scenarios handle high-impact operations daily. OKRunit makes sure a human signs off on the ones that matter.",
    bullets: [
      "Route approvals by source, priority, or action type",
      "Set SLA timers with automatic escalation",
      "Approve from Slack, email, Teams, or dashboard",
      "Analytics to identify bottlenecks",
    ],
    visual: "ops",
  },
];

/* ------------------------------------------------------------------ */
/*  Solutions tab visual panels                                        */
/* ------------------------------------------------------------------ */

function SolutionVisualDevOps() {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white lp-shadow-panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
        <div className="size-2 rounded-full bg-emerald-500" />
        <span className="text-[11px] font-semibold text-gray-700">Deployment Pipeline</span>
        <span className="ml-auto text-[9px] text-gray-400">main → production</span>
      </div>
      <div className="p-4">
        <div className="space-y-2 mb-3">
          {[
            { stage: "Build & Lint", status: "passed", icon: CheckCircle, color: "text-emerald-500", duration: "34s" },
            { stage: "Test Suite (247 tests)", status: "passed", icon: CheckCircle, color: "text-emerald-500", duration: "2m 12s" },
            { stage: "Staging Deploy", status: "auto-approved", icon: Zap, color: "text-blue-500", duration: "instant" },
            { stage: "Production Deploy", status: "awaiting approval", icon: Clock, color: "text-amber-500", duration: "" },
          ].map((s) => (
            <div key={s.stage} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2.5">
              <s.icon className={`size-3.5 shrink-0 ${s.color}`} />
              <span className="text-[11px] font-medium text-gray-700 flex-1">{s.stage}</span>
              {s.duration && <span className="text-[9px] text-gray-400">{s.duration}</span>}
              <span className="text-[10px] text-gray-400 capitalize">{s.status}</span>
            </div>
          ))}
        </div>
        {/* Gate panel */}
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-amber-700">OKRunit Gate — Approval Required</span>
            <span className="text-[9px] text-amber-600">SLA: 4:22 remaining</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              <div className="size-5 rounded-full bg-emerald-200 ring-1 ring-white" />
              <div className="size-5 rounded-full bg-blue-200 ring-1 ring-white" />
            </div>
            <span className="text-[9px] text-gray-500">Routed to DevOps team (2 required)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SolutionVisualAI() {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white lp-shadow-panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
        <Bot className="size-3.5 text-violet-500" />
        <span className="text-[11px] font-semibold text-gray-700">Agent Decision Gate</span>
        <span className="ml-auto rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-medium text-red-700">Risk: High</span>
      </div>
      <div className="p-4">
        <div className="rounded-xl bg-violet-50/50 border border-violet-100 p-3 mb-3">
          <p className="text-[10px] text-violet-700 font-medium">AI Agent wants to execute:</p>
          <p className="text-[11px] text-gray-800 font-semibold mt-1">&ldquo;Transfer $45,000 to vendor account ending in 4829&rdquo;</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-medium text-red-700">Amount: $45,000</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-medium text-amber-700">Threshold: $10,000</span>
          </div>
        </div>
        {/* Decision gate */}
        <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="size-3 text-amber-600" />
            <span className="text-[10px] text-amber-700 font-medium">Paused — Waiting for human approval</span>
          </div>
          <div className="h-1 rounded-full bg-amber-200">
            <div className="h-1 w-[45%] rounded-full bg-amber-500 transition-all" />
          </div>
        </div>
        {/* Routing */}
        <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2">
          <Bell className="size-3 text-violet-500" />
          <span className="text-[9px] text-gray-600 flex-1">Notified: CFO via Slack, Finance Lead via email</span>
          <CheckCircle className="size-3 text-emerald-500" />
        </div>
      </div>
    </div>
  );
}

function SolutionVisualOps() {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white lp-shadow-panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
        <Activity className="size-3.5 text-blue-500" />
        <span className="text-[11px] font-semibold text-gray-700">Operations Overview</span>
        <span className="ml-auto text-[9px] text-gray-400">Last 7 days</span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Approval Rate", value: "98.2%", color: "text-emerald-600" },
            { label: "Avg Response", value: "1m 42s", color: "text-blue-600" },
            { label: "Total Requests", value: "1,426", color: "text-violet-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-100 bg-gray-50/50 p-2 text-center">
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[8px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        {/* Source breakdown */}
        <div className="rounded-xl border border-gray-100 p-3 mb-3">
          <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">By Source</span>
          <div className="mt-2 space-y-2">
            {[
              { name: "Zapier", count: 847, pct: 59 },
              { name: "Make", count: 423, pct: 30 },
              { name: "n8n", count: 156, pct: 11 },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-gray-700 w-12">{s.name}</span>
                <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                  <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${s.pct}%` }} />
                </div>
                <span className="text-[9px] text-gray-400 w-8 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Bottleneck alert */}
        <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2">
          <AlertTriangle className="size-3 text-amber-500 shrink-0" />
          <span className="text-[9px] text-amber-700">Bottleneck detected: Infrastructure team avg 8m response</span>
        </div>
      </div>
    </div>
  );
}

const solutionVisuals: Record<string, React.ComponentType> = {
  devops: SolutionVisualDevOps,
  "ai-teams": SolutionVisualAI,
  ops: SolutionVisualOps,
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function LandingPage({ user }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("devops");

  // Sticky header scroll detection
  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ActiveVisual = solutionVisuals[activeTab];
  const activeTabData = solutionsTabs.find((t) => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-[var(--font-dm-sans)]">

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  1. ANNOUNCEMENT BAR                                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-gray-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full rounded-full bg-emerald-400 lp-pulse-dot" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          <p className="text-[11px] font-medium sm:text-xs">
            <span className="text-gray-400">New:</span>{" "}
            AI agent support is live — add human oversight to any autonomous workflow
          </p>
          <Link href="/docs" className="hidden items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-medium transition hover:bg-white/20 sm:inline-flex">
            Learn more <ArrowRight className="size-2.5" />
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  2. PREMIUM STICKY HEADER                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <nav
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          headerScrolled
            ? "lp-header-scrolled border-gray-200/60"
            : "border-transparent bg-[#fafafa]/80 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-3 lg:px-10">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image src="/logo_text.png" alt="OKRunit" width={440} height={120} className="h-7 w-auto" />
          </Link>

          {/* Center nav */}
          <div className="hidden items-center gap-1 lg:flex">
            {[
              { label: "How it Works", href: "#how-it-works" },
              { label: "Features", href: "#features" },
              { label: "Integrations", href: "#integrations" },
              { label: "Pricing", href: "#pricing" },
              { label: "Docs", href: "/docs" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-gray-600 transition hover:bg-gray-100/80 hover:text-gray-900"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden lg:block">
            <HeroNav user={user} />
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-9 items-center justify-center rounded-lg transition hover:bg-gray-100 lg:hidden"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white px-6 py-5 lg:hidden">
            <div className="flex flex-col gap-1">
              {[
                { label: "How it Works", href: "#how-it-works" },
                { label: "Features", href: "#features" },
                { label: "Integrations", href: "#integrations" },
                { label: "Pricing", href: "#pricing" },
                { label: "Docs", href: "/docs" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-3 border-t border-gray-100 pt-4">
                <HeroNav user={user} />
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  3. HERO SECTION                                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background treatment */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 10%, transparent 60%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 10%, transparent 60%)",
          }}
        />
        <div
          className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #d1fae5, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute bottom-0 -left-20 h-[400px] w-[400px] rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #e0e7ff, transparent 70%)" }}
        />

        <div className="relative mx-auto max-w-[1280px] px-6 pt-16 pb-20 lg:px-10 lg:pt-24 lg:pb-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            {/* Left: content stack */}
            <div>
              <FadeIn>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  Now available for AI agent teams
                </div>
              </FadeIn>

              <FadeIn delay={80}>
                <h1 className="text-[2.75rem] font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                  Your automation wants to
                  <span className="text-emerald-600"> delete 10,000 rows.</span>
                  {" "}Should it?
                </h1>
              </FadeIn>

              <FadeIn delay={160}>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-gray-500">
                  OKRunit pauses automations and AI agents until a human approves. One API call. Approve from Slack, email, or your dashboard.
                </p>
              </FadeIn>

              <FadeIn delay={240}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={user ? "/org/overview" : "/signup"}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 hover:shadow-lg"
                  >
                    {user ? "Go to Dashboard" : "Start building — it's free"}
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/docs"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                  >
                    Read the docs
                  </Link>
                </div>
              </FadeIn>

              {/* Trust microcopy */}
              <FadeIn delay={320}>
                <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="size-3 text-emerald-500" />
                    No credit card required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="size-3 text-emerald-500" />
                    100 free requests/month
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="size-3 text-emerald-500" />
                    5-minute setup
                  </span>
                </div>
              </FadeIn>
            </div>

            {/* Right: layered hero visual system */}
            <FadeIn delay={200} className="relative hidden lg:block">
              <div className="relative" style={{ minHeight: 520 }}>
                {/* Ambient glow layers */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-100/30 via-transparent to-blue-100/20" />
                <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-emerald-200/15 blur-3xl" />
                <div className="absolute bottom-10 right-10 w-56 h-56 rounded-full bg-blue-200/15 blur-3xl" />

                {/* Base layer: Queue panel (largest, back) */}
                <div className="absolute top-0 left-0 z-10 lp-float-slow">
                  <HeroQueuePanel />
                </div>

                {/* Mid layer: Approval decision card (overlapping queue) */}
                <div className="absolute top-32 right-[-12px] z-20 lp-float">
                  <HeroApprovalCard />
                </div>

                {/* Workflow node - showing pause/continue logic */}
                <div className="absolute bottom-20 left-0 z-20 lp-float-offset">
                  <HeroWorkflowNode />
                </div>

                {/* Notification card - overlapping queue top-right */}
                <div className="absolute top-[-8px] right-12 z-30 lp-float" style={{ animationDelay: "0.8s" }}>
                  <HeroNotificationCard />
                </div>

                {/* Stats card - bottom right, overlapping approval card */}
                <div className="absolute bottom-[-4px] right-4 z-30 lp-float-slow" style={{ animationDelay: "1.2s" }}>
                  <HeroStatsCard />
                </div>

                {/* Animated connecting flow lines */}
                <svg className="absolute inset-0 z-5 h-full w-full pointer-events-none" viewBox="0 0 620 520">
                  <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
                    </linearGradient>
                  </defs>
                  {/* Queue → Approval */}
                  <path d="M 350 150 Q 420 160, 400 250" stroke="url(#lineGrad)" strokeWidth="1.5" fill="none" strokeDasharray="8 5" className="lp-dash-animated" />
                  {/* Approval → Stats */}
                  <path d="M 430 370 Q 470 420, 490 440" stroke="url(#lineGrad)" strokeWidth="1.5" fill="none" strokeDasharray="8 5" className="lp-dash-animated" style={{ animationDelay: "0.5s" }} />
                  {/* Queue → Workflow */}
                  <path d="M 180 250 Q 160 340, 150 380" stroke="url(#lineGrad)" strokeWidth="1.5" fill="none" strokeDasharray="8 5" className="lp-dash-animated" style={{ animationDelay: "1s" }} />
                  {/* Notification → Approval */}
                  <path d="M 380 80 Q 420 140, 420 200" stroke="url(#lineGrad)" strokeWidth="1" fill="none" strokeDasharray="4 4" className="lp-dash-animated" style={{ animationDelay: "1.5s" }} />
                </svg>
              </div>
            </FadeIn>

            {/* Mobile hero visual (stacked simplified) */}
            <FadeIn delay={200} className="lg:hidden">
              <div className="space-y-3">
                <HeroQueuePanel />
                <div className="grid grid-cols-2 gap-3">
                  <HeroNotificationCard />
                  <HeroWorkflowNode />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="lp-divider" />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  5. CUSTOMER LOGO CLOUD                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-10 lg:px-10">
          <FadeIn>
            <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-gray-400">
              Works with the platforms you already use
            </p>
            <div className="relative overflow-hidden">
              <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-white to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-white to-transparent" />
              <div className="flex animate-[ticker_25s_linear_infinite] items-center gap-16">
                {[...integrationTiles, ...integrationTiles].map((item, i) => (
                    <div key={`${item.name}-${i}`} className="flex shrink-0 items-center gap-2.5">
                      <Image src={item.logo} alt={item.name} width={20} height={20} className="size-5 opacity-60" />
                      <span className="whitespace-nowrap text-sm font-medium text-gray-400">{item.name}</span>
                    </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  6. HOW IT WORKS — 3-step visual narrative                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10 lg:py-32">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]">
                Add human oversight in three steps
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                No SDK. No webhook setup. Just one HTTP request.
              </p>
            </div>
          </FadeIn>

          <div className="relative grid gap-6 lg:grid-cols-3">
            {/* Connecting line between cards (desktop only) */}
            <div className="pointer-events-none absolute top-16 left-[33.33%] right-[33.33%] hidden h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 lg:block" />

            {/* Step 1 */}
            <FadeIn delay={0}>
              <div className="group rounded-2xl border border-gray-200/80 bg-white p-6 lp-shadow-card lp-lift hover:lp-shadow-card-hover h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 relative">
                    <Code2 className="size-5" />
                    <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-gray-900 text-[9px] font-bold text-white">1</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Your automation calls OKRunit</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">When your workflow hits a destructive action, it sends a POST request. Execution pauses automatically.</p>
                {/* Mini UI panel */}
                <div className="mt-4 rounded-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gray-900 px-3 py-2">
                    <pre className="text-[10px] leading-relaxed text-emerald-400 font-[var(--font-geist-mono)]">
                      {`POST /v1/approvals\n{ "title": "Delete 10k rows",\n  "priority": "high" }`}
                    </pre>
                  </div>
                  <div className="bg-gray-50 px-3 py-2 flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-amber-500" />
                    <span className="text-[9px] font-medium text-amber-700">Execution paused</span>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Step 2 */}
            <FadeIn delay={100}>
              <div className="group rounded-2xl border border-gray-200/80 bg-white p-6 lp-shadow-card lp-lift hover:lp-shadow-card-hover h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 relative">
                    <Bell className="size-5" />
                    <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-gray-900 text-[9px] font-bold text-white">2</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">The right person gets notified</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">OKRunit routes the request by your rules. Notifications go to Slack, email, or Teams instantly.</p>
                {/* Mini notification panel */}
                <div className="mt-4 rounded-xl border border-gray-100 p-3 bg-gray-50/50">
                  <div className="space-y-2">
                    {[
                      { channel: "Slack #ops-critical", status: "delivered", color: "text-purple-500" },
                      { channel: "Email: sarah@acme.com", status: "delivered", color: "text-blue-500" },
                      { channel: "Teams: DevOps", status: "delivered", color: "text-indigo-500" },
                    ].map((n) => (
                      <div key={n.channel} className="flex items-center gap-2 rounded-lg bg-white border border-gray-100 px-2.5 py-1.5">
                        <div className={`size-1.5 rounded-full ${n.color.replace("text-", "bg-")}`} />
                        <span className="text-[10px] font-medium text-gray-700 flex-1">{n.channel}</span>
                        <CheckCircle className="size-3 text-emerald-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Step 3 */}
            <FadeIn delay={200}>
              <div className="group rounded-2xl border border-gray-200/80 bg-white p-6 lp-shadow-card lp-lift hover:lp-shadow-card-hover h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 relative">
                    <CheckCircle className="size-5" />
                    <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-gray-900 text-[9px] font-bold text-white">3</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">They decide. You continue.</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">The approver clicks approve or reject. OKRunit fires your callback URL with the decision instantly.</p>
                {/* Mini decision + callback panel */}
                <div className="mt-4 rounded-xl border border-gray-100 overflow-hidden">
                  <div className="bg-emerald-50/50 px-3 py-2 flex items-center gap-2 border-b border-emerald-100">
                    <CheckCircle className="size-3 text-emerald-600" />
                    <span className="text-[10px] font-semibold text-emerald-700">Approved by Sarah K.</span>
                    <span className="ml-auto text-[9px] text-gray-400">1m 42s</span>
                  </div>
                  <div className="bg-gray-900 px-3 py-2">
                    <pre className="text-[10px] leading-relaxed text-emerald-400 font-[var(--font-geist-mono)]">
                      {`POST /your-webhook\n{ "status": "approved" }`}
                    </pre>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  PRODUCT DASHBOARD (designed UI panel, no screenshot)         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="lp-bg-elevated">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                A dashboard your team will actually use
              </h2>
              <p className="mt-3 text-gray-500">
                See every pending request, who approved what, and how fast your team responds.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={150}>
            <div className="relative mx-auto max-w-5xl">
              <div
                className="rounded-2xl border border-gray-200/70 bg-white lp-shadow-hero overflow-hidden"
                style={{ transform: "perspective(2400px) rotateX(2deg)" }}
              >
                {/* Window chrome */}
                <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50/50 px-5 py-2.5">
                  <div className="size-2.5 rounded-full bg-red-300" />
                  <div className="size-2.5 rounded-full bg-amber-300" />
                  <div className="size-2.5 rounded-full bg-emerald-300" />
                  <span className="ml-3 text-[11px] font-medium text-gray-400">OKRunit — Organization Overview</span>
                </div>
                {/* Dashboard layout */}
                <div className="p-5">
                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-4 mb-5">
                    {[
                      { label: "Pending", value: "7", change: "+2", color: "text-amber-600", bg: "bg-amber-50" },
                      { label: "Approved Today", value: "143", change: "+18", color: "text-emerald-600", bg: "bg-emerald-50" },
                      { label: "Avg Response", value: "2m 14s", change: "-22%", color: "text-blue-600", bg: "bg-blue-50" },
                      { label: "Active Connections", value: "9", change: "", color: "text-violet-600", bg: "bg-violet-50" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-gray-100 bg-white p-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-gray-500">{stat.label}</span>
                          {stat.change && (
                            <span className={`text-[9px] font-medium ${stat.color}`}>{stat.change}</span>
                          )}
                        </div>
                        <p className={`mt-1 text-xl font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Main content: queue + sidebar */}
                  <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                    {/* Queue */}
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/30 px-4 py-2.5">
                        <span className="text-[11px] font-semibold text-gray-700">Recent Requests</span>
                        <span className="text-[10px] text-gray-400">Last 24h</span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {[
                          { title: "Delete 10,247 stale user records", source: "Zapier", priority: "high", status: "pending", time: "2m ago" },
                          { title: "Deploy v3.2 to production", source: "GitHub Actions", priority: "critical", status: "pending", time: "5m ago" },
                          { title: "Archive 1,200 inactive accounts", source: "Make", priority: "medium", status: "approved", time: "12m ago" },
                          { title: "Send bulk notification to 50k users", source: "n8n", priority: "high", status: "approved", time: "18m ago" },
                          { title: "Update DNS record TTL", source: "Temporal", priority: "low", status: "approved", time: "34m ago" },
                        ].map((item) => {
                          const pColor: Record<string, string> = { critical: "bg-red-50 text-red-700", high: "bg-amber-50 text-amber-700", medium: "bg-blue-50 text-blue-700", low: "bg-gray-50 text-gray-600" };
                          const sColor: Record<string, string> = { pending: "bg-amber-50 text-amber-700", approved: "bg-emerald-50 text-emerald-700" };
                          return (
                            <div key={item.title} className="flex items-center gap-3 px-4 py-2.5">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[11px] font-medium text-gray-800">{item.title}</p>
                                <p className="text-[9px] text-gray-400">{item.source} &middot; {item.time}</p>
                              </div>
                              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-medium ${pColor[item.priority]}`}>{item.priority}</span>
                              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-medium capitalize ${sColor[item.status]}`}>{item.status}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Sidebar panels */}
                    <div className="space-y-4">
                      {/* Connections */}
                      <div className="rounded-xl border border-gray-100 p-3.5">
                        <span className="text-[10px] font-semibold text-gray-600">Active Connections</span>
                        <div className="mt-2.5 space-y-2">
                          {[
                            { name: "Zapier", status: "connected", count: "1,247" },
                            { name: "GitHub Actions", status: "connected", count: "892" },
                            { name: "Make.com", status: "connected", count: "456" },
                          ].map((c) => (
                            <div key={c.name} className="flex items-center gap-2">
                              <div className="size-1.5 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-medium text-gray-700 flex-1">{c.name}</span>
                              <span className="text-[9px] text-gray-400">{c.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Activity */}
                      <div className="rounded-xl border border-gray-100 p-3.5">
                        <span className="text-[10px] font-semibold text-gray-600">Recent Activity</span>
                        <div className="mt-2.5 space-y-2">
                          {[
                            { user: "Sarah K.", action: "approved", target: "Deploy v3.2", color: "text-emerald-600" },
                            { user: "Mike R.", action: "rejected", target: "Delete staging DB", color: "text-red-600" },
                            { user: "System", action: "auto-approved", target: "Update TTL", color: "text-blue-600" },
                          ].map((a, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="mt-0.5 size-4 shrink-0 rounded-full bg-gray-100" />
                              <p className="text-[9px] text-gray-600">
                                <span className="font-medium">{a.user}</span>{" "}
                                <span className={a.color}>{a.action}</span>{" "}
                                <span className="text-gray-400">{a.target}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Ambient glow */}
              <div className="absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-b from-emerald-100/20 via-transparent to-blue-100/20 blur-2xl" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  7. FEATURE / VALUE SECTION — Alternating rows                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="features" className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10 lg:py-32">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-20">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]">
                Everything you need for safe automation
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Built for teams that move fast but can&apos;t afford mistakes.
              </p>
            </div>
          </FadeIn>

          {/* Row 1: text left, visual right */}
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <FadeIn>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 mb-4">
                  <Clock className="size-3" /> Real-time Queue
                </span>
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Every request, one clear queue
                </h3>
                <p className="mt-3 text-base leading-relaxed text-gray-500">
                  See all pending approvals with priority, source, and status at a glance. Filter by connection, action type, or urgency. Never lose track of what needs attention.
                </p>
                <div className="mt-5 space-y-2">
                  {["Priority-based ordering", "Source and action type filters", "Bulk approve or reject", "SLA timers with escalation"].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={150}>
              <FeaturePanelApprovalQueue />
            </FadeIn>
          </div>

          {/* Row 2: visual left, text right */}
          <div className="mt-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <FadeIn delay={150} className="order-2 lg:order-1">
              <FeaturePanelRoutingRules />
            </FadeIn>
            <FadeIn className="order-1 lg:order-2">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 mb-4">
                  <GitBranch className="size-3" /> Smart Routing
                </span>
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Route requests by your rules
                </h3>
                <p className="mt-3 text-base leading-relaxed text-gray-500">
                  Build routing rules that match on priority, source, action type, or risk score. Auto-approve low-risk actions. Escalate critical ones to the right team.
                </p>
                <div className="mt-5 space-y-2">
                  {["Conditional routing engine", "Auto-approve low-risk actions", "Multi-approval requirements", "Team-based escalation"].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Row 3: text left, visual right */}
          <div className="mt-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <FadeIn>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700 mb-4">
                  <Eye className="size-3" /> Full Audit Trail
                </span>
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Audit everything, always
                </h3>
                <p className="mt-3 text-base leading-relaxed text-gray-500">
                  Every decision logged with who approved, when, and why. HMAC-signed callbacks. Encrypted API keys. Row-level security. Built for compliance from day one.
                </p>
                <div className="mt-5 space-y-2">
                  {["Immutable decision history", "HMAC-signed webhook callbacks", "Encrypted API keys at rest", "Export for compliance audits"].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={150}>
              <FeaturePanelAuditLog />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  8. SOLUTIONS / USE CASE TABS                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="lp-bg-depth">
        <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10 lg:py-32">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]">
                Built for how your team works
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Whether you run pipelines, manage AI agents, or orchestrate operations — OKRunit fits your workflow.
              </p>
            </div>
          </FadeIn>

          {/* Tab pills */}
          <FadeIn delay={100}>
            <div className="mb-10 flex justify-center">
              <div className="inline-flex gap-1.5 rounded-2xl border border-gray-200 bg-white p-1.5 lp-shadow-subtle">
                {solutionsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-gray-900 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Tab content */}
          <FadeIn delay={150}>
            <div key={activeTab} className="lp-tab-in">
              <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {activeTabData.heading}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-gray-500">
                    {activeTabData.paragraph}
                  </p>
                  <div className="mt-6 space-y-2.5">
                    {activeTabData.bullets.map((b) => (
                      <div key={b} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <CheckCircle className="size-4 mt-0.5 text-emerald-500 shrink-0" />
                        {b}
                      </div>
                    ))}
                  </div>
                  <Link
                    href={user ? "/org/overview" : "/signup"}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 transition hover:text-emerald-600"
                  >
                    {user ? "Go to Dashboard" : "Get started"} <ArrowRight className="size-3.5" />
                  </Link>
                </div>
                <div>
                  <ActiveVisual />
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  9. INTEGRATIONS / ECOSYSTEM                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="integrations" className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10 lg:py-32">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]">
                Connect anything that calls an API
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Native integrations for major platforms. REST API for everything else. OAuth and API key support.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
            {integrationTiles.map((tile, i) => (
                <FadeIn key={tile.name} delay={i * 40}>
                  <div className="group rounded-2xl border border-gray-200/80 bg-white p-4 lp-shadow-subtle lp-lift hover:lp-shadow-card-hover transition-all cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 group-hover:border-gray-200 transition">
                        <Image src={tile.logo} alt={tile.name} width={18} height={18} className="size-[18px]" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{tile.name}</span>
                    </div>
                  </div>
                </FadeIn>
            ))}
          </div>

          <FadeIn delay={200}>
            <div className="mt-10 text-center">
              <p className="text-sm text-gray-400">
                Don&apos;t see your platform? OKRunit works with any service that can make an HTTP request.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  10. PRODUCT DEPTH — Multi-panel ecosystem showcase            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="lp-bg-elevated">
        <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10 lg:py-32">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 mb-4">
                <Layers className="size-3" /> Complete Platform
              </span>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]">
                Everything connects. Everything is visible.
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Queue management, smart routing, SLA tracking, multi-user approvals, and audit trails — all in one place.
              </p>
            </div>
          </FadeIn>

          {/* Top row: 3 connected product modules */}
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Request queue */}
            <FadeIn delay={0}>
              <div className="rounded-2xl border border-gray-200/80 bg-white lp-shadow-panel overflow-hidden h-full">
                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
                  <Clock className="size-3.5 text-amber-500" />
                  <span className="text-[11px] font-semibold text-gray-700">Request Queue</span>
                  <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-medium text-amber-700">5 pending</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { title: "Delete stale records", pri: "high", t: "2m" },
                    { title: "Deploy to production", pri: "critical", t: "5m" },
                    { title: "Archive inactive users", pri: "medium", t: "8m" },
                    { title: "Send bulk email", pri: "high", t: "12m" },
                    { title: "Rotate API keys", pri: "low", t: "15m" },
                  ].map((r) => {
                    const pc: Record<string, string> = { critical: "text-red-600", high: "text-amber-600", medium: "text-blue-600", low: "text-gray-500" };
                    return (
                      <div key={r.title} className="flex items-center gap-2 px-4 py-2">
                        <div className={`size-1.5 rounded-full ${pc[r.pri].replace("text-", "bg-")}`} />
                        <span className="text-[10px] font-medium text-gray-700 flex-1 truncate">{r.title}</span>
                        <span className="text-[9px] text-gray-400">{r.t}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </FadeIn>

            {/* Routing + SLA */}
            <FadeIn delay={100}>
              <div className="rounded-2xl border border-gray-200/80 bg-white lp-shadow-panel overflow-hidden h-full">
                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
                  <GitBranch className="size-3.5 text-blue-500" />
                  <span className="text-[11px] font-semibold text-gray-700">Routing & SLA</span>
                  <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-700">3 rules active</span>
                </div>
                <div className="p-3 space-y-2">
                  {[
                    { rule: "Critical → #ops-critical", sla: "5m SLA", icon: AlertTriangle, color: "text-red-500 bg-red-50" },
                    { rule: "Delete actions → Team Lead", sla: "15m SLA", icon: ShieldCheck, color: "text-amber-500 bg-amber-50" },
                    { rule: "Low risk → Auto-approve", sla: "Instant", icon: Zap, color: "text-emerald-500 bg-emerald-50" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/50 p-2.5">
                      <div className={`flex size-6 items-center justify-center rounded-lg ${r.color.split(" ")[1]}`}>
                        <r.icon className={`size-3 ${r.color.split(" ")[0]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-gray-700 truncate">{r.rule}</p>
                      </div>
                      <span className="text-[9px] text-gray-400 shrink-0">{r.sla}</span>
                    </div>
                  ))}
                  {/* SLA timer */}
                  <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5 mt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-medium text-amber-700">SLA Timer</span>
                      <span className="text-[10px] font-bold text-amber-700">3:42 remaining</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-amber-100">
                      <div className="h-1.5 w-[60%] rounded-full bg-amber-500 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Multi-user approval + audit */}
            <FadeIn delay={200}>
              <div className="rounded-2xl border border-gray-200/80 bg-white lp-shadow-panel overflow-hidden h-full">
                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
                  <Users className="size-3.5 text-violet-500" />
                  <span className="text-[11px] font-semibold text-gray-700">Multi-User Approval</span>
                </div>
                <div className="p-3">
                  {/* Approval progress */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-medium text-gray-700">Deploy v3.2 to production</span>
                      <span className="text-[9px] font-medium text-amber-700">1/2 approved</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="size-5 rounded-full bg-emerald-200 ring-1 ring-white" />
                        <span className="text-[10px] text-gray-600 flex-1">Sarah K.</span>
                        <CheckCircle className="size-3 text-emerald-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="size-5 rounded-full bg-blue-200 ring-1 ring-white" />
                        <span className="text-[10px] text-gray-600 flex-1">Mike R.</span>
                        <Clock className="size-3 text-amber-500" />
                      </div>
                    </div>
                  </div>
                  {/* Audit trail */}
                  <div className="rounded-xl border border-gray-100 p-2.5">
                    <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">Audit Trail</span>
                    <div className="mt-2 space-y-1.5">
                      {[
                        { action: "Request created", time: "5m ago", color: "bg-blue-400" },
                        { action: "Routed to DevOps team", time: "5m ago", color: "bg-violet-400" },
                        { action: "Sarah K. approved", time: "3m ago", color: "bg-emerald-400" },
                        { action: "Waiting for Mike R.", time: "now", color: "bg-amber-400" },
                      ].map((a, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`size-1.5 rounded-full ${a.color}`} />
                          <span className="text-[9px] text-gray-600 flex-1">{a.action}</span>
                          <span className="text-[8px] text-gray-400">{a.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Bottom: platform overview bar */}
          <FadeIn delay={250}>
            <div className="mt-5 rounded-2xl border border-gray-200/80 bg-white lp-shadow-panel p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                {/* Flow diagram */}
                <div className="flex items-center gap-3 flex-wrap">
                  {[
                    { icon: Bot, label: "AI Agent / Automation", color: "bg-violet-100 text-violet-600" },
                    { icon: ArrowRight, label: "", color: "text-gray-300" },
                    { icon: Shield, label: "OKRunit Gate", color: "bg-emerald-100 text-emerald-600" },
                    { icon: ArrowRight, label: "", color: "text-gray-300" },
                    { icon: Users, label: "Human Approver", color: "bg-blue-100 text-blue-600" },
                    { icon: ArrowRight, label: "", color: "text-gray-300" },
                    { icon: Zap, label: "Execute / Block", color: "bg-amber-100 text-amber-600" },
                  ].map((node, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {node.label ? (
                        <>
                          <div className={`flex size-8 items-center justify-center rounded-lg ${node.color}`}>
                            <node.icon className="size-4" />
                          </div>
                          <span className="text-[10px] font-medium text-gray-600 hidden sm:inline">{node.label}</span>
                        </>
                      ) : (
                        <node.icon className={`size-4 ${node.color}`} />
                      )}
                    </div>
                  ))}
                </div>
                {/* Stats */}
                <div className="flex items-center gap-6">
                  {[
                    { label: "Active Flows", value: "24" },
                    { label: "Approved Today", value: "143" },
                    { label: "Avg Response", value: "2.3m" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-sm font-bold text-gray-900">{s.value}</p>
                      <p className="text-[9px] text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  11. ENTERPRISE SECTION                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10 lg:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Enterprise-grade from day one
              </h2>
              <p className="mt-3 text-base text-gray-500">
                The control, security, and governance that growing teams and regulated industries require.
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Building2, title: "SSO & SAML", description: "Enterprise single sign-on with SAML 2.0. Centralized identity management." },
              { icon: Users, title: "Team management", description: "Organize approvers into teams. Route by expertise. Role-based permissions." },
              { icon: ShieldCheck, title: "Custom SLAs", description: "Response time requirements per flow. Auto-escalate when SLAs are at risk." },
              { icon: Headphones, title: "Dedicated support", description: "Named account manager. Guaranteed response times. Custom onboarding." },
              { icon: KeyRound, title: "API key management", description: "Per-connection scoping. Automatic rotation with grace periods. IP allowlists." },
              { icon: Settings, title: "Fine-grained controls", description: "Emergency stop. Geo-restrictions. Action type scoping. Rate limiting." },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 60}>
                <div className="rounded-2xl border border-gray-200/80 bg-white p-6 lp-shadow-subtle lp-lift hover:lp-shadow-card-hover h-full transition-all">
                  <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
                    <item.icon className="size-4 text-gray-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  12. SECURITY / COMPLIANCE / TRUST                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="lp-bg-depth">
        <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <FadeIn>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-700 mb-5">
                  <Shield className="size-3" /> Security & Compliance
                </span>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Security you can trust
                </h2>
                <p className="mt-4 text-base leading-relaxed text-gray-500">
                  Your approval data is sensitive. We treat it that way. Enterprise-grade security is built into every layer.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    { icon: Lock, title: "Encrypted at rest & in transit", description: "AES-256 encryption for stored data. TLS 1.3 for all API traffic." },
                    { icon: ShieldCheck, title: "HMAC-signed callbacks", description: "Every webhook callback is signed so you can verify it came from OKRunit." },
                    { icon: Eye, title: "Row-level security", description: "Supabase RLS ensures users only see data they're authorized to access." },
                    { icon: KeyRound, title: "SOC 2 ready architecture", description: "Built with audit logging, access controls, and data retention policies." },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-3.5">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white border border-gray-200/80 lp-shadow-subtle">
                        <item.icon className="size-4 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                        <p className="mt-0.5 text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={150}>
              <div className="rounded-2xl border border-gray-200/80 bg-white p-8 lp-shadow-panel">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: "Encryption", value: "AES-256", icon: Lock },
                    { label: "Transport", value: "TLS 1.3", icon: Shield },
                    { label: "Auth", value: "OAuth 2.0 + PKCE", icon: KeyRound },
                    { label: "Database", value: "RLS Enabled", icon: ShieldCheck },
                    { label: "Webhooks", value: "HMAC Signed", icon: FileCheck },
                    { label: "Uptime", value: "99.9% SLA", icon: Activity },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-white border border-gray-100">
                        <item.icon className="size-3.5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">{item.label}</p>
                        <p className="text-xs font-semibold text-gray-800">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  PRICING                                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10 lg:py-32">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-lg text-gray-500">Start free. Upgrade when you need more.</p>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Free */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 lp-shadow-subtle">
                <h3 className="text-lg font-bold text-gray-900">Free</h3>
                <p className="mt-1 text-3xl font-bold text-gray-900">$0</p>
                <p className="text-sm text-gray-400">forever</p>
                <ul className="mt-6 space-y-2.5">
                  {["100 requests/month", "2 connections", "3 team members", "Email notifications", "7-day history"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[13px] text-gray-600">
                      <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={user ? "/org/overview" : "/signup"}
                  className="mt-7 block rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                >
                  {user ? "Go to Dashboard" : "Get started"}
                </Link>
              </div>

              {/* Pro */}
              <div className="relative rounded-2xl border-2 border-gray-900 bg-white p-6 lp-shadow-panel">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-1 text-xs font-semibold text-white">
                  Most popular
                </div>
                <h3 className="text-lg font-bold text-gray-900">Pro</h3>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  $20<span className="text-base font-normal text-gray-400">/mo</span>
                </p>
                <p className="text-sm text-gray-400">per organization</p>
                <ul className="mt-6 space-y-2.5">
                  {["Unlimited requests", "15 connections", "15 team members", "Slack + email", "Rules engine", "90-day history", "Analytics"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[13px] text-gray-600">
                      <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={user ? "/billing" : "/signup"}
                  className="mt-7 block rounded-xl bg-gray-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  {user ? "Upgrade" : "Start free trial"}
                </Link>
              </div>

              {/* Business */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 lp-shadow-subtle">
                <h3 className="text-lg font-bold text-gray-900">Business</h3>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  $60<span className="text-base font-normal text-gray-400">/mo</span>
                </p>
                <p className="text-sm text-gray-400">per organization</p>
                <ul className="mt-6 space-y-2.5">
                  {["Everything in Pro", "Unlimited connections", "Unlimited team members", "SSO / SAML", "Audit log export", "Multi-step approvals", "Custom routing", "365-day history"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[13px] text-gray-600">
                      <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={user ? "/billing" : "/signup"}
                  className="mt-7 block rounded-xl border border-gray-200 bg-gray-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  {user ? "Upgrade" : "Start free trial"}
                </Link>
              </div>

              {/* Enterprise */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 lp-shadow-subtle">
                <h3 className="text-lg font-bold text-gray-900">Enterprise</h3>
                <p className="mt-1 text-3xl font-bold text-gray-900">Custom</p>
                <p className="text-sm text-gray-400">tailored to your needs</p>
                <ul className="mt-6 space-y-2.5">
                  {["Everything in Business", "Unlimited history", "Dedicated support", "Custom SLA", "Priority processing", "Onboarding assistance"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[13px] text-gray-600">
                      <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:support@okrunit.com"
                  className="mt-7 block rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                >
                  Talk to us
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  13. RATINGS / REVIEW STRIP                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="lp-divider" />
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10">
          <FadeIn>
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {[
                { source: "Developer Experience", rating: "4.9/5", detail: "Based on API simplicity" },
                { source: "Time to First Approval", rating: "< 5 min", detail: "Average setup time" },
                { source: "Uptime SLA", rating: "99.9%", detail: "Guaranteed availability" },
                { source: "API Response", rating: "< 100ms", detail: "p95 latency globally" },
              ].map((item) => (
                <div key={item.source} className="rounded-2xl border border-gray-200/80 bg-white p-5 lp-shadow-subtle text-center">
                  <p className="text-2xl font-bold text-gray-900">{item.rating}</p>
                  <p className="mt-1 text-xs font-semibold text-gray-700">{item.source}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">{item.detail}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  14. FINAL CTA BAND                                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-900 relative overflow-hidden">
        {/* Rich gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800" />
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #6ee7b7, transparent 70%)" }}
        />

        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center lg:py-28">
          <FadeIn>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              Add human approval to your automations in 5 minutes
            </h2>
            <p className="mt-5 text-lg text-gray-400 max-w-xl mx-auto">
              One API call. No SDK required. Free forever for small teams.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={user ? "/org/overview" : "/signup"}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-gray-900 transition hover:bg-gray-100 hover:shadow-lg"
              >
                {user ? "Go to Dashboard" : "Start building — it's free"}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-8 py-4 text-sm font-semibold text-gray-300 transition hover:border-gray-500 hover:text-white"
              >
                Read the docs
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  15. ENTERPRISE FOOTER                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-gray-200/60 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div>
              <Image src="/logo_text.png" alt="OKRunit" width={440} height={120} className="h-7 w-auto" />
              <p className="mt-3 max-w-xs text-sm text-gray-500 leading-relaxed">
                Human-in-the-loop approval gateway for automations and AI agents. Pause. Approve. Continue.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Product</h4>
              <div className="flex flex-col gap-2.5">
                <a href="#features" className="text-sm text-gray-600 transition hover:text-gray-900">Features</a>
                <a href="#integrations" className="text-sm text-gray-600 transition hover:text-gray-900">Integrations</a>
                <a href="#pricing" className="text-sm text-gray-600 transition hover:text-gray-900">Pricing</a>
                <Link href="/docs" className="text-sm text-gray-600 transition hover:text-gray-900">API Docs</Link>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Company</h4>
              <div className="flex flex-col gap-2.5">
                <a href="mailto:support@okrunit.com" className="text-sm text-gray-600 transition hover:text-gray-900">Contact</a>
                <a href="mailto:support@okrunit.com" className="text-sm text-gray-600 transition hover:text-gray-900">Support</a>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Resources</h4>
              <div className="flex flex-col gap-2.5">
                <Link href="/docs" className="text-sm text-gray-600 transition hover:text-gray-900">Documentation</Link>
                <Link href="/docs" className="text-sm text-gray-600 transition hover:text-gray-900">API Reference</Link>
                <a href="#how-it-works" className="text-sm text-gray-600 transition hover:text-gray-900">How it Works</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Legal</h4>
              <div className="flex flex-col gap-2.5">
                <a href="#" className="text-sm text-gray-600 transition hover:text-gray-900">Privacy Policy</a>
                <a href="#" className="text-sm text-gray-600 transition hover:text-gray-900">Terms of Service</a>
              </div>
            </div>
          </div>

          {/* Bottom strip */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} OKRunit. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-xs text-gray-400 transition hover:text-gray-600">Sign in</Link>
              <Link href="/signup" className="text-xs text-gray-400 transition hover:text-gray-600">Sign up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

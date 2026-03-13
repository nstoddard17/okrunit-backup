"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  Bell,
  BarChart3,
  Clock,
  Search,
  CheckCircle2,
  Mail,
  Smartphone,
  TrendingUp,
  Activity,
  FileText,
  LayoutDashboard,
  Key,
  Users,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Feature data                                                       */
/* ------------------------------------------------------------------ */

const showcaseFeatures = [
  {
    number: "01",
    label: "Dashboard",
    title: "Review every request in real-time",
    description:
      "Your centralized command center for all approval requests. Filter by status, priority, or source. Click any request to see full context and take action instantly.",
  },
  {
    number: "02",
    label: "Rules Engine",
    title: "Route approvals to the right people",
    description:
      "Build intelligent rules that automatically route requests based on action type, priority, source, or custom conditions. Set up escalation paths and auto-approve low-risk actions.",
  },
  {
    number: "03",
    label: "Notifications",
    title: "Approve from anywhere",
    description:
      "Get notified via email, Slack, or push notifications the moment a request needs attention. Approve or reject directly from the notification — no context switching required.",
  },
  {
    number: "04",
    label: "Analytics",
    title: "Full visibility into every decision",
    description:
      "Track approval rates, response times, and request volumes over time. The complete audit trail gives you traceability for compliance and operational insight.",
  },
  {
    number: "05",
    label: "Integrations",
    title: "Connect your entire stack",
    description:
      "One REST API connects Gatekeeper to any automation platform. Pre-built integrations for Zapier, Make, n8n, and Slack. Webhook callbacks deliver decisions in real-time.",
  },
];

/* ------------------------------------------------------------------ */
/*  Mock Panel (dark themed to match Tesslate)                         */
/* ------------------------------------------------------------------ */

function MockPanel({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] shadow-2xl shadow-black/40">
      {/* Browser chrome */}
      <div className="flex items-center justify-between border-b border-[#2a2a2a] bg-[#111] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        {label && (
          <span className="font-mono text-[10px] tracking-wider text-[#555]">{label}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock Visuals (dark themed)                                         */
/* ------------------------------------------------------------------ */

function DashboardVisual() {
  const approvals = [
    { title: "Delete user account #4821", status: "Pending", statusColor: "#f59e0b", time: "2m ago" },
    { title: "Send bulk email (2,400 recipients)", status: "Approved", statusColor: "#22c55e", time: "8m ago" },
    { title: "Deploy to production v3.2.1", status: "Pending", statusColor: "#f59e0b", time: "14m ago" },
    { title: "Update billing plan for org #127", status: "Approved", statusColor: "#22c55e", time: "23m ago" },
  ];

  return (
    <MockPanel label="APPROVAL_DASHBOARD">
      <div className="flex" style={{ height: "380px" }}>
        {/* Mini sidebar */}
        <div className="hidden w-40 shrink-0 border-r border-[#2a2a2a] bg-[#111] sm:flex sm:flex-col">
          <div className="flex items-center justify-center border-b border-[#2a2a2a] px-3 py-2.5">
            <Image src="/logo_text.png" alt="Gatekeeper" width={160} height={44} className="h-5 w-auto brightness-200 invert" />
          </div>
          <div className="flex-1 space-y-0.5 px-2 py-2">
            {[
              { icon: LayoutDashboard, label: "Dashboard", active: true, badge: "3" },
              { icon: Key, label: "Connections" },
              { icon: Users, label: "Team" },
              { icon: ShieldCheck, label: "Rules" },
              { icon: FileText, label: "Audit Log" },
              { icon: BarChart3, label: "Analytics" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-medium"
                style={{
                  backgroundColor: item.active ? "rgba(245,158,11,0.12)" : "transparent",
                  color: item.active ? "#f59e0b" : "#555",
                }}
              >
                <item.icon className="h-2.5 w-2.5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {"badge" in item && item.badge && (
                  <span className="rounded bg-amber-600 px-1 py-0.5 text-[7px] font-bold leading-none text-white">{item.badge}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#2a2a2a] px-3 py-1.5">
            <div className="flex items-center gap-1 rounded-md border border-[#2a2a2a] px-2 py-0.5">
              <Search className="h-2 w-2 text-[#444]" />
              <span className="text-[8px] text-[#444]">Search...</span>
            </div>
            <div className="rounded-md border border-[#2a2a2a] px-2 py-0.5 text-[8px] text-[#555]">Status: All</div>
          </div>
          <div className="flex-1 space-y-1.5 overflow-y-auto p-2.5">
            {approvals.map((a) => (
              <div key={a.title} className="rounded-lg border border-[#2a2a2a] bg-[#111] p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-semibold text-[#ccc]">{a.title}</span>
                  <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[7px] font-medium text-white" style={{ backgroundColor: a.statusColor }}>{a.status}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[7px] text-[#555]">
                  <Clock className="h-2 w-2" />{a.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockPanel>
  );
}

function RulesVisual() {
  const rules = [
    { condition: "action_type = 'delete'", action: "Require approval", priority: "High", icon: ShieldCheck, color: "#ef4444" },
    { condition: "priority = 'low'", action: "Auto-approve", priority: "Low", icon: CheckCircle2, color: "#22c55e" },
    { condition: "source = 'production'", action: "Notify #ops-team", priority: "Critical", icon: Bell, color: "#f59e0b" },
  ];

  return (
    <MockPanel label="RULES_ENGINE">
      <div className="p-4" style={{ minHeight: "380px" }}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#ccc]">Approval Rules</span>
          <span className="rounded-lg bg-amber-600 px-2 py-1 text-[8px] font-semibold text-white">+ New Rule</span>
        </div>
        <div className="space-y-2.5">
          {rules.map((rule, i) => (
            <div key={i} className="rounded-xl border border-[#2a2a2a] bg-[#111] p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ backgroundColor: `${rule.color}20`, color: rule.color }}>
                  <rule.icon className="h-3 w-3" />
                </div>
                <span className="text-[10px] font-semibold text-[#ccc]">{rule.action}</span>
                <span className="ml-auto rounded-full border px-1.5 py-0.5 text-[7px] font-medium" style={{ borderColor: rule.color, color: rule.color }}>{rule.priority}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-medium text-[#555]">WHEN</span>
                <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[8px] font-mono text-amber-400">{rule.condition}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockPanel>
  );
}

function NotificationsVisual() {
  const channels = [
    { icon: Mail, label: "Email", desc: "Approval request: Delete user #4821", time: "Just now", color: "#6366f1" },
    { icon: () => <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor"><path d="M5.5 1.5A1.5 1.5 0 0 0 4 3v10l4-3 4 3V3a1.5 1.5 0 0 0-1.5-1.5h-5z"/></svg>, label: "Slack", desc: "#approvals — New request needs review", time: "2s ago", color: "#e01e5a" },
    { icon: Smartphone, label: "Push", desc: "High priority approval waiting", time: "5s ago", color: "#22c55e" },
  ];

  return (
    <MockPanel label="NOTIFICATIONS">
      <div className="p-4" style={{ minHeight: "380px" }}>
        <div className="mb-3 flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-[#ccc]">Notifications</span>
        </div>
        <div className="space-y-2.5">
          {channels.map((ch, i) => (
            <div key={i} className="rounded-xl border border-[#2a2a2a] bg-[#111] p-3">
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${ch.color}20`, color: ch.color }}>
                  <ch.icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#ccc]">{ch.label}</span>
                    <span className="text-[8px] text-[#555]">{ch.time}</span>
                  </div>
                  <p className="mt-0.5 text-[9px] text-[#777]">{ch.desc}</p>
                  <div className="mt-2 flex gap-1.5">
                    <button className="rounded-md bg-emerald-600 px-2 py-0.5 text-[8px] font-semibold text-white">Approve</button>
                    <button className="rounded-md border border-[#333] px-2 py-0.5 text-[8px] font-semibold text-[#999]">Reject</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockPanel>
  );
}

function AnalyticsVisual() {
  const bars = [35, 52, 48, 72, 65, 88, 78];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxBar = Math.max(...bars);

  return (
    <MockPanel label="ANALYTICS">
      <div className="p-4" style={{ minHeight: "380px" }}>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#ccc]">Analytics Overview</span>
          <span className="rounded-lg border border-[#2a2a2a] px-2 py-0.5 text-[8px] text-[#555]">Last 7 days</span>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {[
            { label: "Avg Response", value: "2.4 min", icon: Clock, color: "#6366f1" },
            { label: "Approval Rate", value: "94.2%", icon: TrendingUp, color: "#22c55e" },
            { label: "Total Requests", value: "438", icon: Activity, color: "#f59e0b" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-[#2a2a2a] bg-[#111] p-2.5">
              <stat.icon className="mb-1 h-3 w-3" style={{ color: stat.color }} />
              <p className="text-sm font-bold text-[#eee]">{stat.value}</p>
              <p className="text-[8px] text-[#555]">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-3">
          <p className="mb-2 text-[9px] font-medium text-[#555]">Request Volume</p>
          <div className="flex items-end gap-2" style={{ height: "80px" }}>
            {bars.map((val, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm bg-amber-500"
                  style={{ height: `${(val / maxBar) * 100}%`, minHeight: "4px", opacity: 0.7 + (val / maxBar) * 0.3 }}
                />
                <span className="text-[7px] text-[#555]">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockPanel>
  );
}

function IntegrationsVisual() {
  const integrations = [
    { name: "Zapier", status: "Connected", color: "#ff4a00", connected: true },
    { name: "Make", status: "Connected", color: "#6366f1", connected: true },
    { name: "n8n", status: "Connected", color: "#ea4b71", connected: true },
    { name: "Slack", status: "Connected", color: "#4a154b", connected: true },
    { name: "Windmill", status: "Available", color: "#3b82f6", connected: false },
    { name: "LangChain", status: "Available", color: "#1a7f37", connected: false },
  ];

  return (
    <MockPanel label="INTEGRATIONS">
      <div className="p-4" style={{ minHeight: "380px" }}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#ccc]">Connections</span>
          <span className="rounded-lg bg-amber-600 px-2 py-1 text-[8px] font-semibold text-white">+ Connect</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {integrations.map((int) => (
            <div key={int.name} className="rounded-xl border border-[#2a2a2a] bg-[#111] p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: int.color }}>
                  {int.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#ccc]">{int.name}</p>
                  <div className="flex items-center gap-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${int.connected ? "bg-emerald-500" : "bg-[#444]"}`} />
                    <span className="text-[8px] text-[#555]">{int.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-dashed border-[#333] bg-[#111] p-3">
          <p className="text-[9px] font-medium text-[#555]">REST API</p>
          <code className="mt-1 block rounded bg-[#1a1a1a] px-2 py-1 text-[8px] font-mono text-amber-400">
            POST /api/v1/approvals
          </code>
        </div>
      </div>
    </MockPanel>
  );
}

const visuals = [DashboardVisual, RulesVisual, NotificationsVisual, AnalyticsVisual, IntegrationsVisual];

/* ------------------------------------------------------------------ */
/*  Main ScrollFeatureShowcase — scroll-locking Tesslate pattern       */
/* ------------------------------------------------------------------ */

export function ScrollFeatureShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  // Use scroll position within a tall container to determine active feature.
  // The container is tall enough (features * 100vh) so scrolling through it
  // naturally "locks" the viewport on the sticky content while progressing.
  const featureCount = showcaseFeatures.length;

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!container || !sticky) return;

    const rect = container.getBoundingClientRect();
    const containerTop = -rect.top;
    const scrollableHeight = container.offsetHeight - window.innerHeight;

    if (scrollableHeight <= 0) return;

    const progress = Math.max(0, Math.min(1, containerTop / scrollableHeight));
    const newIndex = Math.min(
      featureCount - 1,
      Math.floor(progress * featureCount)
    );

    setActiveIndex(newIndex);
  }, [featureCount]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <section className="relative bg-[#0a0a0a]">
      {/* Tall scroll container — each feature gets ~100vh of scroll distance (desktop only) */}
      <div
        ref={containerRef}
        className="hidden lg:block"
        style={{ height: `${featureCount * 100}vh` }}
      >
        {/* Sticky viewport that stays pinned while scrolling through */}
        <div
          ref={stickyRef}
          className="sticky top-0 flex min-h-screen flex-col justify-center overflow-hidden"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-12">
            {/* Step indicator row */}
            <div className="mb-10 flex items-center gap-6 border-b border-[#1a1a1a] pb-6">
              {showcaseFeatures.map((feature, i) => (
                <button
                  key={feature.number}
                  onClick={() => {
                    // Scroll to the right position within the container
                    const container = containerRef.current;
                    if (!container) return;
                    const containerRect = container.getBoundingClientRect();
                    const containerOffsetTop = window.scrollY + containerRect.top;
                    const scrollableHeight = container.offsetHeight - window.innerHeight;
                    const targetScroll = containerOffsetTop + (i / featureCount) * scrollableHeight;
                    window.scrollTo({ top: targetScroll, behavior: "smooth" });
                  }}
                  className="flex items-center gap-2 transition-opacity duration-300"
                  style={{ opacity: activeIndex === i ? 1 : 0.3 }}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold transition-colors duration-300"
                    style={{
                      backgroundColor: activeIndex === i ? "#f59e0b" : "#1a1a1a",
                      color: activeIndex === i ? "#000" : "#555",
                    }}
                  >
                    {feature.number}
                  </span>
                  <span className="hidden text-sm font-medium text-[#999] sm:inline">{feature.label}</span>
                </button>
              ))}

              {/* Progress fraction */}
              <span className="ml-auto font-mono text-sm text-[#333]">
                {activeIndex + 1} / {featureCount}
              </span>
            </div>

            {/* Section heading */}
            <div className="mb-8">
              <h2
                className="text-3xl font-bold text-white md:text-4xl"
                style={{ letterSpacing: "-0.03em" }}
              >
                {showcaseFeatures[activeIndex].title}
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-[#777]">
                {showcaseFeatures[activeIndex].description}
              </p>
            </div>

            {/* Two-column: feature list left, visual right */}
            <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.5fr] lg:gap-12">
              {/* Left: feature list */}
              <div className="space-y-1">
                {showcaseFeatures.map((feature, i) => (
                  <button
                    key={feature.number}
                    onClick={() => {
                      const container = containerRef.current;
                      if (!container) return;
                      const containerRect = container.getBoundingClientRect();
                      const containerOffsetTop = window.scrollY + containerRect.top;
                      const scrollableHeight = container.offsetHeight - window.innerHeight;
                      const targetScroll = containerOffsetTop + (i / featureCount) * scrollableHeight;
                      window.scrollTo({ top: targetScroll, behavior: "smooth" });
                    }}
                    className="group flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition-all duration-300"
                    style={{
                      backgroundColor: activeIndex === i ? "rgba(245,158,11,0.06)" : "transparent",
                      borderLeft: activeIndex === i ? "2px solid #f59e0b" : "2px solid transparent",
                    }}
                  >
                    <span
                      className="mt-0.5 shrink-0 text-xs font-bold transition-colors duration-300"
                      style={{ color: activeIndex === i ? "#f59e0b" : "#333" }}
                    >
                      {feature.number}
                    </span>
                    <div>
                      <p
                        className="font-semibold transition-colors duration-300"
                        style={{
                          color: activeIndex === i ? "#fff" : "#555",
                          fontSize: "14px",
                        }}
                      >
                        {feature.title}
                      </p>
                      {activeIndex === i && (
                        <p className="mt-1 text-sm leading-relaxed text-[#666]">
                          {feature.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Right: visual panel */}
              <div className="relative">
                {visuals.map((Visual, i) => (
                  <div
                    key={i}
                    className="transition-all duration-500"
                    style={{
                      opacity: activeIndex === i ? 1 : 0,
                      transform: activeIndex === i ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
                      position: activeIndex === i ? "relative" : "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      pointerEvents: activeIndex === i ? "auto" : "none",
                    }}
                  >
                    <Visual />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fallback: no scroll-locking, just stacked sections */}
      <div className="block lg:hidden">
        <div className="mx-auto max-w-2xl space-y-12 px-5 py-16">
          {showcaseFeatures.map((feature, i) => {
            const Visual = visuals[i];
            return (
              <div key={feature.number}>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-600 text-[10px] font-bold text-black">
                    {feature.number}
                  </span>
                  <span className="text-xs font-medium text-[#666]">{feature.label}</span>
                </div>
                <h3 className="text-xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#777]">
                  {feature.description}
                </p>
                <div className="mt-4">
                  <Visual />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

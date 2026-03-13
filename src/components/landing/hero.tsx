"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Shield,
  Zap,
  Bell,
  GitBranch,
  Menu,
  X,
  LayoutDashboard,
  Key,
  Users,
  ShieldCheck,
  FileText,
  Webhook,
  Settings,
  BarChart3,
  FlaskConical,
  Clock,
  Search,
  Globe,
  Layers,
  Lock,
  Terminal,
  Copy,
  Check,
} from "lucide-react";
import { ScrollFeatureShowcase } from "./scroll-feature-showcase";

/* ------------------------------------------------------------------ */
/*  Scroll-animated wrapper                                            */
/* ------------------------------------------------------------------ */

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setTimeout(() => { el.style.opacity = "1"; el.style.transform = "translateY(0)"; }, delay); observer.unobserve(el); }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className} style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  API Code Block — shows real product substance                      */
/* ------------------------------------------------------------------ */

function ApiCodeBlock() {
  const [copied, setCopied] = useState(false);

  const code = `curl -X POST https://api.gatekeeper.dev/v1/approvals \\
  -H "Authorization: Bearer gk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Delete user account #4821",
    "description": "Permanently remove user data",
    "action_type": "user.delete",
    "priority": "high",
    "callback_url": "https://your-app.com/webhook"
  }'`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-left shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-xs text-slate-500">Create an approval request</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code>
          <span className="text-amber-400">curl</span>
          <span className="text-slate-300"> -X POST </span>
          <span className="text-emerald-400">https://api.gatekeeper.dev/v1/approvals</span>
          <span className="text-slate-600"> \</span>{"\n"}
          <span className="text-slate-300">{"  "}-H </span>
          <span className="text-sky-300">&quot;Authorization: Bearer gk_live_...&quot;</span>
          <span className="text-slate-600"> \</span>{"\n"}
          <span className="text-slate-300">{"  "}-H </span>
          <span className="text-sky-300">&quot;Content-Type: application/json&quot;</span>
          <span className="text-slate-600"> \</span>{"\n"}
          <span className="text-slate-300">{"  "}-d </span>
          <span className="text-sky-300">&apos;{"{"}</span>{"\n"}
          <span className="text-sky-300">{"    "}&quot;</span><span className="text-slate-300">title</span><span className="text-sky-300">&quot;: &quot;</span><span className="text-emerald-400">Delete user account #4821</span><span className="text-sky-300">&quot;,</span>{"\n"}
          <span className="text-sky-300">{"    "}&quot;</span><span className="text-slate-300">action_type</span><span className="text-sky-300">&quot;: &quot;</span><span className="text-emerald-400">user.delete</span><span className="text-sky-300">&quot;,</span>{"\n"}
          <span className="text-sky-300">{"    "}&quot;</span><span className="text-slate-300">priority</span><span className="text-sky-300">&quot;: &quot;</span><span className="text-emerald-400">high</span><span className="text-sky-300">&quot;,</span>{"\n"}
          <span className="text-sky-300">{"    "}&quot;</span><span className="text-slate-300">callback_url</span><span className="text-sky-300">&quot;: &quot;</span><span className="text-emerald-400">https://your-app.com/webhook</span><span className="text-sky-300">&quot;</span>{"\n"}
          <span className="text-sky-300">{"  "}{"}"}&apos;</span>
        </code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock App Dashboard                                                 */
/* ------------------------------------------------------------------ */

function MockDashboard() {
  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true, badge: "3" },
    { icon: Key, label: "Connections", active: false },
    { icon: Users, label: "Team", active: false },
    { icon: ShieldCheck, label: "Rules", active: false },
    { icon: FileText, label: "Audit Log", active: false },
    { icon: Webhook, label: "Webhooks", active: false },
    { icon: BarChart3, label: "Analytics", active: false },
    { icon: FlaskConical, label: "Playground", active: false },
    { icon: Settings, label: "Settings", active: false },
  ];

  const approvals = [
    { title: "Delete user account #4821", desc: "Permanently remove user and all associated data", source: "Zapier", time: "2 min ago", status: "Pending", statusColor: "#f59e0b", priority: "High", prioColor: "#ef4444" },
    { title: "Send bulk email (2,400 recipients)", desc: "Marketing campaign — Q1 product launch", source: "n8n", time: "8 min ago", status: "Approved", statusColor: "#22c55e", priority: "Medium", prioColor: "#f59e0b" },
    { title: "Deploy to production v3.2.1", desc: "Release includes auth fix and new webhook endpoint", source: "AI Agent", time: "14 min ago", status: "Pending", statusColor: "#f59e0b", priority: "High", prioColor: "#ef4444" },
    { title: "Update billing plan for org #127", desc: "Upgrade from Pro to Enterprise tier", source: "Zapier", time: "23 min ago", status: "Approved", statusColor: "#22c55e", priority: "Low", prioColor: "#6b7280" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-900/10">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </div>

      {/* App layout */}
      <div className="flex bg-white" style={{ height: "380px" }}>
        {/* Sidebar */}
        <div className="hidden w-48 shrink-0 border-r border-slate-200 bg-slate-50/60 sm:flex sm:flex-col">
          <div className="flex items-center justify-center border-b border-slate-200 px-3 py-2.5">
            <Image src="/logo_text.png" alt="Gatekeeper" width={220} height={60} className="h-7 w-auto" />
          </div>
          <div className="flex-1 space-y-0.5 px-2 py-2">
            {sidebarItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-medium"
                style={{
                  backgroundColor: item.active ? "#eef2ff" : "transparent",
                  color: item.active ? "#4338ca" : "#6b7280",
                }}
              >
                <item.icon className="h-3 w-3 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded bg-indigo-600 px-1 py-0.5 text-[8px] font-bold leading-none text-white">
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 px-2 py-2">
            <div className="flex items-center gap-2 px-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[7px] font-bold text-white">NS</div>
              <span className="text-[9px] text-slate-400">nathaniel@gk.com</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center border-b border-slate-200 px-4 py-2">
            <span className="text-sm font-semibold text-slate-900">Dashboard</span>
          </div>
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2">
            <div className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1">
              <Search className="h-2.5 w-2.5 text-slate-300" />
              <span className="text-[9px] text-slate-300">Search approvals...</span>
            </div>
            <div className="rounded-md border border-slate-200 px-2 py-1 text-[9px] text-slate-500">Status: All</div>
            <div className="rounded-md border border-slate-200 px-2 py-1 text-[9px] text-slate-500">Priority: All</div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {approvals.map((a) => (
              <div key={a.title} className="rounded-lg border border-slate-200 p-3 transition-shadow hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold leading-tight text-slate-900">{a.title}</span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded-full border px-1.5 py-0.5 text-[8px] font-medium" style={{ borderColor: a.prioColor, color: a.prioColor }}>{a.priority}</span>
                    <span className="rounded-full px-1.5 py-0.5 text-[8px] font-medium text-white" style={{ backgroundColor: a.statusColor }}>{a.status}</span>
                  </div>
                </div>
                <p className="mt-0.5 text-[9px] leading-tight text-slate-500">{a.desc}</p>
                <div className="mt-1.5 flex items-center gap-2 text-[8px] text-slate-400">
                  <span>{a.source}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2 w-2" />{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const features = [
  { icon: Shield, title: "Human Approval Gate", description: "Require human approval before destructive or sensitive actions execute. One API call pauses everything." },
  { icon: Zap, title: "Universal API", description: "Works with Zapier, Make, n8n, AI agents, and any custom automation via a single REST endpoint." },
  { icon: Bell, title: "Multi-Channel Notifications", description: "Get notified via email, push, or Slack. Approve from anywhere, on any device." },
  { icon: GitBranch, title: "Webhook Callbacks", description: "Automatic callbacks notify your systems the moment decisions are made. No polling required." },
];

const gridCards = [
  { icon: Globe, title: "Approve from anywhere", description: "Review and approve requests from the dashboard, email, Slack, or push notifications. Never miss a critical decision." },
  { icon: Layers, title: "Rules that route automatically", description: "Set up rules based on action type, priority, or source to auto-route approvals to the right people." },
  { icon: Lock, title: "Team-based permissions", description: "Fine-grained role-based access ensures the right reviewers see the right requests." },
];

const bigCard = {
  title: "A universal API that works with every automation",
  description: "Gatekeeper provides a single REST API that sits between your AI agents and destructive actions. One endpoint to create approvals, webhooks to deliver decisions.",
};

const howItWorks = [
  { step: "01", title: "Your automation calls the API", description: "Send a POST request with the action details. Gatekeeper creates the approval request and notifies the right people." },
  { step: "02", title: "A human reviews and decides", description: "Reviewers see the full context in the dashboard, email, or Slack. They approve or reject with one click." },
  { step: "03", title: "The decision is delivered instantly", description: "Gatekeeper fires a webhook callback to your automation with the decision. Your workflow resumes or halts." },
];

const footerLinks = {
  Product: ["Platform", "Pricing", "Changelog"],
  Company: ["About", "Contact", "Privacy"],
  Resources: ["Docs", "Community"],
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

interface HeroProps {
  user: { email: string; full_name: string | null } | null;
}

export function Hero({ user }: HeroProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-white text-slate-900">
      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center">
            <Image src="/logo_text.png" alt="Gatekeeper" width={440} height={120} className="h-10 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm text-slate-500 transition hover:text-slate-900">How it works</a>
            <a href="#features" className="text-sm text-slate-500 transition hover:text-slate-900">Features</a>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="hidden rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 md:inline-flex"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden text-sm text-slate-500 transition hover:text-slate-900 md:inline-flex">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="hidden rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 md:inline-flex"
                >
                  Get started
                </Link>
              </>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-900 md:hidden">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white p-4 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#how-it-works" className="text-sm text-slate-500" onClick={() => setMobileMenuOpen(false)}>How it works</a>
              <a href="#features" className="text-sm text-slate-500" onClick={() => setMobileMenuOpen(false)}>Features</a>
              {!user && (
                <Link href="/login" className="text-sm text-slate-500" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
              )}
              <Link href={user ? "/dashboard" : "/signup"} className="mt-1 rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white">
                {user ? "Dashboard" : "Get started"}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-20 lg:pt-28 lg:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: copy */}
          <div>
            <FadeIn>
              <p className="mb-4 text-sm font-medium text-slate-400">
                Human-in-the-loop for automations
              </p>
            </FadeIn>

            <FadeIn delay={80}>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
                Stop your AI agents before they do something you can&apos;t undo
              </h1>
            </FadeIn>

            <FadeIn delay={160}>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-500">
                Gatekeeper adds a human approval step to any automation.
                One API call pauses execution. A human reviews. Your workflow
                continues or stops. That simple.
              </p>
            </FadeIn>

            <FadeIn delay={240}>
              <div className="mt-8 flex items-center gap-3">
                {user ? (
                  <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
                      Get started
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/login" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                      Log in
                    </Link>
                  </>
                )}
              </div>
            </FadeIn>
          </div>

          {/* Right: API code block */}
          <FadeIn delay={300}>
            <ApiCodeBlock />
          </FadeIn>
        </div>
      </section>

      {/* ── Dashboard Preview ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <FadeIn>
          <MockDashboard />
        </FadeIn>
      </section>

      {/* ── How it Works ───────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <FadeIn>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              How it works
            </h2>
            <p className="mt-2 text-base text-slate-500">Three steps. No SDK. No vendor lock-in.</p>
          </FadeIn>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {howItWorks.map((step, i) => (
              <FadeIn key={step.step} delay={i * 100}>
                <div>
                  <span className="text-sm font-bold text-slate-300">{step.step}</span>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scroll Feature Showcase ──────────────────────────── */}
      <ScrollFeatureShowcase />

      {/* ── Feature Grid ───────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <FadeIn>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Built for the things that matter
          </h2>
          <p className="mt-2 max-w-lg text-base text-slate-500">
            Everything you need to add human oversight to automated systems.
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <FadeIn key={feature.title} delay={i * 60}>
              <div className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <feature.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{feature.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Grid Cards ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {gridCards.map((card, i) => (
            <FadeIn key={card.title} delay={i * 80}>
              <div className="flex min-h-[16rem] flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{card.description}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={100}>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-8 md:p-10">
            <div className="max-w-2xl">
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">{bigCard.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{bigCard.description}</p>
              <Link href={user ? "/dashboard" : "/signup"} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-slate-600">
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="border-t border-slate-200 bg-slate-900">
        <div className="mx-auto max-w-6xl px-5 py-20 text-center">
          <FadeIn>
            <h2 className="mx-auto max-w-xl text-2xl font-bold text-white sm:text-3xl">
              Add human oversight to your automations
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-slate-400">
              Free to start. One API endpoint. No SDK required.
            </p>
            <div className="mt-8">
              <Link href={user ? "/dashboard" : "/signup"} className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100">
                {user ? "Go to Dashboard" : "Get started"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center">
                <Image src="/logo_text.png" alt="Gatekeeper" width={220} height={60} className="h-8 w-auto" />
              </Link>
              <p className="mt-3 text-xs text-slate-400">
                Human-in-the-loop approval for every automation.
              </p>
            </div>
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{heading}</p>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link}><a href="#" className="text-sm text-slate-500 transition hover:text-slate-900">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
            <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} Gatekeeper</p>
            <div className="flex gap-4 text-xs text-slate-400">
              <a href="#" className="transition hover:text-slate-900">Terms</a>
              <a href="#" className="transition hover:text-slate-900">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

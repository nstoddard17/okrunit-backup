"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Shield,
  Zap,
  Bell,
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
  OctagonAlert,
  Workflow,
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
    <div ref={ref} className={className} style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}>
      {children}
    </div>
  );
}

/* (ApprovalFlowVisual removed — MockDashboard is now the hero visual) */

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
    { title: "Deploy to production v3.2.1", desc: "Release includes auth fix and new webhook endpoint", source: "Make", time: "14 min ago", status: "Pending", statusColor: "#f59e0b", priority: "High", prioColor: "#ef4444" },
    { title: "Update billing plan for org #127", desc: "Upgrade from Pro to Enterprise tier", source: "Zapier", time: "23 min ago", status: "Approved", statusColor: "#22c55e", priority: "Low", prioColor: "#6b7280" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] shadow-[var(--shadow-xl)]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--muted)] px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </div>

      {/* App layout */}
      <div className="flex bg-[var(--card)]" style={{ height: "380px" }}>
        {/* Sidebar */}
        <div className="hidden w-48 shrink-0 border-r border-[var(--border)] bg-[var(--sidebar)] sm:flex sm:flex-col">
          <div className="flex items-center justify-center border-b border-[var(--border)] px-3 py-2.5">
            <Image src="/logo_text.png" alt="Gatekeeper" width={220} height={60} className="h-7 w-auto" />
          </div>
          <div className="flex-1 space-y-0.5 px-2 py-2">
            {sidebarItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-medium"
                style={{
                  backgroundColor: item.active ? "oklch(0.94 0.012 265)" : "transparent",
                  color: item.active ? "oklch(0.45 0.15 265)" : "oklch(0.50 0.03 265)",
                }}
              >
                <item.icon className="h-3 w-3 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded px-1 py-0.5 text-[8px] font-bold leading-none text-white" style={{ backgroundColor: "oklch(0.45 0.15 265)" }}>
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--border)] px-2 py-2">
            <div className="flex items-center gap-2 px-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-bold text-white" style={{ backgroundColor: "oklch(0.45 0.15 265)" }}>NS</div>
              <span className="text-[9px] text-[var(--muted-foreground)]">nathaniel@gk.com</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center border-b border-[var(--border)] px-4 py-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">Dashboard</span>
          </div>
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2">
            <div className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2 py-1">
              <Search className="h-2.5 w-2.5 text-[var(--muted-foreground)]" />
              <span className="text-[9px] text-[var(--muted-foreground)]">Search approvals...</span>
            </div>
            <div className="rounded-md border border-[var(--border)] px-2 py-1 text-[9px] text-[var(--muted-foreground)]">Status: All</div>
            <div className="rounded-md border border-[var(--border)] px-2 py-1 text-[9px] text-[var(--muted-foreground)]">Priority: All</div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {approvals.map((a) => (
              <div key={a.title} className="rounded-lg border border-[var(--border)] p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold leading-tight text-[var(--foreground)]">{a.title}</span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded-full border px-1.5 py-0.5 text-[8px] font-medium" style={{ borderColor: a.prioColor, color: a.prioColor }}>{a.priority}</span>
                    <span className="rounded-full px-1.5 py-0.5 text-[8px] font-medium text-white" style={{ backgroundColor: a.statusColor }}>{a.status}</span>
                  </div>
                </div>
                <p className="mt-0.5 text-[9px] leading-tight text-[var(--muted-foreground)]">{a.desc}</p>
                <div className="mt-1.5 flex items-center gap-2 text-[8px] text-[var(--muted-foreground)]">
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
  { icon: Shield, title: "Pause before anything dangerous happens", description: "Your automation pauses and waits for a human to approve before executing sensitive actions like deletes, transfers, or deployments." },
  { icon: Zap, title: "Works with Zapier, Make, n8n, and more", description: "Connect Gatekeeper to any automation platform. Use the Zapier Send-and-Wait action, or connect via Make, n8n, or the REST API." },
  { icon: Bell, title: "Approve from email, Slack, or your phone", description: "Get notified the moment an action needs your attention. Approve or reject with one click — from wherever you are." },
  { icon: Workflow, title: "Your automation resumes instantly", description: "Once you approve, Gatekeeper notifies your automation and the workflow picks up right where it left off. No manual follow-up." },
];

const gridCards = [
  { icon: ShieldCheck, title: "Smart rules for common actions", description: "Auto-approve low-risk actions and route high-priority requests to the right people. Rules run automatically so you only review what matters." },
  { icon: Users, title: "Team-based approvals", description: "Assign requests to specific team members or teams. Require multiple approvers for critical actions." },
  { icon: OctagonAlert, title: "Emergency stop", description: "One click cancels all pending requests and blocks new ones. A kill switch for when something goes wrong." },
];

const bigCard = {
  title: "Built for Zapier Send-and-Wait",
  description: "Gatekeeper works natively with Zapier's Send-and-Wait action. Your Zap pauses, a human reviews the request, and the Zap continues automatically once approved. No code, no webhooks to configure, no polling.",
};

const howItWorks = [
  { step: "01", title: "Connect your tools", description: "Link Gatekeeper to Zapier, Make, n8n, or any automation platform. Create a connection in the dashboard — no code required." },
  { step: "02", title: "Automations pause automatically", description: "When a sensitive action triggers, Gatekeeper holds it and notifies your team via email, Slack, or push notification." },
  { step: "03", title: "Approve and continue", description: "Review the request, approve or reject with one click, and the workflow picks up right where it left off." },
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
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center">
            <Image src="/logo_text.png" alt="Gatekeeper" width={440} height={120} className="h-10 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">How it works</a>
            <a href="#features" className="text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">Features</a>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="hidden rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90 md:inline-flex"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] md:inline-flex">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="hidden rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90 md:inline-flex"
                >
                  Start for free
                </Link>
              </>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-[var(--foreground)] md:hidden">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--background)] p-4 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#how-it-works" className="text-sm text-[var(--muted-foreground)]" onClick={() => setMobileMenuOpen(false)}>How it works</a>
              <a href="#features" className="text-sm text-[var(--muted-foreground)]" onClick={() => setMobileMenuOpen(false)}>Features</a>
              {!user && (
                <Link href="/login" className="text-sm text-[var(--muted-foreground)]" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
              )}
              <Link href={user ? "/dashboard" : "/signup"} className="mt-1 rounded-lg bg-[var(--primary)] px-4 py-2 text-center text-sm font-medium text-[var(--primary-foreground)]">
                {user ? "Dashboard" : "Start for free"}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pt-20 lg:pt-28">
        {/* Centered copy */}
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <p className="mb-4 text-sm font-medium text-[var(--muted-foreground)]">
              Human-in-the-loop for automations
            </p>
          </FadeIn>

          <FadeIn delay={80}>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-[3.5rem]">
              A safety net for every automation
            </h1>
          </FadeIn>

          <FadeIn delay={160}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--muted-foreground)]">
              Your Zapier zaps, Make scenarios, and AI agents pause before doing
              anything dangerous. A human reviews and approves. The workflow
              continues or stops.
            </p>
          </FadeIn>

          <FadeIn delay={240}>
            <div className="mt-8 flex items-center justify-center gap-3">
              {user ? (
                <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90">
                    Start for free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--muted)]">
                    See how it works
                  </a>
                </>
              )}
            </div>
          </FadeIn>
        </div>

        {/* Full-width product screenshot */}
        <FadeIn delay={350} className="mt-16 pb-20">
          <MockDashboard />
        </FadeIn>
      </section>

      {/* ── How it Works ───────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-[var(--border)] bg-[var(--muted)]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <FadeIn>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
              How it works
            </h2>
            <p className="mt-2 text-base text-[var(--muted-foreground)]">Three steps. No code. Works with your existing tools.</p>
          </FadeIn>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {howItWorks.map((step, i) => (
              <FadeIn key={step.step} delay={i * 100}>
                <div>
                  <span className="text-sm font-bold" style={{ color: "oklch(0.80 0.03 265)" }}>{step.step}</span>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{step.description}</p>
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
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Everything you need to stay in control
          </h2>
          <p className="mt-2 max-w-lg text-base text-[var(--muted-foreground)]">
            Add human oversight to any automation — without slowing your team down.
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <FadeIn key={feature.title} delay={i * 60}>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-px">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--foreground)]">
                  <feature.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">{feature.description}</p>
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
              <div className="flex min-h-[16rem] flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--muted)] p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--card)] text-[var(--foreground)] shadow-[var(--shadow-sm)]">
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{card.description}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={100}>
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-8 md:p-10">
            <div className="max-w-2xl">
              <h3 className="text-xl font-bold text-[var(--foreground)] sm:text-2xl">{bigCard.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">{bigCard.description}</p>
              <Link href={user ? "/dashboard" : "/signup"} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] transition hover:opacity-80">
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="border-t border-[var(--border)] bg-[var(--foreground)]">
        <div className="mx-auto max-w-6xl px-5 py-20 text-center">
          <FadeIn>
            <h2 className="mx-auto max-w-xl text-2xl font-bold text-[var(--background)] sm:text-3xl">
              Add a safety net to your automations
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-[var(--background)]/60">
              Free to start. Works with Zapier, Make, n8n, Slack, and more.
            </p>
            <div className="mt-8">
              <Link href={user ? "/dashboard" : "/signup"} className="inline-flex items-center gap-2 rounded-lg bg-[var(--background)] px-6 py-3 text-sm font-medium text-[var(--foreground)] transition hover:opacity-90">
                {user ? "Go to Dashboard" : "Start for free"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center">
                <Image src="/logo_text.png" alt="Gatekeeper" width={220} height={60} className="h-8 w-auto" />
              </Link>
              <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                Human-in-the-loop approval for every automation.
              </p>
            </div>
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{heading}</p>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link}><a href="#" className="text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 sm:flex-row">
            <p className="text-xs text-[var(--muted-foreground)]">&copy; {new Date().getFullYear()} Gatekeeper</p>
            <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
              <a href="#" className="transition hover:text-[var(--foreground)]">Terms</a>
              <a href="#" className="transition hover:text-[var(--foreground)]">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

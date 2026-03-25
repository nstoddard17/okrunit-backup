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
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Code2,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { HeroNav } from "@/components/landing/hero-nav";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface LandingPageProps {
  user: { email: string; full_name: string | null } | null;
}

/* ------------------------------------------------------------------ */
/*  Typing code animation                                               */
/* ------------------------------------------------------------------ */

function TypedCode() {
  const [displayed, setDisplayed] = useState("");
  const codeRef = useRef<HTMLPreElement>(null);

  const code = `curl -X POST https://api.okrunit.com/v1/approvals \\
  -H "Authorization: Bearer gk_a1b2c3..." \\
  -d '{
    "title": "Delete 10,247 stale user records",
    "priority": "high",
    "action_type": "database_cleanup",
    "callback_url": "https://your-app.com/webhook"
  }'`;

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= code.length) {
        setDisplayed(code.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, []);

  return (
    <pre
      ref={codeRef}
      className="overflow-x-auto rounded-xl bg-[#1a1a2e] p-5 text-[13px] leading-relaxed text-emerald-400 shadow-2xl font-[var(--font-geist-mono)]"
    >
      <code>
        {displayed}
        <span className="animate-pulse">▊</span>
      </code>
    </pre>
  );
}

/* ------------------------------------------------------------------ */
/*  Scroll fade-in                                                      */
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
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Integration logos                                                    */
/* ------------------------------------------------------------------ */

const integrations = [
  "Zapier", "Make", "n8n", "GitHub Actions", "Windmill",
  "Temporal", "Prefect", "Dagster", "Pipedream",
];

/* ------------------------------------------------------------------ */
/*  Feature data                                                        */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Zap,
    title: "One API call",
    description: "Your automation sends a POST request. OKRunit pauses execution and notifies the right people. When they decide, your callback fires instantly.",
  },
  {
    icon: Bell,
    title: "Notify everywhere",
    description: "Email, Slack, Discord, Teams, Telegram, push notifications. Approvers decide from wherever they already are.",
  },
  {
    icon: GitBranch,
    title: "Smart routing",
    description: "Rules engine routes requests based on type, priority, and source. Auto-approve low-risk actions. Escalate critical ones.",
  },
  {
    icon: Shield,
    title: "Audit everything",
    description: "Every decision logged with who approved, when, and why. HMAC-signed callbacks. Encrypted API keys. Row-level security.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Response times, approval rates, bottleneck detection. Know which team members are overloaded and which automations need attention.",
  },
  {
    icon: Code2,
    title: "Developer-first",
    description: "REST API with OAuth 2.0 and API keys. Native integrations for 9 platforms. Comprehensive docs. API playground built in.",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function LandingPage({ user }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-[var(--font-dm-sans)]">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center">
            <Image src="/logo_text.png" alt="OKRunit" width={440} height={120} className="h-8 w-auto" />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm text-gray-500 transition hover:text-gray-900">How it works</a>
            <a href="#features" className="text-sm text-gray-500 transition hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-sm text-gray-500 transition hover:text-gray-900">Pricing</a>
            <Link href="/docs" className="text-sm text-gray-500 transition hover:text-gray-900">Docs</Link>
          </div>

          <div className="hidden md:block">
            <HeroNav user={user} />
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-100 px-5 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#how-it-works" className="text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>How it works</a>
              <a href="#features" className="text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#pricing" className="text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <Link href="/docs" className="text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>Docs</Link>
              <div className="pt-2">
                <HeroNav user={user} />
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pt-20 pb-16 lg:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: copy */}
          <div>
            <FadeIn>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-700">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                Now available for AI agent teams
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                Your Zapier zap wants to
                <span className="text-emerald-600"> delete 10,000 rows.</span>
                {" "}Should it?
              </h1>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-gray-500">
                OKRunit pauses automations and AI agents until a human approves. One API call. Approve from Slack, email, or your dashboard.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={user ? "/org/overview" : "/signup"}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  {user ? "Go to Dashboard" : "Start building — it's free"}
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Read the docs
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={400}>
              <p className="mt-4 text-xs text-gray-400">
                No credit card required. Free tier includes 100 requests/month.
              </p>
            </FadeIn>
          </div>

          {/* Right: product screenshot */}
          <FadeIn delay={300} className="relative">
            <div className="relative rounded-xl border border-gray-200 bg-gray-50 p-1.5 shadow-2xl shadow-gray-200/50">
              <Image
                src="/screenshots/hero-requests.png"
                alt="OKRunit approval dashboard showing pending requests"
                width={1280}
                height={800}
                className="rounded-lg"
                priority
              />
            </div>
            {/* Floating approval notification */}
            <div className="absolute -left-6 bottom-12 z-10 hidden rounded-xl border border-gray-200 bg-white p-3 shadow-lg sm:block">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="size-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Request approved</p>
                  <p className="text-[10px] text-gray-400">Callback delivered in 0.3s</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Integration logos ───────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <FadeIn>
            <p className="mb-5 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
              Works with the tools you already use
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {integrations.map((name) => (
                <span key={name} className="text-sm font-medium text-gray-400 transition hover:text-gray-600">
                  {name}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-20">
        <FadeIn>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Add human oversight in three steps
          </h2>
          <p className="mt-3 max-w-xl text-gray-500">
            No SDK. No webhook configuration. Just one HTTP request.
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-16 lg:grid-cols-2 lg:gap-20">
          {/* Left: steps */}
          <div className="space-y-12">
            {[
              {
                step: "1",
                title: "Your automation calls OKRunit",
                description: "When your workflow hits a destructive or sensitive action, it sends a POST request to create an approval. Execution pauses.",
              },
              {
                step: "2",
                title: "The right person gets notified",
                description: "OKRunit routes the request based on your rules — by source, priority, or action type. Notifications go out via Slack, email, or push.",
              },
              {
                step: "3",
                title: "They decide. Your automation resumes.",
                description: "The approver clicks approve or reject from wherever they are. OKRunit fires your callback URL with the decision. Done.",
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 120}>
                <div className="flex gap-5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-sm font-bold text-white">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Right: typed code block */}
          <FadeIn delay={200}>
            <div className="lg:sticky lg:top-24">
              <TypedCode />
              <p className="mt-3 text-xs text-gray-400">
                That's it. One request. OKRunit handles notifications, routing, and callbacks.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Product screenshot ──────────────────────────────────── */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <FadeIn>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                A dashboard your team will actually use
              </h2>
              <p className="mt-3 text-gray-500">
                See every pending request, who approved what, and how fast your team responds.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="relative mx-auto mt-12 max-w-5xl">
              <div className="rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl shadow-gray-300/30" style={{ transform: "perspective(2000px) rotateX(2deg)" }}>
                <Image
                  src="/screenshots/hero-overview.png"
                  alt="OKRunit organization overview dashboard"
                  width={1280}
                  height={800}
                  className="rounded-lg"
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <FadeIn>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need for safe automation
          </h2>
          <p className="mt-3 max-w-xl text-gray-500">
            Built for teams that move fast but can't afford mistakes.
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <FadeIn key={feature.title} delay={i * 80}>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 transition hover:border-gray-200 hover:shadow-md">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-gray-100">
                  <feature.icon className="size-5 text-gray-600" />
                </div>
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {feature.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Connections screenshot ──────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <FadeIn>
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Connect any automation platform
                </h2>
                <p className="mt-3 text-gray-500">
                  OAuth for Zapier and Make. API keys for everything else.
                  Key rotation with grace periods. Per-connection scoping and rate limits.
                </p>
                <div className="mt-6 space-y-3">
                  {["API keys with automatic rotation", "OAuth 2.0 with PKCE", "Per-connection rate limiting", "IP allowlists and action type scoping"].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <CheckCircle className="size-4 text-emerald-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={200}>
              <div className="rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
                <Image
                  src="/screenshots/hero-connections.png"
                  alt="OKRunit connections page showing Zapier and Make connected"
                  width={1280}
                  height={800}
                  className="rounded-lg"
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-4xl px-5 py-20">
        <FadeIn>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-gray-500">
              Start free. Upgrade when you need more.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {/* Free */}
            <div className="rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold">Free</h3>
              <p className="mt-1 text-3xl font-bold">$0</p>
              <p className="text-sm text-gray-400">forever</p>
              <ul className="mt-5 space-y-2.5">
                {["100 requests/month", "2 connections", "3 team members", "Email notifications", "7-day history"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={user ? "/org/overview" : "/signup"}
                className="mt-6 block rounded-xl border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                {user ? "Go to Dashboard" : "Get started"}
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border-2 border-gray-900 p-6">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-3 py-0.5 text-xs font-semibold text-white">
                Most popular
              </div>
              <h3 className="text-lg font-bold">Pro</h3>
              <p className="mt-1 text-3xl font-bold">$20<span className="text-base font-normal text-gray-400">/mo</span></p>
              <p className="text-sm text-gray-400">per organization</p>
              <ul className="mt-5 space-y-2.5">
                {["Unlimited requests", "15 connections", "15 team members", "Slack + email notifications", "Rules engine", "90-day history", "Analytics"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={user ? "/billing" : "/signup"}
                className="mt-6 block rounded-xl bg-gray-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                {user ? "Upgrade" : "Start free trial"}
              </Link>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold">Enterprise</h3>
              <p className="mt-1 text-3xl font-bold">Custom</p>
              <p className="text-sm text-gray-400">tailored to your needs</p>
              <ul className="mt-5 space-y-2.5">
                {["Everything in Pro", "Unlimited everything", "SSO / SAML", "Custom SLA", "Dedicated support", "Priority processing"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:support@okrunit.com"
                className="mt-6 block rounded-xl border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Talk to us
              </a>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <section className="bg-gray-900">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <FadeIn>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Add human approval to your automations in 5 minutes
            </h2>
            <p className="mt-4 text-gray-400">
              One API call. No SDK required. Free forever for small teams.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={user ? "/org/overview" : "/signup"}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
              >
                {user ? "Go to Dashboard" : "Start building — it's free"}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-7 py-3.5 text-sm font-semibold text-gray-300 transition hover:border-gray-500"
              >
                Read the docs
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <Image src="/logo_text.png" alt="OKRunit" width={440} height={120} className="h-6 w-auto" />
              <span className="text-sm text-gray-400">Human-in-the-loop approval gateway</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link href="/docs" className="transition hover:text-gray-600">Docs</Link>
              <a href="mailto:support@okrunit.com" className="transition hover:text-gray-600">Support</a>
              <Link href="/login" className="transition hover:text-gray-600">Sign in</Link>
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-gray-300">
            &copy; {new Date().getFullYear()} OKRunit. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

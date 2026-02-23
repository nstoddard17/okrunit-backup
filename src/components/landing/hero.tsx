import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Bell, GitBranch, ArrowRight, CheckCircle2 } from "lucide-react";
import { HeroNav } from "./hero-nav";

const features = [
  {
    icon: Shield,
    title: "Human Approval Gate",
    description:
      "Require human approval before destructive or sensitive actions execute.",
  },
  {
    icon: Zap,
    title: "Universal API",
    description:
      "Works with Zapier, Make, n8n, AI agents, and any custom automation.",
  },
  {
    icon: Bell,
    title: "Multi-Channel Notifications",
    description:
      "Get notified via email, push, or Slack. Approve from anywhere.",
  },
  {
    icon: GitBranch,
    title: "Webhook Callbacks",
    description:
      "Automatic callbacks notify your systems when decisions are made.",
  },
];

const steps = [
  {
    number: "1",
    title: "Agent calls API",
    description:
      "Your automation sends a POST request to Gatekeeper with the action details.",
  },
  {
    number: "2",
    title: "Human reviews",
    description:
      "The right people are notified and review the request in the dashboard, email, or Slack.",
  },
  {
    number: "3",
    title: "Decision delivered",
    description:
      "Gatekeeper sends the decision back to your automation via webhook callback.",
  },
];

interface HeroProps {
  user: { email: string; full_name: string | null } | null;
}

export function Hero({ user }: HeroProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo_text.png"
              alt="Gatekeeper"
              width={440}
              height={120}
              className="h-24 w-auto"
            />
          </Link>
          <HeroNav user={user} />
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/60" />
          {/* Decorative grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          <div className="relative container mx-auto px-4 py-28 text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              <CheckCircle2 className="h-4 w-4" />
              Trusted by engineering teams worldwide
            </div>

            <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
              Human approval for{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                every automation
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Gatekeeper sits between your AI agents, automations, and
              destructive actions. One API call pauses execution until a human
              approves.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4">
              {user ? (
                <Button
                  size="lg"
                  asChild
                  className="bg-blue-600 px-8 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700"
                >
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    asChild
                    className="bg-blue-600 px-8 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700"
                  >
                    <Link href="/signup">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="border-slate-300 bg-white px-8 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Link href="/login">Log in</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-y border-slate-200 bg-slate-50/80">
          <div className="container mx-auto px-4 py-24">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Everything you need for safe automation
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                A complete approval layer for your AI agents and workflows.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="bg-white">
          <div className="container mx-auto px-4 py-24">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Three simple steps to add human oversight to any workflow.
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-12 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-lg font-bold text-white shadow-lg shadow-blue-600/20">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to add human oversight?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
              Start protecting your automations in minutes. Free to get started.
            </p>
            <div className="mt-8">
              {user ? (
                <Button
                  size="lg"
                  asChild
                  className="bg-blue-500 px-8 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-400"
                >
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  asChild
                  className="bg-blue-500 px-8 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-400"
                >
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        <div className="container mx-auto px-4">
          &copy; {new Date().getFullYear()} Gatekeeper. Human-in-the-loop
          approval for every automation.
        </div>
      </footer>
    </div>
  );
}

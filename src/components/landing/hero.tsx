import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Bell, GitBranch } from "lucide-react";

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

export function Hero() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Gatekeeper" width={24} height={24} />
            <span className="text-xl font-bold">Gatekeeper</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Human approval for
            <br />
            <span className="text-muted-foreground">every automation</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Gatekeeper sits between your AI agents, automations, and destructive
            actions. One API call pauses execution until a human approves.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/50">
          <div className="container mx-auto grid gap-8 px-4 py-20 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="space-y-3">
                <feature.icon className="h-8 w-8" />
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold">How it works</h2>
          <div className="mx-auto mt-12 grid max-w-3xl gap-8 text-left sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              <h3 className="font-semibold">Agent calls API</h3>
              <p className="text-sm text-muted-foreground">
                Your automation sends a POST request to Gatekeeper with the
                action details.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                2
              </div>
              <h3 className="font-semibold">Human reviews</h3>
              <p className="text-sm text-muted-foreground">
                The right people are notified and review the request in the
                dashboard, email, or Slack.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                3
              </div>
              <h3 className="font-semibold">Decision delivered</h3>
              <p className="text-sm text-muted-foreground">
                Gatekeeper sends the decision back to your automation via
                webhook callback.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          Gatekeeper &mdash; Human-in-the-loop approval for every automation.
        </div>
      </footer>
    </div>
  );
}

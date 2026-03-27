import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Route,
  ScrollText,
  Cpu,
  Settings2,
} from "lucide-react";
import {
  MarketingPageSection,
  MarketingPageShell,
} from "@/components/marketing/marketing-page-shell";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why OKRunit exists, what it does, and how teams use it to add human approval to automation workflows.",
};

export default function AboutPage() {
  return (
    <MarketingPageShell
      eyebrow="Company"
      title="OKRunit exists to put human judgment back into automated work."
      intro="OKRunit is a human-in-the-loop approval gateway for teams running automations, AI agents, internal tools, and operational workflows. It sits between a workflow and a sensitive action, pauses execution, routes the request to the right reviewers, and records the decision trail."
    >
      <MarketingPageSection
        title="What OKRunit does"
        intro="The product is designed for workflows that should not execute without clear human sign-off."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: ClipboardList,
              title: "Central approval queue",
              body: "Requests from APIs, no-code tools, and agents land in one place with source, priority, context, and decision history.",
            },
            {
              icon: Route,
              title: "Routing and notifications",
              body: "Teams can route approvals to the right people and deliver them through dashboard, messaging channels, and webhook callbacks.",
            },
            {
              icon: ScrollText,
              title: "Audit visibility",
              body: "Every request, comment, decision, and configuration change is recorded so operators can understand what happened and why.",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-xl border border-border/50 bg-[var(--card)] p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 mb-3">
                  <Icon className="size-4.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {card.body}
                </p>
              </div>
            );
          })}
        </div>
      </MarketingPageSection>

      <MarketingPageSection
        title="How it fits into a workflow"
        intro="OKRunit is intentionally simple: it becomes the approval layer between a trigger and a sensitive action."
      >
        <div className="grid gap-3">
          {[
            {
              step: "1",
              title: "A workflow creates a request.",
              body: "This can come from a direct API call or from tools like Zapier, Make, n8n, GitHub Actions, or custom internal services.",
            },
            {
              step: "2",
              title: "Reviewers get context before deciding.",
              body: "The request includes the title, description, metadata, source, priority, and any configured routing rules or approval steps.",
            },
            {
              step: "3",
              title: "The decision flows back into the system.",
              body: "Once approved or rejected, OKRunit updates the request state and notifies the calling workflow so it can continue or stop.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 rounded-xl border border-border/50 bg-[var(--card)] p-5 shadow-[var(--shadow-card)]"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </MarketingPageSection>

      <MarketingPageSection
        title="Who uses it"
        intro="OKRunit is built for teams that need reliable control over operational changes, customer-impacting actions, and destructive workflows."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              icon: Cpu,
              title: "Engineering and platform teams",
              body: "Use OKRunit to gate production deploys, credential rotation, infrastructure changes, and bulk operations.",
            },
            {
              icon: Settings2,
              title: "Operations and business systems teams",
              body: "Use it to review CRM edits, account changes, notifications, billing updates, and customer-data workflows before they run.",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-xl border border-border/50 bg-[var(--card)] p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 mb-3">
                  <Icon className="size-4.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {card.body}
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          For implementation details, start with the{" "}
          <Link href="/docs" className="font-medium text-primary hover:text-primary/80">
            getting started guide
          </Link>{" "}
          or the{" "}
          <Link href="/docs/api" className="font-medium text-primary hover:text-primary/80">
            API reference
          </Link>
          .
        </p>
      </MarketingPageSection>
    </MarketingPageShell>
  );
}

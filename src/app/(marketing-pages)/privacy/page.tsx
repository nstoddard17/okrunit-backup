import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Eye,
  Key,
  ScrollText,
  UserCheck,
  Users,
  Webhook,
  Database,
} from "lucide-react";
import {
  MarketingPageSection,
  MarketingPageShell,
} from "@/components/marketing/marketing-page-shell";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "A product-level overview of the data categories OKRunit uses and the controls available to customers.",
};

export default function PrivacyPage() {
  return (
    <MarketingPageShell
      eyebrow="Trust"
      title="Privacy overview"
      intro="This page describes the main categories of data OKRunit uses to operate the product and route approvals. It is a product overview for customers evaluating the platform and should not be treated as legal advice."
    >
      <MarketingPageSection
        title="Data categories used by the product"
        intro="OKRunit processes the information required to create approval requests, route them, and keep an auditable decision trail."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              icon: Users,
              title: "Account and organization data",
              body: "User identity, organization membership, role assignments, and configuration needed to control access to the dashboard and approval flows.",
            },
            {
              icon: Database,
              title: "Approval request content",
              body: "Titles, descriptions, metadata, source identifiers, and other context supplied by your automations so reviewers can make a decision.",
            },
            {
              icon: ScrollText,
              title: "Audit and activity history",
              body: "Approvals, rejections, comments, route changes, and related events used to explain what happened over time.",
            },
            {
              icon: Key,
              title: "Connection and notification settings",
              body: "Connection names, API key metadata, and routing or messaging settings used to deliver requests and callbacks.",
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
      </MarketingPageSection>

      <MarketingPageSection
        title="How that data is used"
        intro="The product uses data to operate core workflow controls, not just to display screens."
      >
        <div className="grid gap-3">
          {[
            "To authenticate users and authorize access to organizations, requests, and settings.",
            "To route approval requests to the correct people and channels based on configured rules.",
            "To return approval outcomes to your workflows through dashboard updates and webhook callbacks.",
            "To preserve a history of requests, actions, and reviewer decisions for audit and operational review.",
          ].map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-card)]"
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="size-3 text-primary" />
              </span>
              <span className="text-sm text-foreground">{item}</span>
            </div>
          ))}
        </div>
      </MarketingPageSection>

      <MarketingPageSection
        title="Product controls that support privacy"
        intro="Several parts of the product are designed to limit unnecessary exposure of sensitive workflow details."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: UserCheck,
              title: "Scoped access",
              body: "Teams can use org membership, approval routing, and role controls so only the right reviewers see the right requests.",
            },
            {
              icon: Key,
              title: "API key handling",
              body: "Connection keys are issued for server-to-server workflows and are not shown again after creation in the product UI.",
            },
            {
              icon: Eye,
              title: "Traceable changes",
              body: "Audit history helps teams review who changed routes, who approved a request, and what context was attached.",
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
      </MarketingPageSection>

      <MarketingPageSection
        title="Questions and requests"
        intro="If you need clarification about the way OKRunit handles product data, contact support with your organization and use case."
      >
        <div className="rounded-xl border border-border/50 bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
          <p className="text-sm leading-6 text-foreground">
            Email{" "}
            <a
              href="mailto:support@okrunit.com"
              className="font-medium text-primary hover:text-primary/80"
            >
              support@okrunit.com
            </a>{" "}
            for product privacy questions. For implementation details, see the{" "}
            <Link href="/docs/api" className="font-medium text-primary hover:text-primary/80">
              API reference
            </Link>{" "}
            and{" "}
            <Link href="/docs/webhooks" className="font-medium text-primary hover:text-primary/80">
              webhook documentation
            </Link>
            .
          </p>
        </div>
      </MarketingPageSection>
    </MarketingPageShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Code2,
  CreditCard,
  Headphones,
  Mail,
  Shield,
  Webhook,
  Puzzle,
} from "lucide-react";
import {
  MarketingPageSection,
  MarketingPageShell,
} from "@/components/marketing/marketing-page-shell";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "How to contact OKRunit for support, sales, and product questions.",
};

export default function ContactPage() {
  return (
    <MarketingPageShell
      eyebrow="Company"
      title="Contact OKRunit"
      intro="Use the channel that matches what you need. Product questions, implementation help, and account support should go to support. Enterprise pricing and rollout discussions should go to sales."
    >
      <MarketingPageSection
        title="Where to reach us"
        intro="The fastest path is usually to email the right mailbox with enough context for us to reproduce or answer the issue."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: Headphones,
              label: "Support",
              email: "support@okrunit.com",
              body: "Product questions, account help, implementation guidance, and troubleshooting.",
            },
            {
              icon: Mail,
              label: "Sales",
              email: "enterprise@okrunit.com",
              body: "Enterprise pricing, rollout planning, procurement, and custom deployment discussions.",
            },
            {
              icon: Shield,
              label: "Privacy & Trust",
              email: "support@okrunit.com",
              body: "Questions about privacy, security posture, or trust-related product controls.",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.label}
                href={`mailto:${card.email}`}
                className="group rounded-xl border border-border/50 bg-[var(--card)] p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 mb-3">
                  <Icon className="size-4.5 text-primary" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {card.label}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {card.email}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {card.body}
                </p>
              </a>
            );
          })}
        </div>
      </MarketingPageSection>

      <MarketingPageSection
        title="What to include"
        intro="A concise, specific email helps us answer faster."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {[
            "Your organization name and the environment affected",
            "The workflow or integration involved",
            "The request title, connection name, or endpoint in question",
            "Any error message, webhook payload, or screenshot that helps reproduce the issue",
          ].map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-card)]"
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <ArrowRight className="size-3 text-primary" />
              </span>
              <span className="text-sm text-foreground">{item}</span>
            </div>
          ))}
        </div>
      </MarketingPageSection>

      <MarketingPageSection
        title="Self-serve resources"
        intro="If you just need implementation details, the docs usually answer it faster than a support thread."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <h3 className="text-sm font-semibold text-foreground">
              Technical setup
            </h3>
            <div className="mt-3 space-y-2">
              {[
                { href: "/docs", label: "Getting started", icon: BookOpen },
                { href: "/docs/api", label: "API reference", icon: Code2 },
                { href: "/docs/webhooks", label: "Webhooks and callbacks", icon: Webhook },
              ].map((link) => {
                const LinkIcon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <LinkIcon className="size-3.5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="rounded-xl border border-border/50 bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
            <h3 className="text-sm font-semibold text-foreground">
              Product and rollout
            </h3>
            <div className="mt-3 space-y-2">
              {[
                { href: "/docs/integrations", label: "Supported integrations", icon: Puzzle },
                { href: "/docs/billing", label: "Plans and billing", icon: CreditCard },
                { href: "/security", label: "Security overview", icon: Shield },
              ].map((link) => {
                const LinkIcon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <LinkIcon className="size-3.5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </MarketingPageSection>
    </MarketingPageShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
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
        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="mailto:support@okrunit.com"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Support
            </p>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">
              support@okrunit.com
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Product questions, account help, implementation guidance, and
              troubleshooting.
            </p>
          </a>
          <a
            href="mailto:enterprise@okrunit.com"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Sales
            </p>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">
              enterprise@okrunit.com
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enterprise pricing, rollout planning, procurement, and custom
              deployment discussions.
            </p>
          </a>
          <a
            href="mailto:support@okrunit.com"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Privacy & Trust
            </p>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">
              support@okrunit.com
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Questions about privacy, security posture, or trust-related
              product controls.
            </p>
          </a>
        </div>
      </MarketingPageSection>

      <MarketingPageSection
        title="What to include"
        intro="A concise, specific email helps us answer faster."
      >
        <ul className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          {[
            "Your organization name and the environment affected",
            "The workflow or integration involved",
            "The request title, connection name, or endpoint in question",
            "Any error message, webhook payload, or screenshot that helps reproduce the issue",
          ].map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              {item}
            </li>
          ))}
        </ul>
      </MarketingPageSection>

      <MarketingPageSection
        title="Self-serve resources"
        intro="If you just need implementation details, the docs usually answer it faster than a support thread."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="text-base font-semibold text-emerald-900">
              Technical setup
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <Link href="/docs" className="block font-medium text-emerald-800 hover:text-emerald-900">
                Getting started
              </Link>
              <Link href="/docs/api" className="block font-medium text-emerald-800 hover:text-emerald-900">
                API reference
              </Link>
              <Link href="/docs/webhooks" className="block font-medium text-emerald-800 hover:text-emerald-900">
                Webhooks and callbacks
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Product and rollout
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <Link href="/docs/integrations" className="block font-medium text-slate-700 hover:text-slate-900">
                Supported integrations
              </Link>
              <Link href="/docs/billing" className="block font-medium text-slate-700 hover:text-slate-900">
                Plans and billing
              </Link>
              <Link href="/security" className="block font-medium text-slate-700 hover:text-slate-900">
                Security overview
              </Link>
            </div>
          </div>
        </div>
      </MarketingPageSection>
    </MarketingPageShell>
  );
}

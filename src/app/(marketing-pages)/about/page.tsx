import type { Metadata } from "next";
import Link from "next/link";
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
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Central approval queue
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Requests from APIs, no-code tools, and agents land in one place with
              source, priority, context, and decision history.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Routing and notifications
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Teams can route approvals to the right people and deliver them
              through dashboard, messaging channels, and webhook callbacks.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Audit visibility
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Every request, comment, decision, and configuration change is
              recorded so operators can understand what happened and why.
            </p>
          </div>
        </div>
      </MarketingPageSection>

      <MarketingPageSection
        title="How it fits into a workflow"
        intro="OKRunit is intentionally simple: it becomes the approval layer between a trigger and a sensitive action."
      >
        <ol className="space-y-4 text-slate-700">
          <li className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
              1
            </span>
            <div>
              <p className="font-semibold text-slate-900">A workflow creates a request.</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                This can come from a direct API call or from tools like Zapier,
                Make, n8n, GitHub Actions, or custom internal services.
              </p>
            </div>
          </li>
          <li className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
              2
            </span>
            <div>
              <p className="font-semibold text-slate-900">Reviewers get context before deciding.</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                The request includes the title, description, metadata, source,
                priority, and any configured routing rules or approval steps.
              </p>
            </div>
          </li>
          <li className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
              3
            </span>
            <div>
              <p className="font-semibold text-slate-900">The decision flows back into the system.</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Once approved or rejected, OKRunit updates the request state and
                notifies the calling workflow so it can continue or stop.
              </p>
            </div>
          </li>
        </ol>
      </MarketingPageSection>

      <MarketingPageSection
        title="Who uses it"
        intro="OKRunit is built for teams that need reliable control over operational changes, customer-impacting actions, and destructive workflows."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Engineering and platform teams</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use OKRunit to gate production deploys, credential rotation,
              infrastructure changes, and bulk operations.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Operations and business systems teams</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use it to review CRM edits, account changes, notifications,
              billing updates, and customer-data workflows before they run.
            </p>
          </div>
        </div>
        <p className="text-sm leading-6 text-slate-600">
          For implementation details, start with the{" "}
          <Link href="/docs" className="font-medium text-emerald-700 hover:text-emerald-800">
            getting started guide
          </Link>{" "}
          or the{" "}
          <Link href="/docs/api" className="font-medium text-emerald-700 hover:text-emerald-800">
            API reference
          </Link>
          .
        </p>
      </MarketingPageSection>
    </MarketingPageShell>
  );
}

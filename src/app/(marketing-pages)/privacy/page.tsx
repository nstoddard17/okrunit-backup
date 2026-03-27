import type { Metadata } from "next";
import Link from "next/link";
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
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: "Account and organization data",
              body: "User identity, organization membership, role assignments, and configuration needed to control access to the dashboard and approval flows.",
            },
            {
              title: "Approval request content",
              body: "Titles, descriptions, metadata, source identifiers, and other context supplied by your automations so reviewers can make a decision.",
            },
            {
              title: "Audit and activity history",
              body: "Approvals, rejections, comments, route changes, and related events used to explain what happened over time.",
            },
            {
              title: "Connection and notification settings",
              body: "Connection names, API key metadata, and routing or messaging settings used to deliver requests and callbacks.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </MarketingPageSection>

      <MarketingPageSection
        title="How that data is used"
        intro="The product uses data to operate core workflow controls, not just to display screens."
      >
        <ul className="space-y-3 text-sm text-slate-700">
          {[
            "To authenticate users and authorize access to organizations, requests, and settings.",
            "To route approval requests to the correct people and channels based on configured rules.",
            "To return approval outcomes to your workflows through dashboard updates and webhook callbacks.",
            "To preserve a history of requests, actions, and reviewer decisions for audit and operational review.",
          ].map((item) => (
            <li key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              {item}
            </li>
          ))}
        </ul>
      </MarketingPageSection>

      <MarketingPageSection
        title="Product controls that support privacy"
        intro="Several parts of the product are designed to limit unnecessary exposure of sensitive workflow details."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Scoped access</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Teams can use org membership, approval routing, and role controls so
              only the right reviewers see the right requests.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">API key handling</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Connection keys are issued for server-to-server workflows and are
              not shown again after creation in the product UI.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Traceable changes</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Audit history helps teams review who changed routes, who approved a
              request, and what context was attached.
            </p>
          </div>
        </div>
      </MarketingPageSection>

      <MarketingPageSection
        title="Questions and requests"
        intro="If you need clarification about the way OKRunit handles product data, contact support with your organization and use case."
      >
        <p className="text-base leading-7 text-slate-700">
          Email{" "}
          <a
            href="mailto:support@okrunit.com"
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            support@okrunit.com
          </a>{" "}
          for product privacy questions. For implementation details, see the{" "}
          <Link href="/docs/api" className="font-medium text-emerald-700 hover:text-emerald-800">
            API reference
          </Link>{" "}
          and{" "}
          <Link href="/docs/webhooks" className="font-medium text-emerald-700 hover:text-emerald-800">
            webhook documentation
          </Link>
          .
        </p>
      </MarketingPageSection>
    </MarketingPageShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingPageSection,
  MarketingPageShell,
} from "@/components/marketing/marketing-page-shell";

export const metadata: Metadata = {
  title: "Security",
  description:
    "A product-level overview of the controls OKRunit uses to protect approvals, callbacks, and operational workflows.",
};

export default function SecurityPage() {
  return (
    <MarketingPageShell
      eyebrow="Trust"
      title="Security overview"
      intro="OKRunit is built to help teams add security and operational control to automated actions. This page summarizes the product controls customers commonly evaluate when reviewing the platform."
    >
      <MarketingPageSection
        title="Authentication and access"
        intro="The platform supports multiple access models depending on how a workflow integrates."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">API keys</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Server-to-server workflows can authenticate with connection-specific
              API keys for approval creation and management.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">OAuth 2.0</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              User-facing integrations can connect through OAuth with PKCE instead
              of sharing raw credentials directly with automation platforms.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">SSO / SAML</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Organizations can centralize authentication through SSO for tighter
              identity and access management.
            </p>
          </div>
        </div>
      </MarketingPageSection>

      <MarketingPageSection
        title="Controls around sensitive actions"
        intro="OKRunit is not just an inbox for approvals. It is a control layer around actions that should not execute automatically."
      >
        <ul className="space-y-3 text-sm text-slate-700">
          {[
            "Approval requests can be routed to specific people or teams based on source, priority, and request type.",
            "Teams can require human review before a workflow continues, including multi-step and designated approval flows.",
            "The product records request and decision history so operators can review exactly what was approved, rejected, or changed.",
            "Operational controls such as connection management, key rotation, and emergency-stop style workflow controls help teams reduce blast radius when something goes wrong.",
          ].map((item) => (
            <li key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              {item}
            </li>
          ))}
        </ul>
      </MarketingPageSection>

      <MarketingPageSection
        title="Delivery integrity and traceability"
        intro="Security depends on being able to trust both the outcome and the path it took."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Webhook callbacks</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Approval results can be delivered back to your systems through
              signed webhook callbacks so downstream workflows can verify origin
              before acting on the decision.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Audit history</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Audit logs capture request activity, flow changes, and route updates
              to support investigation, compliance review, and debugging.
            </p>
          </div>
        </div>
      </MarketingPageSection>

      <MarketingPageSection
        title="Learn more"
        intro="The most implementation-specific security details live in the product documentation."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/docs/api"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium text-emerald-900 transition-colors hover:bg-emerald-100"
          >
            API authentication and request model
          </Link>
          <Link
            href="/docs/webhooks"
            className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
          >
            Webhooks and callback verification
          </Link>
          <Link
            href="/docs/sso"
            className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
          >
            SSO and SAML configuration
          </Link>
        </div>
      </MarketingPageSection>
    </MarketingPageShell>
  );
}

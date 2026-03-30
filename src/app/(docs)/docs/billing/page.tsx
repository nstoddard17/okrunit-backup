import type { Metadata } from "next";
import Link from "next/link";
import { DocsImage } from "@/components/docs/docs-image";

export const metadata: Metadata = {
  title: "Plans & Billing",
  description:
    "OKrunit pricing plans — compare Free, Pro, Business, and Enterprise features, usage limits, and billing details.",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface PlanFeature {
  name: string;
  free: string;
  pro: string;
  business: string;
  enterprise: string;
}

const FEATURES: PlanFeature[] = [
  {
    name: "Approval requests / month",
    free: "50",
    pro: "1,000",
    business: "10,000",
    enterprise: "Unlimited",
  },
  {
    name: "Connections",
    free: "2",
    pro: "10",
    business: "50",
    enterprise: "Unlimited",
  },
  {
    name: "Team members",
    free: "3",
    pro: "10",
    business: "50",
    enterprise: "Unlimited",
  },
  {
    name: "Webhook callbacks",
    free: "Yes",
    pro: "Yes",
    business: "Yes",
    enterprise: "Yes",
  },
  {
    name: "Email notifications",
    free: "Yes",
    pro: "Yes",
    business: "Yes",
    enterprise: "Yes",
  },
  {
    name: "Slack notifications",
    free: "--",
    pro: "Yes",
    business: "Yes",
    enterprise: "Yes",
  },
  {
    name: "Multi-step approvals",
    free: "--",
    pro: "Yes",
    business: "Yes",
    enterprise: "Yes",
  },
  {
    name: "Approval rules & auto-routing",
    free: "--",
    pro: "Basic",
    business: "Advanced",
    enterprise: "Advanced",
  },
  {
    name: "Trust-based auto-approval",
    free: "--",
    pro: "--",
    business: "Yes",
    enterprise: "Yes",
  },
  {
    name: "Audit log retention",
    free: "7 days",
    pro: "90 days",
    business: "1 year",
    enterprise: "Custom",
  },
  {
    name: "Analytics & reporting",
    free: "Basic",
    pro: "Full",
    business: "Full",
    enterprise: "Full + custom",
  },
  {
    name: "Export (CSV / JSON)",
    free: "--",
    pro: "Yes",
    business: "Yes",
    enterprise: "Yes",
  },
  {
    name: "IP allowlist",
    free: "--",
    pro: "--",
    business: "Yes",
    enterprise: "Yes",
  },
  {
    name: "Geo restrictions",
    free: "--",
    pro: "--",
    business: "Yes",
    enterprise: "Yes",
  },
  {
    name: "Four-eyes principle",
    free: "--",
    pro: "--",
    business: "Yes",
    enterprise: "Yes",
  },
  {
    name: "SSO / SAML",
    free: "--",
    pro: "--",
    business: "--",
    enterprise: "Yes",
  },
  {
    name: "SLA guarantees",
    free: "--",
    pro: "--",
    business: "--",
    enterprise: "Yes",
  },
  {
    name: "Dedicated support",
    free: "Community",
    pro: "Email",
    business: "Priority email",
    enterprise: "Dedicated CSM",
  },
  {
    name: "Rate limit (per connection)",
    free: "60/hr",
    pro: "500/hr",
    business: "5,000/hr",
    enterprise: "10,000/hr",
  },
];

const PLAN_PRICES = [
  { name: "Free", price: "$0", period: "forever", highlight: false },
  { name: "Pro", price: "$29", period: "/month", highlight: true },
  { name: "Business", price: "$99", period: "/month", highlight: false },
  { name: "Enterprise", price: "Custom", period: "", highlight: false },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BillingPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        Plans & Billing
      </h1>
      <p className="mt-4 text-lg text-zinc-600 leading-relaxed">
        OKrunit offers plans for teams of every size, from solo developers
        experimenting with AI agents to enterprises with complex approval
        workflows.
      </p>

      {/* Plan cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_PRICES.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-lg border p-5 ${
              plan.highlight
                ? "border-emerald-300 bg-emerald-50"
                : "border-zinc-200"
            }`}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {plan.name}
            </h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-zinc-900">
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-sm text-zinc-500">{plan.period}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Which plan is right for you */}
      <h2 className="mt-12 text-2xl font-semibold text-zinc-900">
        Which plan is right for you?
      </h2>
      <div className="mt-4 space-y-4">
        <div className="rounded-lg border border-zinc-200 p-4">
          <h3 className="font-semibold text-zinc-900">Free</h3>
          <p className="mt-1 text-sm text-zinc-600">
            Perfect for trying out OKrunit. 50 approval requests per month, 2
            connections, and 3 team members. Email notifications included.
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="font-semibold text-emerald-900">
            Pro — most popular
          </h3>
          <p className="mt-1 text-sm text-emerald-800">
            For growing teams that need Slack notifications, multi-step
            approvals, basic routing rules, and full analytics. 1,000 requests
            per month.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <h3 className="font-semibold text-zinc-900">Business</h3>
          <p className="mt-1 text-sm text-zinc-600">
            For organizations that need advanced routing, trust-based
            auto-approval, IP allowlists, geo restrictions, and the four-eyes
            principle. 10,000 requests per month.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <h3 className="font-semibold text-zinc-900">Enterprise</h3>
          <p className="mt-1 text-sm text-zinc-600">
            Unlimited everything, SSO/SAML, SLA guarantees, and a dedicated
            customer success manager. Contact us for custom pricing.
          </p>
        </div>
      </div>

      {/* Feature comparison */}
      <h2 className="mt-12 text-2xl font-semibold text-zinc-900">
        Feature comparison
      </h2>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left">
              <th className="pb-3 pr-4 font-semibold text-zinc-900">
                Feature
              </th>
              <th className="pb-3 pr-4 text-center font-semibold text-zinc-900">
                Free
              </th>
              <th className="pb-3 pr-4 text-center font-semibold text-emerald-700">
                Pro
              </th>
              <th className="pb-3 pr-4 text-center font-semibold text-zinc-900">
                Business
              </th>
              <th className="pb-3 text-center font-semibold text-zinc-900">
                Enterprise
              </th>
            </tr>
          </thead>
          <tbody className="text-zinc-700">
            {FEATURES.map((feature, i) => (
              <tr
                key={feature.name}
                className={
                  i < FEATURES.length - 1 ? "border-b border-zinc-100" : ""
                }
              >
                <td className="py-2.5 pr-4 text-zinc-900">{feature.name}</td>
                <td className="py-2.5 pr-4 text-center">{feature.free}</td>
                <td className="py-2.5 pr-4 text-center">{feature.pro}</td>
                <td className="py-2.5 pr-4 text-center">
                  {feature.business}
                </td>
                <td className="py-2.5 text-center">{feature.enterprise}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* How to upgrade */}
      <h2 className="mt-12 text-2xl font-semibold text-zinc-900">
        How to upgrade or change your plan
      </h2>
      <ol className="mt-4 space-y-3 text-zinc-700">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">
            1
          </span>
          <span>
            Go to{" "}
            <Link
              href="/org/billing"
              className="text-emerald-600 hover:underline"
            >
              Billing
            </Link>{" "}
            in the dashboard sidebar.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">
            2
          </span>
          <span>
            You&apos;ll see your current plan, usage stats, and available plans.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">
            3
          </span>
          <span>
            Click <strong>Upgrade</strong> or <strong>Change Plan</strong> on the
            plan you want.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">
            4
          </span>
          <span>
            Complete checkout via Stripe. Upgrades take effect immediately.
          </span>
        </li>
      </ol>

      <DocsImage
        src="/screenshots/docs/billing-dashboard.png"
        alt="Billing dashboard showing current plan, usage stats, and upgrade options"
        caption="The billing dashboard shows your current plan, usage, and available upgrades."
      />

      <p className="mt-4 text-zinc-700">
        <strong>Upgrades</strong> take effect immediately, and you are billed a
        prorated amount for the remainder of your billing cycle.{" "}
        <strong>Downgrades</strong> take effect at the end of the current billing
        period. Your existing data and configuration are preserved, but you may
        lose access to features not included in the lower plan.
      </p>

      {/* Usage limits */}
      <h2 className="mt-12 text-2xl font-semibold text-zinc-900">
        Usage limits
      </h2>
      <p className="mt-4 text-zinc-700">
        When you reach your plan&apos;s monthly approval request limit:
      </p>
      <ul className="mt-4 space-y-3 text-zinc-700">
        <li>
          <strong className="text-zinc-900">At 80% (soft limit):</strong> You
          receive an email notification. All features continue working normally.
        </li>
        <li>
          <strong className="text-zinc-900">At 100% (hard limit):</strong> New
          approval requests via the API return a{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-zinc-800">
            402 Payment Required
          </code>{" "}
          error. Existing pending requests can still be approved or rejected.
          Dashboard access is unaffected.
        </li>
        <li>
          <strong className="text-zinc-900">48-hour grace period:</strong> You
          have 48 hours to upgrade before the hard limit is enforced, giving you
          time to upgrade without disrupting active workflows.
        </li>
      </ul>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <h4 className="font-semibold text-zinc-900">
          Check your usage via API
        </h4>
        <pre className="mt-2 overflow-x-auto rounded-md bg-zinc-900 p-3 text-xs leading-relaxed">
          <code className="text-zinc-100">{`curl https://okrunit.com/api/v1/org/usage \\
  -H "Authorization: Bearer gk_your_api_key"

// Response
{
  "plan": "pro",
  "requests_used": 742,
  "requests_limit": 1000,
  "connections_used": 4,
  "connections_limit": 10,
  "members_count": 6,
  "members_limit": 10,
  "billing_period_start": "2026-03-01T00:00:00.000Z",
  "billing_period_end": "2026-03-31T23:59:59.999Z"
}`}</code>
        </pre>
      </div>

      {/* Billing FAQ */}
      <h2 className="mt-12 text-2xl font-semibold text-zinc-900">
        Frequently asked questions
      </h2>

      <div className="mt-6 space-y-6">
        <div>
          <h3 className="font-semibold text-zinc-900">
            What counts as an approval request?
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            Each call to{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-zinc-800">
              POST /api/v1/approvals
            </code>{" "}
            that creates a new request counts as one. Idempotent retries (same{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-zinc-800">
              idempotency_key
            </code>
            ) do not count again. Requests created via platform integrations
            (Zapier, Make, etc.) count the same way.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-zinc-900">
            Do cancelled or expired requests count?
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            Yes, all created requests count toward your monthly limit regardless
            of their final status.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-zinc-900">
            Can I pay annually?
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            Yes. Annual billing is available for Pro and Business plans with a 20%
            discount. Toggle monthly/yearly on the billing page.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-zinc-900">
            What payment methods do you accept?
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            We accept all major credit cards via Stripe. Enterprise customers can
            pay via invoice with NET-30 terms.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-zinc-900">
            Is there a free trial for paid plans?
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            The Free plan is available indefinitely. For Pro and Business, we
            offer a 14-day free trial with no credit card required.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-zinc-900">
            How do I view my invoices?
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            Go to{" "}
            <Link
              href="/org/payments"
              className="text-emerald-600 hover:underline"
            >
              Payments
            </Link>{" "}
            in the dashboard to view and download all invoices.
          </p>
        </div>
      </div>

      {/* Enterprise CTA */}
      <div className="mt-12 rounded-lg border border-zinc-200 bg-zinc-50 p-6">
        <h3 className="text-lg font-semibold text-zinc-900">
          Need Enterprise features?
        </h3>
        <p className="mt-2 text-zinc-600">
          Get SSO/SAML, custom SLAs, dedicated support, and unlimited usage.
          Contact us for a custom quote tailored to your organization.
        </p>
        <a
          href="mailto:enterprise@okrunit.com"
          className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          Contact sales
        </a>
      </div>
    </article>
  );
}

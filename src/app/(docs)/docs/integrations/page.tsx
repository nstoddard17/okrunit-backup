import type { Metadata } from "next";
import Link from "next/link";
import { DocsImage } from "@/components/docs/docs-image";

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "OKRunit integrations — connect with Zapier, Make, n8n, GitHub Actions, Terraform, LangChain, and more.",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Integration {
  name: string;
  description: string;
  status: "available" | "beta" | "coming_soon";
}

interface Category {
  name: string;
  description: string;
  integrations: Integration[];
}

const CATEGORIES: Category[] = [
  {
    name: "Automation Platforms",
    description:
      "Add human approval gates to your no-code and low-code automation workflows.",
    integrations: [
      {
        name: "Zapier",
        description:
          "Native Zapier app with triggers for new approvals and actions for creating/managing requests. Use it in any Zap to pause execution until a human approves.",
        status: "available",
      },
      {
        name: "Make (Integromat)",
        description:
          "Custom Make app with modules for creating approvals, watching for decisions, and searching existing requests.",
        status: "available",
      },
      {
        name: "n8n",
        description:
          "Community node for n8n that provides trigger and action nodes for approval workflows within your self-hosted or cloud n8n instance.",
        status: "available",
      },
      {
        name: "monday.com",
        description:
          "Native monday.com app with triggers and actions for adding human approval gates to your monday.com automations and workflows.",
        status: "available",
      },
    ],
  },
  {
    name: "AI Agents",
    description:
      "Gate destructive actions from AI agents with human oversight before execution.",
    integrations: [
      {
        name: "LangChain",
        description:
          "Python and TypeScript tools that integrate with LangChain agents. The agent pauses and waits for human approval before executing sensitive tool calls.",
        status: "coming_soon",
      },
      {
        name: "CrewAI",
        description:
          "Custom tool for CrewAI agents that requires human approval before proceeding with high-stakes actions in multi-agent workflows.",
        status: "coming_soon",
      },
      {
        name: "AutoGen",
        description:
          "Integration for Microsoft AutoGen that adds human-in-the-loop approval to multi-agent conversations and task execution.",
        status: "coming_soon",
      },
    ],
  },
  {
    name: "Infrastructure & DevOps",
    description:
      "Require human sign-off before infrastructure changes, deployments, and releases.",
    integrations: [
      {
        name: "GitHub Actions",
        description:
          "GitHub Action that creates an approval request and waits for a decision before continuing the workflow. Ideal for deployment gates.",
        status: "available",
      },
      {
        name: "Terraform",
        description:
          "External approval step for Terraform Cloud/Enterprise run tasks. Blocks plan application until a human reviews and approves the changes.",
        status: "coming_soon",
      },
      {
        name: "Vercel",
        description:
          "Deployment protection integration that requires human approval before promoting preview deployments to production.",
        status: "coming_soon",
      },
      {
        name: "Netlify",
        description:
          "Build plugin and deploy hook integration that gates production deployments behind human approval.",
        status: "coming_soon",
      },
    ],
  },
  {
    name: "Enterprise Platforms",
    description:
      "Connect OKRunit to enterprise automation and internal tool platforms.",
    integrations: [
      {
        name: "Power Automate",
        description:
          "Custom connector for Microsoft Power Automate that adds approval steps to Power Automate flows using OKRunit as the backend.",
        status: "coming_soon",
      },
      {
        name: "Retool",
        description:
          "Retool component and workflow integration for building custom approval dashboards and embedding approval controls in internal tools.",
        status: "coming_soon",
      },
    ],
  },
  {
    name: "Workflow Engines",
    description:
      "Add human approval activities and tasks to durable workflow engines.",
    integrations: [
      {
        name: "Temporal",
        description:
          "Python activity and workflow that creates an approval request and blocks the workflow until a decision is made. Supports heartbeats for long-running waits.",
        status: "available",
      },
      {
        name: "Prefect",
        description:
          "Prefect task and flow that pauses a Prefect flow run pending human approval via OKRunit. Integrates with Prefect Cloud notifications.",
        status: "available",
      },
      {
        name: "Dagster",
        description:
          "Dagster op and sensor for gating asset materializations and job runs behind human approval. Supports Dagster Cloud.",
        status: "available",
      },
      {
        name: "Windmill",
        description:
          "Deno scripts for Windmill that create approval requests and poll for decisions within Windmill flows.",
        status: "available",
      },
      {
        name: "Pipedream",
        description:
          "Pipedream source and action components for triggering on approval events and creating requests from Pipedream workflows.",
        status: "available",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: Integration["status"] }) {
  const styles: Record<Integration["status"], string> = {
    available: "bg-emerald-100 text-emerald-700",
    beta: "bg-amber-100 text-amber-700",
    coming_soon: "bg-zinc-100 text-zinc-500",
  };
  const labels: Record<Integration["status"], string> = {
    available: "Available",
    beta: "Beta",
    coming_soon: "Coming soon",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function IntegrationsPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        Integrations
      </h1>
      <p className="mt-4 text-lg text-zinc-600 leading-relaxed">
        OKRunit connects to 19 platforms across automation, AI agents,
        infrastructure, and workflow engines. The easiest way to connect is to
        select the OKRunit node directly inside your automation platform — no
        code required.
      </p>

      {/* Main approach callout */}
      <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
        <h3 className="text-lg font-semibold text-emerald-900">
          How to connect (the easy way)
        </h3>
        <p className="mt-2 text-sm text-emerald-800 leading-relaxed">
          For every supported platform, the process is the same:
        </p>
        <ol className="mt-3 space-y-2 text-sm text-emerald-800">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>
              Open your automation platform (Zapier, Make, n8n, monday.com,
              GitHub Actions, Temporal, etc.)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>
              Add a new step and search for <strong>&quot;OKRunit&quot;</strong>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>
              Select the OKRunit node/module and connect your account when
              prompted
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <span>
              Fill in the request details (title, description, priority) and
              you&apos;re done
            </span>
          </li>
        </ol>
        <p className="mt-3 text-sm text-emerald-800">
          Your workflow will pause at the OKRunit step until a human approves or
          rejects. The decision is automatically passed to the next step.
        </p>
      </div>

      <DocsImage
        src="/screenshots/docs/connections-list.png"
        alt="OKRunit connections page showing active API connections"
        caption="Connections are created automatically when you link your account from a platform, or you can create them manually for API access."
      />

      {/* Platform-specific guides */}
      <h2 className="mt-12 text-2xl font-semibold text-zinc-900">
        Platform-specific setup
      </h2>

      {/* Zapier */}
      <h3 className="mt-8 text-xl font-semibold text-zinc-900">
        Zapier
      </h3>
      <p className="mt-2 text-zinc-700">
        OKRunit is available as a native Zapier app. Here&apos;s how to add it to
        any Zap:
      </p>
      <ol className="mt-4 space-y-3 text-zinc-700">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">1</span>
          <span>In the Zap editor, click <strong>+</strong> to add a new step.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">2</span>
          <span>Search for <strong>&quot;OKRunit&quot;</strong> in the app search.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">3</span>
          <span>Select the <strong>Create Approval Request</strong> action.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">4</span>
          <span>Click <strong>Sign in to OKRunit</strong> — this opens the OAuth flow. Sign in with your OKRunit credentials and authorize access.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">5</span>
          <span>Map your trigger data to the approval fields (title, description, priority).</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">6</span>
          <span>Test the step — you should see a new pending request appear in your OKRunit dashboard.</span>
        </li>
      </ol>
      <p className="mt-3 text-sm text-zinc-500">
        Zapier also supports triggers for <strong>Approval Decided</strong> and
        <strong> Approval Created</strong>, so you can build Zaps that react to
        decisions.
      </p>

      {/* Make */}
      <h3 className="mt-8 text-xl font-semibold text-zinc-900">
        Make (Integromat)
      </h3>
      <p className="mt-2 text-zinc-700">
        OKRunit has a custom Make app with modules for creating and managing
        approval requests:
      </p>
      <ol className="mt-4 space-y-3 text-zinc-700">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">1</span>
          <span>In your Make scenario, click <strong>+</strong> to add a module.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">2</span>
          <span>Search for <strong>&quot;OKRunit&quot;</strong>.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">3</span>
          <span>Choose a module: <strong>Create an Approval</strong>, <strong>Watch Approvals</strong>, or <strong>Search Approvals</strong>.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">4</span>
          <span>Click <strong>Add</strong> next to the Connection field and authorize your OKRunit account.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">5</span>
          <span>Configure the fields and run the scenario.</span>
        </li>
      </ol>

      {/* n8n */}
      <h3 className="mt-8 text-xl font-semibold text-zinc-900">n8n</h3>
      <p className="mt-2 text-zinc-700">
        OKRunit provides a community node for n8n:
      </p>
      <ol className="mt-4 space-y-3 text-zinc-700">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">1</span>
          <span>In your n8n workflow, click <strong>+</strong> and search for <strong>&quot;OKRunit&quot;</strong>.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">2</span>
          <span>Add the <strong>OKRunit</strong> node (trigger or action).</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">3</span>
          <span>Create credentials by entering your OKRunit API key (from the Connections page in the dashboard).</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">4</span>
          <span>Configure the node and execute.</span>
        </li>
      </ol>

      {/* GitHub Actions */}
      <h3 className="mt-8 text-xl font-semibold text-zinc-900">
        GitHub Actions
      </h3>
      <p className="mt-2 text-zinc-700">
        Add a human approval gate to any GitHub Actions workflow:
      </p>
      <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm leading-relaxed">
        <code className="text-zinc-100">{`- name: Request deployment approval
  uses: okrunit/approve-action@v1
  with:
    api-key: \${{ secrets.OKRUNIT_API_KEY }}
    title: "Deploy \${{ github.sha }} to production"
    description: "Triggered by \${{ github.actor }}"
    priority: high
    # The action waits until the request is approved or rejected
    # If rejected, the step fails and the workflow stops`}</code>
      </pre>

      <DocsImage
        src="/screenshots/docs/routes-list.png"
        alt="Approval routes configuration in the OKRunit dashboard"
        caption="Configure routing rules to control who gets notified and how many approvals are required per source."
      />

      {/* All integrations grid */}
      <h2 className="mt-12 text-2xl font-semibold text-zinc-900">
        All integrations
      </h2>
      <p className="mt-2 text-zinc-600">
        Below is the full list of 19 supported platforms, grouped by category.
      </p>

      {CATEGORIES.map((category) => (
        <section key={category.name} className="mt-10">
          <h3 className="text-xl font-semibold text-zinc-900">
            {category.name}
          </h3>
          <p className="mt-2 text-zinc-600">{category.description}</p>

          <div className="mt-4 space-y-3">
            {category.integrations.map((integration) => (
              <div
                key={integration.name}
                className="rounded-lg border border-zinc-200 p-4"
              >
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-zinc-900">
                    {integration.name}
                  </h4>
                  <StatusBadge status={integration.status} />
                </div>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                  {integration.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* API for technical users */}
      <h2 className="mt-12 text-2xl font-semibold text-zinc-900">
        For developers: use the API directly
      </h2>
      <p className="mt-4 text-zinc-700">
        Every integration above uses the OKRunit REST API under the hood. If
        your platform is not listed, or you prefer to work in code, you can
        replicate everything with standard HTTP requests:
      </p>

      <h3 className="mt-6 text-lg font-semibold text-zinc-900">
        Create an approval request
      </h3>
      <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm leading-relaxed">
        <code className="text-zinc-100">{`curl -X POST https://okrunit.com/api/v1/approvals \\
  -H "Authorization: Bearer gk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Delete user account #4821",
    "description": "Permanent deletion requested via support ticket",
    "priority": "high",
    "callback_url": "https://your-app.com/webhooks/okrunit",
    "source": "support-bot"
  }'`}</code>
      </pre>

      <h3 className="mt-6 text-lg font-semibold text-zinc-900">
        Poll for the decision
      </h3>
      <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm leading-relaxed">
        <code className="text-zinc-100">{`curl https://okrunit.com/api/v1/approvals/a1b2c3d4-... \\
  -H "Authorization: Bearer gk_your_api_key"

# Response when decided:
{
  "id": "a1b2c3d4-...",
  "status": "approved",
  "decided_at": "2026-03-24T11:30:00.000Z",
  "decided_by": "user-uuid"
}`}</code>
      </pre>

      <h3 className="mt-6 text-lg font-semibold text-zinc-900">
        Or receive a webhook callback
      </h3>
      <p className="mt-2 text-zinc-700">
        If you provided a{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-zinc-800">
          callback_url
        </code>
        , OKRunit will POST the decision to your endpoint automatically. See the{" "}
        <Link href="/docs/webhooks" className="text-emerald-600 hover:underline">
          Webhooks guide
        </Link>{" "}
        for payload format and HMAC verification.
      </p>

      <p className="mt-6 text-zinc-700">
        For complete endpoint documentation, see the{" "}
        <Link href="/docs/api" className="text-emerald-600 hover:underline">
          API Reference
        </Link>
        .
      </p>
    </article>
  );
}

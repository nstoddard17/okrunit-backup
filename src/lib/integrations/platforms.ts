// ---------------------------------------------------------------------------
// Gatekeeper -- Integration Platform Registry
// ---------------------------------------------------------------------------

export interface Platform {
  id: string;
  name: string;
  description: string;
  /** Inline SVG string for the platform logo */
  logoSvg: string;
  /** Brand accent color (hex) */
  color: string;
  /** Pre-filled connection name when creating via this integration */
  connectionName: string;
  /** Pre-filled connection description */
  connectionDescription: string;
  /** Step-by-step setup instructions shown after key creation */
  setupSteps: string[];
  /** Direct URL to the platform page where users paste the API key */
  connectUrl: string | null;
  /** Label for the "Open Platform" button */
  connectLabel: string | null;
}

export const PLATFORMS: Platform[] = [
  {
    id: "zapier",
    name: "Zapier",
    description:
      "Connect Gatekeeper to 7,000+ apps with Zapier workflows.",
    logoSvg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.535 8.465l-2.12 2.12a4.98 4.98 0 01-.294 1.314h2.879a4.97 4.97 0 01-.465-3.434zm-7.07 7.07l2.12-2.12a4.98 4.98 0 01.294-1.314H7.999a4.97 4.97 0 01.465 3.434zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm5 11h-3.586l2.536 2.536a.5.5 0 010 .707l-.707.707a.5.5 0 01-.707 0L12 14.414V18a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-3.586l-2.536 2.536a.5.5 0 01-.707 0l-.707-.707a.5.5 0 010-.707L8.586 13H5a.5.5 0 01-.5-.5v-1A.5.5 0 015 11h3.586L6.05 8.464a.5.5 0 010-.707l.707-.707a.5.5 0 01.707 0L10 9.586V6a.5.5 0 01.5-.5h1A.5.5 0 0112 6v3.586l2.536-2.536a.5.5 0 01.707 0l.707.707a.5.5 0 010 .707L13.414 11H17a.5.5 0 01.5.5v1a.5.5 0 01-.5.5z" fill="#FF4A00"/></svg>`,
    color: "#FF4A00",
    connectionName: "Zapier",
    connectionDescription:
      "API key for Zapier webhooks to submit approval requests to Gatekeeper.",
    setupSteps: [
      'In Zapier, create a new Zap and add a **Webhooks by Zapier** action.',
      'Set the action event to **Custom Request**.',
      'Set the method to **POST** and the URL to your Gatekeeper approvals endpoint.',
      'Under **Headers**, add `Authorization: Bearer <your-api-key>` and `Content-Type: application/json`.',
      'Configure the request body with your approval request payload.',
    ],
    connectUrl: "https://zapier.com/app/zaps/create",
    connectLabel: "Open Zapier",
  },
  {
    id: "make",
    name: "Make",
    description:
      "Build powerful automation scenarios with Make.com (formerly Integromat).",
    logoSvg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="#6D00CC"/><path d="M8.5 9a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm7 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-3.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="white"/></svg>`,
    color: "#6D00CC",
    connectionName: "Make",
    connectionDescription:
      "API key for Make.com scenarios to submit approval requests to Gatekeeper.",
    setupSteps: [
      'In Make, create a new scenario and add an **HTTP** module.',
      'Choose **Make a request** as the action.',
      'Set the method to **POST** and the URL to your Gatekeeper approvals endpoint.',
      'Under **Headers**, add `Authorization: Bearer <your-api-key>` and `Content-Type: application/json`.',
      'Set the body type to **Raw** and enter your approval request JSON.',
    ],
    connectUrl: "https://www.make.com/en/scenarios/create",
    connectLabel: "Open Make",
  },
  {
    id: "n8n",
    name: "n8n",
    description:
      "Self-hosted workflow automation with full control over your data.",
    logoSvg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="4" fill="#EA4B71"/><path d="M7 12h2l2-3 2 6 2-3h2" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    color: "#EA4B71",
    connectionName: "n8n",
    connectionDescription:
      "API key for n8n workflows to submit approval requests to Gatekeeper.",
    setupSteps: [
      'In n8n, add an **HTTP Request** node to your workflow.',
      'Set the method to **POST** and the URL to your Gatekeeper approvals endpoint.',
      'Under **Authentication**, choose **Header Auth**.',
      'Set the header name to `Authorization` and value to `Bearer <your-api-key>`.',
      'Configure the JSON body with your approval request payload.',
    ],
    connectUrl: "https://app.n8n.cloud/workflows/new",
    connectLabel: "Open n8n",
  },
  {
    id: "windmill",
    name: "Windmill",
    description:
      "Open-source developer platform for scripts, flows, and apps.",
    logoSvg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="4" fill="#3B82F6"/><path d="M12 7v5l3.5 3.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="5" stroke="white" stroke-width="1.5"/></svg>`,
    color: "#3B82F6",
    connectionName: "Windmill",
    connectionDescription:
      "API key for Windmill flows to submit approval requests to Gatekeeper.",
    setupSteps: [
      'In Windmill, create a new flow or script.',
      'Use the built-in HTTP client or `fetch` to make a **POST** request to your Gatekeeper approvals endpoint.',
      'Pass the header `Authorization: Bearer <your-api-key>`.',
      'Set `Content-Type: application/json` and include your approval request in the body.',
    ],
    connectUrl: "https://app.windmill.dev",
    connectLabel: "Open Windmill",
  },
  {
    id: "webhook",
    name: "Webhook",
    description:
      "Connect any HTTP-capable tool using a simple REST API call.",
    logoSvg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="4" fill="#0f172a"/><path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" stroke="white" stroke-width="1.5"/><path d="M12 8V5m0 14v-3m4-4h3M5 12h3" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    color: "#0f172a",
    connectionName: "Webhook",
    connectionDescription:
      "API key for generic webhook/HTTP integrations with Gatekeeper.",
    setupSteps: [
      'Make a **POST** request to your Gatekeeper approvals endpoint.',
      'Include the header `Authorization: Bearer <your-api-key>`.',
      'Set `Content-Type: application/json`.',
      'Send a JSON body with `title`, `description`, and optionally `priority`, `action_type`, and `metadata`.',
    ],
    connectUrl: null,
    connectLabel: null,
  },
  {
    id: "custom",
    name: "Custom",
    description:
      "Build a custom integration with the Gatekeeper REST API.",
    logoSvg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="4" fill="#64748b"/><path d="M9 8l-4 4 4 4m6-8l4 4-4 4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    color: "#64748b",
    connectionName: "Custom Integration",
    connectionDescription:
      "API key for a custom integration with Gatekeeper.",
    setupSteps: [
      'Use your preferred HTTP client or SDK to call the Gatekeeper API.',
      'Include the header `Authorization: Bearer <your-api-key>` in every request.',
      'Create approval requests via **POST** to your approvals endpoint.',
      'Poll for decisions via **GET** or configure a webhook callback to receive them automatically.',
    ],
    connectUrl: null,
    connectLabel: null,
  },
];

export function getPlatform(id: string): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}

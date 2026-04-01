// ---------------------------------------------------------------------------
// OKrunit -- Per-Page Tour Step Definitions
// ---------------------------------------------------------------------------

export interface TourStepConfig {
  id: string;
  targetSelector: string | null;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  highlightMode?: "default" | "full-width";
  actionLabel?: string;
}

export interface PageTourConfig {
  pageId: string;
  pathname: string;
  pageName: string;
  steps: TourStepConfig[];
}

// ---- Requests Page --------------------------------------------------------

const requestsSteps: TourStepConfig[] = [
  {
    id: "requests-overview",
    targetSelector: null,
    title: "Requests Page",
    description:
      "This is where all approval requests appear. Pending requests that need your attention are always shown at the top. Resolved requests appear below.",
    position: "center",
  },
  {
    id: "requests-hover-actions",
    targetSelector: "[data-tour='test-request']",
    title: "Quick Actions on Hover",
    description:
      "Hover over any pending request to reveal Approve and Reject buttons directly on the card — no need to open the detail panel for quick decisions.",
    position: "bottom",
  },
  {
    id: "requests-three-dots",
    targetSelector: "[data-tour='test-request']",
    title: "More Options",
    description:
      "The three-dot menu (visible on hover) lets you archive the request, configure the flow, or open the full detail panel for more context.",
    position: "bottom",
  },
  {
    id: "requests-filters",
    targetSelector: "[placeholder='Search approvals...']",
    title: "Search & Filter",
    description:
      "Search by title, filter by status, priority, or source. Use the Export button to download all visible requests as CSV.",
    position: "bottom",
  },
  {
    id: "requests-keyboard",
    targetSelector: null,
    title: "Keyboard Shortcuts",
    description:
      "When viewing a request's detail panel, press 'a' to approve or 'r' to reject. Press ⌘K (Ctrl+K on Windows) to open the search palette from anywhere.",
    position: "center",
  },
];

// ---- Routes Page ----------------------------------------------------------

const routesSteps: TourStepConfig[] = [
  {
    id: "routes-overview",
    targetSelector: null,
    title: "Approval Routes",
    description:
      "Routes define how requests from each source are handled. Each card represents a source (like a Zapier Zap or API connection). Routes are created automatically when the first request arrives from a source.",
    position: "center",
  },
  {
    id: "routes-config",
    targetSelector: "[data-tour='flow-card']",
    title: "Configure a Route",
    description:
      "Click the gear icon on any route card to configure: who approves (team or specific users), how many approvals are needed, whether to use sequential chains, and the default priority.",
    position: "bottom",
  },
];

// ---- Rules Page -----------------------------------------------------------

const rulesSteps: TourStepConfig[] = [
  {
    id: "rules-overview",
    targetSelector: null,
    title: "Conditional Rules",
    description:
      "Rules let you automatically handle requests based on conditions. Auto-approve low-risk actions, route critical requests to specific teams, or require multiple approvers. Rules are evaluated in order — first match wins.",
    position: "center",
  },
  {
    id: "rules-create",
    targetSelector: null,
    title: "Creating Rules",
    description:
      "Click 'New Rule' to create a rule. Set conditions (priority, action type, source, title pattern) and an action (auto-approve or route to a team/users with a required approval count). OKrunit also suggests rules on the Analytics page based on your approval history.",
    position: "center",
  },
];

// ---- Connections Page -----------------------------------------------------

const connectionsSteps: TourStepConfig[] = [
  {
    id: "connections-overview",
    targetSelector: "[data-tour='connection-section']",
    title: "Connections",
    description:
      "Connections are how external tools authenticate with OKrunit. Each connection has an API key for direct API access. You can also connect via OAuth from platforms like Zapier and Make.",
    position: "bottom",
  },
  {
    id: "connections-guides",
    targetSelector: null,
    title: "Integration Guides",
    description:
      "Click any platform logo at the top for step-by-step setup instructions. For API access, create a connection and use the API key with Bearer token authentication.",
    position: "center",
  },
];

// ---- Messaging Page -------------------------------------------------------

const messagingSteps: TourStepConfig[] = [
  {
    id: "messaging-overview",
    targetSelector: "[data-tour='messaging-section']",
    title: "Notification Channels",
    description:
      "Connect Slack, Discord, Microsoft Teams, or Telegram to receive approval notifications with interactive approve/reject buttons. Email and web push are enabled by default.",
    position: "bottom",
  },
  {
    id: "messaging-routing",
    targetSelector: null,
    title: "Notification Routing",
    description:
      "Each channel can be configured with routing rules to only receive notifications for specific sources, action types, or priority levels. This prevents notification noise.",
    position: "center",
  },
];

// ---- Analytics Page -------------------------------------------------------

const analyticsSteps: TourStepConfig[] = [
  {
    id: "analytics-overview",
    targetSelector: null,
    title: "Analytics Dashboard",
    description:
      "Track approval volume, approval rates, and response times over the last 30 days. The charts update as new requests come in.",
    position: "center",
  },
  {
    id: "analytics-patterns",
    targetSelector: null,
    title: "Pattern Suggestions",
    description:
      "Scroll down to see pattern suggestions — OKrunit analyzes your approval history and recommends auto-approve rules for requests that are consistently approved (90%+ rate, 10+ decisions).",
    position: "center",
  },
];

// ---- Overview Page --------------------------------------------------------

const overviewSteps: TourStepConfig[] = [
  {
    id: "overview-stats",
    targetSelector: null,
    title: "Organization Overview",
    description:
      "Your dashboard shows key stats at a glance: pending requests, approval count, approval rate, active connections, and team members. Click any stat to navigate to the relevant page.",
    position: "center",
  },
  {
    id: "overview-activity",
    targetSelector: "[data-tour='overview-main']",
    title: "Your Dashboard",
    description:
      "This is your main dashboard. At the top is your organization name, followed by key stat widgets (pending requests, approval rate, connections, and members). Below that is the recent activity feed showing the latest approval requests with their status, priority, and source.",
    position: "top",
    highlightMode: "full-width",
  },
];

// ---- All Page Tours -------------------------------------------------------

export const PAGE_TOURS: PageTourConfig[] = [
  { pageId: "overview", pathname: "/org/overview", pageName: "Overview", steps: overviewSteps },
  { pageId: "requests", pathname: "/requests", pageName: "Requests", steps: requestsSteps },
  { pageId: "routes", pathname: "/requests/routes", pageName: "Routes", steps: routesSteps },
  { pageId: "rules", pathname: "/requests/rules", pageName: "Rules", steps: rulesSteps },
  { pageId: "connections", pathname: "/requests/connections", pageName: "Connections", steps: connectionsSteps },
  { pageId: "messaging", pathname: "/requests/messaging", pageName: "Messaging", steps: messagingSteps },
  { pageId: "analytics", pathname: "/requests/analytics", pageName: "Analytics", steps: analyticsSteps },
];

// Full tour order (for the sequential "Start Tour" flow)
export const FULL_TOUR_ORDER = ["requests", "routes", "rules", "connections", "messaging", "analytics"];

// Legacy export for backward compat
export const TOUR_STEPS = PAGE_TOURS.flatMap((p) =>
  p.steps.map((s) => ({ ...s, pathname: p.pathname, actionLabel: s.actionLabel ?? "Next" })),
);

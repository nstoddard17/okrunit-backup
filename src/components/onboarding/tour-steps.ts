// ---------------------------------------------------------------------------
// OKrunit -- Interactive Tour Step Definitions
// ---------------------------------------------------------------------------

export interface TourStepConfig {
  id: string;
  pathname: string;
  targetSelector: string | null;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  actionLabel: string;
}

export const TOUR_STEPS: TourStepConfig[] = [
  {
    id: "see-request",
    pathname: "/requests",
    targetSelector: "[data-tour='test-request']",
    title: "Your First Approval Request",
    description:
      "This is an approval request — it was created by an automation and is waiting for a human to review it. Click it to open the detail panel and see the full context.",
    position: "bottom",
    actionLabel: "Next",
  },
  {
    id: "approve-reject",
    pathname: "/requests",
    targetSelector: "[data-tour='response-form']",
    title: "Approve or Reject",
    description:
      "Review the request details and make your decision. Click Approve to allow the action to proceed, or Reject to stop it. You can also add a comment explaining your decision.",
    position: "left",
    actionLabel: "I'll try it",
  },
  {
    id: "explore-routes",
    pathname: "/requests/routes",
    targetSelector: "[data-tour='flow-card']",
    title: "Approval Routes",
    description:
      "Routes define how requests from each source are handled. Each card represents a source (like a Zapier Zap). You can configure who approves, how many approvals are needed, and whether to use sequential chains. Click the gear icon to customize.",
    position: "bottom",
    actionLabel: "Next",
  },
  {
    id: "explore-rules",
    pathname: "/requests/rules",
    targetSelector: null,
    title: "Conditional Rules",
    description:
      "Rules let you auto-approve low-risk requests or route critical ones to specific teams. For example: 'If priority is critical AND action type is deploy, require 3 approvers from the Security team.' Rules are evaluated in order — first match wins.",
    position: "center",
    actionLabel: "Next",
  },
  {
    id: "setup-connection",
    pathname: "/requests/connections",
    targetSelector: "[data-tour='connection-section']",
    title: "Connections & API Keys",
    description:
      "Connections are how external tools authenticate with OKrunit. Each connection has an API key for direct API access, or you can use OAuth to connect platforms like Zapier and Make without sharing keys.",
    position: "bottom",
    actionLabel: "Next",
  },
  {
    id: "configure-notifications",
    pathname: "/requests/messaging",
    targetSelector: "[data-tour='messaging-section']",
    title: "Notification Channels",
    description:
      "Connect Slack, Discord, Microsoft Teams, or Telegram to receive approval notifications. Each channel can be configured with routing rules to only receive notifications for specific sources or priorities.",
    position: "bottom",
    actionLabel: "Next",
  },
  {
    id: "done",
    pathname: "/org/overview",
    targetSelector: null,
    title: "You're All Set! 🎉",
    description:
      "You've completed the tour! Your test data will be cleaned up automatically. Start connecting your real automations to OKrunit — check the Integrations docs for step-by-step guides for Zapier, Make, n8n, and more.",
    position: "center",
    actionLabel: "Finish Tour",
  },
];

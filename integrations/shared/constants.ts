// ---------------------------------------------------------------------------
// OKRunit -- Shared Constants for Platform Integrations
// ---------------------------------------------------------------------------

export const API_VERSION = "v1";

export const ENDPOINTS = {
  APPROVALS: `/api/${API_VERSION}/approvals`,
  APPROVAL_BY_ID: (id: string) => `/api/${API_VERSION}/approvals/${id}`,
  COMMENTS: (id: string) => `/api/${API_VERSION}/approvals/${id}/comments`,
} as const;

export const APPROVAL_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "expired",
] as const;

export const APPROVAL_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const FIELDS = {
  title: {
    label: "Title",
    required: true,
    maxLength: 500,
    helpText: "Short title for the approval request",
  },
  description: {
    label: "Description",
    required: false,
    maxLength: 5000,
    helpText: "Detailed description of what needs approval",
  },
  priority: {
    label: "Priority",
    required: true,
    helpText: "Urgency level: low, medium, high, or critical",
  },
  action_type: {
    label: "Action Type",
    required: false,
    helpText:
      "Category of the action (e.g., deploy, delete, transfer)",
  },
  callback_url: {
    label: "Callback URL",
    required: false,
    helpText:
      "URL to POST the decision result to when approved/rejected",
  },
  metadata: {
    label: "Metadata",
    required: false,
    helpText: "Arbitrary JSON key-value pairs for context",
  },
  expires_at: {
    label: "Expires At",
    required: false,
    helpText: "ISO 8601 datetime when the approval auto-expires",
  },
  idempotency_key: {
    label: "Idempotency Key",
    required: false,
    helpText: "Unique key to prevent duplicate requests",
  },
  required_approvals: {
    label: "Required Approvals",
    required: false,
    helpText: "Number of approvals needed (1-10, default 1)",
  },
  context_html: {
    label: "Context HTML",
    required: false,
    maxLength: 50000,
    helpText:
      "Rich HTML content displayed to approvers (sanitized server-side)",
  },
} as const;

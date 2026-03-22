// ---------------------------------------------------------------------------
// OKRunit -- Microsoft Teams Notification Channel (Adaptive Cards)
// ---------------------------------------------------------------------------

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TeamsNotificationParams {
  webhookUrl: string;
  requestId: string;
  title: string;
  description?: string;
  priority: string;
  connectionName?: string;
}

export interface TeamsDecisionParams {
  webhookUrl: string;
  requestTitle: string;
  decision: string;
  decidedBy?: string;
  comment?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map priority to a display label and Adaptive Card color. */
function priorityConfig(priority: string): {
  label: string;
  color: "attention" | "warning" | "good" | "default";
} {
  const map: Record<string, { label: string; color: "attention" | "warning" | "good" | "default" }> = {
    critical: { label: "Critical", color: "attention" },
    high: { label: "High", color: "attention" },
    medium: { label: "Medium", color: "warning" },
    low: { label: "Low", color: "good" },
  };
  return map[priority] ?? { label: priority, color: "default" };
}

/** Map a decision string to a Teams-friendly display string. */
function decisionDisplay(decision: string): string {
  const map: Record<string, string> = {
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };
  return map[decision] ?? decision;
}

/** Build the Adaptive Card body for a new approval request. */
function buildApprovalCard(params: TeamsNotificationParams): object {
  const dashboardUrl = `${APP_URL}/dashboard#request-${params.requestId}`;
  const interactUrl = `${APP_URL}/api/teams/interact`;
  const p = priorityConfig(params.priority);

  const bodyItems: object[] = [
    {
      type: "TextBlock",
      text: "New Approval Request",
      weight: "Bolder",
      size: "Large",
      wrap: true,
    },
    {
      type: "TextBlock",
      text: params.title,
      weight: "Bolder",
      size: "Medium",
      wrap: true,
      spacing: "Small",
    },
  ];

  if (params.description) {
    bodyItems.push({
      type: "TextBlock",
      text: params.description,
      wrap: true,
      spacing: "Small",
      isSubtle: true,
    });
  }

  // Priority and Request ID in a ColumnSet
  const factColumns: object[] = [
    {
      type: "Column",
      width: "auto",
      items: [
        {
          type: "TextBlock",
          text: "Priority",
          weight: "Bolder",
          size: "Small",
          isSubtle: true,
        },
        {
          type: "TextBlock",
          text: p.label,
          color: p.color,
          weight: "Bolder",
          size: "Small",
        },
      ],
    },
    {
      type: "Column",
      width: "auto",
      spacing: "Large",
      items: [
        {
          type: "TextBlock",
          text: "Request ID",
          weight: "Bolder",
          size: "Small",
          isSubtle: true,
        },
        {
          type: "TextBlock",
          text: `${params.requestId.slice(0, 8)}...`,
          size: "Small",
          fontType: "Monospace",
        },
      ],
    },
  ];

  if (params.connectionName) {
    factColumns.push({
      type: "Column",
      width: "auto",
      spacing: "Large",
      items: [
        {
          type: "TextBlock",
          text: "Connection",
          weight: "Bolder",
          size: "Small",
          isSubtle: true,
        },
        {
          type: "TextBlock",
          text: params.connectionName,
          size: "Small",
        },
      ],
    });
  }

  bodyItems.push({
    type: "ColumnSet",
    columns: factColumns,
    spacing: "Medium",
  });

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: bodyItems,
          actions: [
            {
              type: "Action.Submit",
              title: "Approve",
              style: "positive",
              data: {
                action: "approve",
                requestId: params.requestId,
              },
            },
            {
              type: "Action.Submit",
              title: "Reject",
              style: "destructive",
              data: {
                action: "reject",
                requestId: params.requestId,
              },
            },
            {
              type: "Action.OpenUrl",
              title: "View in Dashboard",
              url: dashboardUrl,
            },
          ],
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a Teams notification with an Adaptive Card containing approve/reject
 * buttons.
 *
 * The buttons use Action.Submit, which POST back to the Teams interact
 * endpoint (`/api/teams/interact`) when configured via a Teams bot/webhook.
 *
 * Errors are caught and logged -- Teams notifications must never break the
 * main request flow.
 */
export async function sendTeamsNotification(
  params: TeamsNotificationParams,
): Promise<void> {
  const payload = buildApprovalCard(params);

  try {
    const response = await fetch(params.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `[Teams] Webhook returned ${response.status} for request ${params.requestId}:`,
        body,
      );
      return;
    }

    console.log(
      `[Teams] Notification sent for request ${params.requestId}`,
    );
  } catch (err) {
    console.error("[Teams] Failed to send notification:", err);
  }
}

/**
 * Send a decision notification to Teams (simple message, no interactive
 * buttons).
 *
 * Errors are caught and logged -- Teams notifications must never break the
 * main request flow.
 */
export async function sendTeamsDecisionNotification(
  params: TeamsDecisionParams,
): Promise<void> {
  const decision = decisionDisplay(params.decision);
  const decidedByText = params.decidedBy
    ? ` by ${params.decidedBy}`
    : "";
  const commentText = params.comment
    ? `\n\n> _${params.comment}_`
    : "";

  const isApproved = params.decision === "approved";

  const payload = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: `${isApproved ? "\u2705" : "\u274C"} ${decision}: **${params.requestTitle}**${decidedByText}${commentText}`,
              wrap: true,
            },
          ],
        },
      },
    ],
  };

  try {
    const response = await fetch(params.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `[Teams] Decision webhook returned ${response.status}:`,
        body,
      );
      return;
    }

    console.log(
      `[Teams] Decision notification sent for "${params.requestTitle}"`,
    );
  } catch (err) {
    console.error("[Teams] Failed to send decision notification:", err);
  }
}

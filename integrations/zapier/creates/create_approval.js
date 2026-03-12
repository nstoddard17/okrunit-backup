// ---------------------------------------------------------------------------
// Gatekeeper Zapier -- Create Approval Request
// ---------------------------------------------------------------------------

const { GATEKEEPER_URL } = require("../authentication");

const createApproval = {
  key: "create_approval",
  noun: "Approval Request",

  display: {
    label: "Create Approval Request",
    description: "Submit a new approval request for human review.",
  },

  operation: {
    inputFields: [
      {
        key: "title",
        label: "Title",
        type: "string",
        required: true,
        helpText:
          "Short title for the approval request (max 500 characters). Use the + button to insert dynamic data from previous steps.",
      },
      {
        key: "priority",
        label: "Priority",
        type: "string",
        required: true,
        choices: {
          low: "Low",
          medium: "Medium",
          high: "High",
          critical: "Critical",
        },
        default: "medium",
        helpText: "Urgency level of the approval.",
      },
      {
        key: "description",
        label: "Description",
        type: "text",
        required: false,
        helpText:
          "Detailed description (max 5000 characters). Use the + button to insert dynamic data from previous steps.",
      },
      {
        key: "action_type",
        label: "Action Type",
        type: "string",
        required: false,
        dynamic: "action_types.id.name",
        helpText:
          "Category of the action. Options are managed in your Gatekeeper organization settings. You can also type a custom value.",
      },
      {
        key: "assigned_team",
        label: "Assign to Team",
        type: "string",
        required: false,
        dynamic: "teams.id.name",
        helpText:
          "Assign to an entire team. All approvers in the team will be notified. Leave empty to use individual approvers below or your default routing rules.",
      },
      {
        key: "assigned_approvers",
        label: "Assigned Approvers",
        type: "string",
        required: false,
        dynamic: "team_members.id.name",
        list: true,
        helpText:
          "Select specific team members who must approve. If multiple are selected, ALL must approve. Overrides team assignment if both are set.",
      },
      {
        key: "callback_url",
        label: "Callback URL",
        type: "string",
        required: false,
        helpText:
          "URL to POST the decision to when approved/rejected. Use a Zapier Webhook catch URL for powerful flows.",
      },
      {
        key: "metadata",
        label: "Metadata (JSON)",
        type: "string",
        required: false,
        helpText:
          'Arbitrary JSON object for additional context (e.g., {"order_id": "123"}).',
      },
      {
        key: "expires_at",
        label: "Expires At",
        type: "datetime",
        required: false,
        helpText: "When this request auto-expires if not decided.",
      },
    ],

    perform: async (z, bundle) => {
      // Auto-generate idempotency key to prevent duplicates
      const idempotencyKey = `zap-${bundle.meta.zap?.id || "unknown"}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const body = {
        title: bundle.inputData.title,
        priority: bundle.inputData.priority,
        idempotency_key: idempotencyKey,
      };

      if (bundle.inputData.description)
        body.description = bundle.inputData.description;
      if (bundle.inputData.action_type)
        body.action_type = bundle.inputData.action_type;
      if (bundle.inputData.callback_url)
        body.callback_url = bundle.inputData.callback_url;
      if (bundle.inputData.expires_at)
        body.expires_at = bundle.inputData.expires_at;
      if (bundle.inputData.assigned_team)
        body.assigned_team_id = bundle.inputData.assigned_team;

      // Assigned approvers: Zapier sends list fields as arrays
      if (
        bundle.inputData.assigned_approvers &&
        bundle.inputData.assigned_approvers.length > 0
      ) {
        body.assigned_approvers = bundle.inputData.assigned_approvers;
        // required_approvals is derived from the array length server-side
      }

      if (bundle.inputData.metadata) {
        try {
          body.metadata = JSON.parse(bundle.inputData.metadata);
        } catch {
          throw new z.errors.Error(
            "Metadata must be valid JSON",
            "INVALID_JSON",
            400,
          );
        }
      }

      const response = await z.request({
        method: "POST",
        url: `${GATEKEEPER_URL}/api/v1/approvals`,
        body,
      });

      return response.json;
    },

    sample: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Deploy v2.3.1 to production",
      description: "Release includes new payment flow",
      priority: "high",
      status: "pending",
      action_type: "deploy",
      required_approvals: 1,
      current_approvals: 0,
      auto_approved: false,
      created_at: "2026-02-21T10:00:00.000Z",
      updated_at: "2026-02-21T10:00:00.000Z",
    },
  },
};

module.exports = createApproval;

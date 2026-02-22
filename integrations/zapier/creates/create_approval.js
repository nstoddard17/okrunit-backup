// ---------------------------------------------------------------------------
// Gatekeeper Zapier -- Create Approval Request
// ---------------------------------------------------------------------------

const createApproval = {
  key: "create_approval",
  noun: "Approval Request",

  display: {
    label: "Create Approval Request",
    description: "Submit a new approval request for human review.",
    important: true,
  },

  operation: {
    inputFields: [
      {
        key: "title",
        label: "Title",
        type: "string",
        required: true,
        helpText: "Short title for the approval request (max 500 characters).",
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
        helpText: "Detailed description (max 5000 characters).",
      },
      {
        key: "action_type",
        label: "Action Type",
        type: "string",
        required: false,
        helpText:
          'Category of the action (e.g., "deploy", "delete", "transfer").',
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
      {
        key: "idempotency_key",
        label: "Idempotency Key",
        type: "string",
        required: false,
        helpText: "Unique key to prevent duplicate submissions.",
      },
      {
        key: "required_approvals",
        label: "Required Approvals",
        type: "integer",
        required: false,
        default: "1",
        helpText: "Number of approvals needed (1-10).",
      },
    ],

    perform: async (z, bundle) => {
      const body = {
        title: bundle.inputData.title,
        priority: bundle.inputData.priority,
      };

      if (bundle.inputData.description)
        body.description = bundle.inputData.description;
      if (bundle.inputData.action_type)
        body.action_type = bundle.inputData.action_type;
      if (bundle.inputData.callback_url)
        body.callback_url = bundle.inputData.callback_url;
      if (bundle.inputData.expires_at)
        body.expires_at = bundle.inputData.expires_at;
      if (bundle.inputData.idempotency_key)
        body.idempotency_key = bundle.inputData.idempotency_key;
      if (bundle.inputData.required_approvals) {
        body.required_approvals = parseInt(
          bundle.inputData.required_approvals,
          10,
        );
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
        url: `${bundle.authData.baseUrl}/api/v1/approvals`,
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

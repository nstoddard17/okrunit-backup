// ---------------------------------------------------------------------------
// Gatekeeper Zapier -- Request Approval (Send & Wait)
// ---------------------------------------------------------------------------
// This action creates an approval request and PAUSES the Zap until a human
// approves or rejects. Zapier resumes via the callback URL.
// ---------------------------------------------------------------------------

const { GATEKEEPER_URL } = require("../authentication");

const requestApproval = {
  key: "request_approval",
  noun: "Approval",

  display: {
    label: "Request Approval",
    description:
      "Pause this Zap until a human approves or rejects. The next step runs only after a decision is made.",
  },

  operation: {
    inputFields: [
      {
        key: "title",
        label: "What needs approval?",
        type: "string",
        required: true,
        helpText:
          "A short description of what you want approved (e.g. 'Send invoice #1234 to client'). Use the + button to insert dynamic data from previous steps.",
      },
      {
        key: "priority",
        label: "Priority",
        type: "string",
        required: false,
        choices: {
          low: "Low",
          medium: "Medium",
          high: "High",
          critical: "Critical",
        },
        default: "medium",
        helpText: "How urgent is this approval?",
      },
      {
        key: "description",
        label: "Details",
        type: "text",
        required: false,
        helpText:
          "Additional context for the reviewer (optional). Use the + button to insert dynamic data from previous steps.",
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
        key: "metadata",
        label: "Metadata (JSON)",
        type: "string",
        required: false,
        helpText:
          'Optional JSON data to attach (e.g. {"order_id": "123"}).',
      },
      {
        key: "expires_at",
        label: "Expires At",
        type: "datetime",
        required: false,
        helpText:
          "When this request auto-expires if not decided. Leave empty for no expiration.",
      },
    ],

    // -- Step 1: Create the approval and give Gatekeeper the callback URL ---
    perform: async (z, bundle) => {
      const callbackUrl = z.generateCallbackUrl();

      // Auto-generate idempotency key to prevent duplicates
      const idempotencyKey = `zap-${bundle.meta.zap?.id || "unknown"}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const body = {
        title: bundle.inputData.title,
        priority: bundle.inputData.priority || "medium",
        callback_url: callbackUrl,
        idempotency_key: idempotencyKey,
      };

      if (bundle.inputData.description) {
        body.description = bundle.inputData.description;
      }
      if (bundle.inputData.action_type) {
        body.action_type = bundle.inputData.action_type;
      }
      if (bundle.inputData.expires_at) {
        body.expires_at = bundle.inputData.expires_at;
      }
      if (bundle.inputData.assigned_team) {
        body.assigned_team_id = bundle.inputData.assigned_team;
      }

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

      // During Zap setup / testing, return sample data immediately so users
      // can map fields in later steps without waiting for a real decision.
      if (bundle.meta.isLoadingSample) {
        return {
          id: "sample-approval-id",
          title: body.title,
          status: "approved",
          priority: body.priority,
          decision: "approved",
          decided_by: "sample-user-id",
          decided_by_name: "Jane Smith",
          decision_comment: "Looks good!",
          created_at: new Date().toISOString(),
          decided_at: new Date().toISOString(),
        };
      }

      const response = await z.request({
        method: "POST",
        url: `${GATEKEEPER_URL}/api/v1/approvals`,
        body,
      });

      // Return the created approval. Zapier will hold here until the
      // callback URL is POSTed to, then run performResume.
      return response.json;
    },

    // -- Step 2: Resume when Gatekeeper POSTs the decision back ------------
    performResume: async (z, bundle) => {
      // bundle.outputData = what perform() returned (the approval)
      // bundle.cleanedRequest = the POST body from Gatekeeper's callback
      const callback = bundle.cleanedRequest;
      const original = bundle.outputData || {};

      return {
        id: callback.id || original.id,
        title: callback.title || original.title,
        status: callback.status,
        decision: callback.status,
        priority: callback.priority || original.priority,
        decided_by: callback.decided_by || "",
        decision_comment: callback.decision_comment || "",
        metadata: callback.metadata || original.metadata,
        created_at: original.created_at,
        decided_at: callback.decided_at,
      };
    },

    sample: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Deploy v2.3.1 to production",
      status: "approved",
      decision: "approved",
      priority: "high",
      decided_by: "770e8400-e29b-41d4-a716-446655440002",
      decided_by_name: "Jane Smith",
      decision_comment: "Looks good, ship it!",
      metadata: { environment: "production" },
      created_at: "2026-02-21T10:00:00.000Z",
      decided_at: "2026-02-21T10:30:00.000Z",
    },

    outputFields: [
      { key: "id", label: "Approval ID" },
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
      { key: "decision", label: "Decision" },
      { key: "priority", label: "Priority" },
      { key: "decided_by", label: "Decided By (User ID)" },
      { key: "decision_comment", label: "Comment" },
      { key: "created_at", label: "Created At", type: "datetime" },
      { key: "decided_at", label: "Decided At", type: "datetime" },
    ],
  },
};

module.exports = requestApproval;

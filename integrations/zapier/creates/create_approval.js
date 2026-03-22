// ---------------------------------------------------------------------------
// OKRunit Zapier -- Create Approval Request
// ---------------------------------------------------------------------------

const { OKRUNIT_URL } = require("../authentication");

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
        key: "description",
        label: "Description",
        type: "text",
        required: false,
        helpText:
          "Detailed description (max 5000 characters). Use the + button to insert dynamic data from previous steps.",
      },
      {
        key: "metadata",
        label: "Metadata (JSON)",
        type: "string",
        required: false,
        helpText:
          'Optional JSON data to attach (e.g. {"order_id": "123"}). Priority, routing, expiration, and approvers are all configured in your OKRunit dashboard at okrunit.com.',
      },
    ],

    perform: async (z, bundle) => {
      // Auto-generate idempotency key to prevent duplicates
      const idempotencyKey = `zap-${bundle.meta.zap?.id || "unknown"}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const body = {
        title: bundle.inputData.title,
        idempotency_key: idempotencyKey,
        source: "zapier",
        source_id: String(bundle.meta.zap?.id || ""),
      };

      if (bundle.inputData.description) {
        body.description = bundle.inputData.description;
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
        url: `${OKRUNIT_URL}/api/v1/approvals`,
        body,
      });

      return response.json;
    },

    sample: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Deploy v2.3.1 to production",
      description: "Release includes new payment flow",
      status: "pending",
      priority: "medium",
      source: "make",
      decided_by: null,
      decided_by_name: null,
      decided_at: null,
      decision_comment: null,
      requested_by_name: null,
      created_at: "2026-02-21T10:00:00.000Z",
    },

    outputFields: [
      { key: "id", label: "Approval ID" },
      { key: "title", label: "Title" },
      { key: "description", label: "Description" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
      { key: "source", label: "Source" },
      { key: "decided_by", label: "Decided By (User ID)" },
      { key: "decided_by_name", label: "Decided By (Name)" },
      { key: "decision_comment", label: "Comment" },
      { key: "requested_by_name", label: "Requested By" },
      { key: "created_at", label: "Created At", type: "datetime" },
      { key: "decided_at", label: "Decided At", type: "datetime" },
    ],
  },
};

module.exports = createApproval;

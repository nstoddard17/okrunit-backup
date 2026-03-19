// ---------------------------------------------------------------------------
// Gatekeeper Zapier -- Get Approval by ID
// ---------------------------------------------------------------------------

const { GATEKEEPER_URL } = require("../authentication");

const getApproval = {
  key: "get_approval",
  noun: "Approval Request",

  display: {
    label: "Get Approval Request",
    description: "Fetch a single approval request by its ID.",
  },

  operation: {
    inputFields: [
      {
        key: "approval_id",
        label: "Approval ID",
        type: "string",
        required: true,
        helpText: "The UUID of the approval request.",
        dynamic: "new_approval.id.title",
      },
    ],

    perform: async (z, bundle) => {
      const response = await z.request({
        url: `${GATEKEEPER_URL}/api/v1/approvals/${bundle.inputData.approval_id}`,
      });

      return [response.json];
    },

    sample: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Deploy v2.3.1 to production",
      description: "Release includes new payment flow",
      priority: "high",
      status: "pending",
      action_type: "deploy",
      decided_by: null,
      decided_by_name: null,
      decided_at: null,
      decision_comment: null,
      created_at: "2026-02-21T10:00:00.000Z",
      updated_at: "2026-02-21T10:00:00.000Z",
    },

    outputFields: [
      { key: "id", label: "Approval ID" },
      { key: "title", label: "Title" },
      { key: "description", label: "Description" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
      { key: "action_type", label: "Action Type" },
      { key: "decided_by", label: "Decided By (User ID)" },
      { key: "decided_by_name", label: "Decided By (Name)" },
      { key: "decided_at", label: "Decided At", type: "datetime" },
      { key: "decision_comment", label: "Comment" },
      { key: "created_at", label: "Created At", type: "datetime" },
    ],
  },
};

module.exports = getApproval;

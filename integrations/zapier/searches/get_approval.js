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
      decided_at: null,
      decision_comment: null,
      created_at: "2026-02-21T10:00:00.000Z",
      updated_at: "2026-02-21T10:00:00.000Z",
    },
  },
};

module.exports = getApproval;

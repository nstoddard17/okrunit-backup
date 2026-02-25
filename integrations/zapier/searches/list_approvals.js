// ---------------------------------------------------------------------------
// Gatekeeper Zapier -- List/Search Approvals
// ---------------------------------------------------------------------------

const { GATEKEEPER_URL } = require("../authentication");

const listApprovals = {
  key: "list_approvals",
  noun: "Approval Request",

  display: {
    label: "Find Approvals",
    description: "Search for approval requests with filters.",
  },

  operation: {
    inputFields: [
      {
        key: "status",
        label: "Status",
        type: "string",
        required: false,
        choices: {
          pending: "Pending",
          approved: "Approved",
          rejected: "Rejected",
          cancelled: "Cancelled",
          expired: "Expired",
        },
        helpText: "Filter by status. Leave empty for any.",
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
        helpText: "Filter by priority. Leave empty for any.",
      },
      {
        key: "search",
        label: "Search",
        type: "string",
        required: false,
        helpText: "Full-text search on title and description.",
      },
      {
        key: "page_size",
        label: "Max Results",
        type: "integer",
        required: false,
        default: "20",
        helpText: "Number of results to return (1-100).",
      },
    ],

    perform: async (z, bundle) => {
      const params = {};
      if (bundle.inputData.status) params.status = bundle.inputData.status;
      if (bundle.inputData.priority)
        params.priority = bundle.inputData.priority;
      if (bundle.inputData.search) params.search = bundle.inputData.search;
      if (bundle.inputData.page_size)
        params.page_size = bundle.inputData.page_size;

      const response = await z.request({
        url: `${GATEKEEPER_URL}/api/v1/approvals`,
        params,
      });

      return response.json.data || [];
    },

    sample: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Deploy v2.3.1 to production",
      description: "Release includes new payment flow",
      priority: "high",
      status: "pending",
      action_type: "deploy",
      created_at: "2026-02-21T10:00:00.000Z",
      updated_at: "2026-02-21T10:00:00.000Z",
    },
  },
};

module.exports = listApprovals;

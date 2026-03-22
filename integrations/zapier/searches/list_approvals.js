// ---------------------------------------------------------------------------
// OKRunit Zapier -- List/Search Approvals
// ---------------------------------------------------------------------------

const { OKRUNIT_URL } = require("../authentication");

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
          "": "All",
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
          "": "All",
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
        key: "limit",
        label: "Limit",
        type: "integer",
        required: false,
        default: 25,
        helpText: "Maximum number of results.",
      },
    ],

    perform: async (z, bundle) => {
      const params = {};
      if (bundle.inputData.status) params.status = bundle.inputData.status;
      if (bundle.inputData.priority) params.priority = bundle.inputData.priority;
      if (bundle.inputData.search) params.search = bundle.inputData.search;
      if (bundle.inputData.limit) params.limit = bundle.inputData.limit;

      const response = await z.request({
        url: `${OKRUNIT_URL}/api/v1/approvals`,
        params,
      });

      return response.json.data || [];
    },

    sample: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Deploy v2.3.1 to production",
      description: "Release includes new payment flow",
      status: "pending",
      priority: "high",
      action_type: "deploy",
      source: "api",
      required_approvals: 1,
      current_approvals: 0,
      requested_by_name: "Jane Smith",
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
      { key: "source", label: "Source" },
      { key: "required_approvals", label: "Required Approvals", type: "integer" },
      { key: "current_approvals", label: "Current Approvals", type: "integer" },
      { key: "requested_by_name", label: "Requested By" },
      { key: "decided_by", label: "Decided By (User ID)" },
      { key: "decided_by_name", label: "Decided By (Name)" },
      { key: "decided_at", label: "Decided At", type: "datetime" },
      { key: "decision_comment", label: "Comment" },
      { key: "created_at", label: "Created At", type: "datetime" },
      { key: "updated_at", label: "Updated At", type: "datetime" },
    ],
  },
};

module.exports = listApprovals;

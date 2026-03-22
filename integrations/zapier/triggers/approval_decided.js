// ---------------------------------------------------------------------------
// OKRunit Zapier -- Approval Decided Trigger (Polling)
// ---------------------------------------------------------------------------

const { OKRUNIT_URL } = require("../authentication");

const approvalDecided = {
  key: "approval_decided",
  noun: "Approval Decision",

  display: {
    label: "Approval Decided",
    description:
      "Triggers when an approval request is approved or rejected.",
  },

  operation: {
    type: "polling",

    inputFields: [
      {
        key: "status_filter",
        label: "Decision",
        type: "string",
        required: false,
        choices: {
          "approved,rejected": "Approved or Rejected",
          approved: "Approved Only",
          rejected: "Rejected Only",
        },
        helpText: "Only trigger for this decision type. Leave empty for both.",
      },
      {
        key: "priority_filter",
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
        helpText: "Only trigger for approvals with this priority. Leave empty for all.",
      },
    ],

    perform: async (z, bundle) => {
      const statuses =
        bundle.inputData.status_filter
          ? [bundle.inputData.status_filter]
          : ["approved", "rejected"];

      const allResults = [];

      for (const status of statuses) {
        const params = { status, page_size: 50 };
        if (bundle.inputData.priority_filter) {
          params.priority = bundle.inputData.priority_filter;
        }

        const response = await z.request({
          url: `${OKRUNIT_URL}/api/v1/approvals`,
          params,
        });

        const data = response.json.data || [];
        const decided = data.filter((a) => a.decided_at);
        allResults.push(...decided);
      }

      // Sort by decided_at descending -- Zapier deduplicates by `id`
      allResults.sort(
        (a, b) =>
          new Date(b.decided_at).getTime() - new Date(a.decided_at).getTime(),
      );

      return allResults;
    },

    sample: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Deploy v2.3.1 to production",
      description: "Release includes new payment flow",
      status: "approved",
      priority: "high",
      source: "api",
      decided_by: "770e8400-e29b-41d4-a716-446655440002",
      decided_by_name: "Jane Smith",
      decided_at: "2026-02-21T10:30:00.000Z",
      decision_comment: "Looks good, approved!",
      created_at: "2026-02-21T10:00:00.000Z",
      updated_at: "2026-02-21T10:30:00.000Z",
    },

    outputFields: [
      { key: "id", label: "Approval ID" },
      { key: "title", label: "Title" },
      { key: "description", label: "Description" },
      { key: "status", label: "Decision" },
      { key: "priority", label: "Priority" },
      { key: "source", label: "Source" },
      { key: "decided_by", label: "Decided By (User ID)" },
      { key: "decided_by_name", label: "Decided By (Name)" },
      { key: "decided_at", label: "Decided At", type: "datetime" },
      { key: "decision_comment", label: "Comment" },
      { key: "created_at", label: "Created At", type: "datetime" },
      { key: "updated_at", label: "Updated At", type: "datetime" },
    ],
  },
};

module.exports = approvalDecided;

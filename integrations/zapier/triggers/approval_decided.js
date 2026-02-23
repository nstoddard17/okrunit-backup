// ---------------------------------------------------------------------------
// Gatekeeper Zapier -- Approval Decided Trigger (Polling)
// ---------------------------------------------------------------------------

const approvalDecided = {
  key: "approval_decided",
  noun: "Approval Decision",

  display: {
    label: "Approval Decided",
    description:
      "Triggers when an approval request is approved or rejected.",
    important: true,
  },

  operation: {
    type: "polling",

    inputFields: [
      {
        key: "status_filter",
        label: "Decision Type",
        type: "string",
        choices: {
          "": "Any (Approved or Rejected)",
          approved: "Approved Only",
          rejected: "Rejected Only",
        },
        default: "",
        helpText: "Filter to only trigger on specific decision types.",
      },
      {
        key: "priority_filter",
        label: "Priority Filter",
        type: "string",
        choices: {
          "": "Any Priority",
          low: "Low",
          medium: "Medium",
          high: "High",
          critical: "Critical",
        },
        default: "",
        required: false,
      },
    ],

    perform: async (z, bundle) => {
      const statuses = bundle.inputData.status_filter
        ? [bundle.inputData.status_filter]
        : ["approved", "rejected"];

      const allResults = [];

      for (const status of statuses) {
        const params = { status, page_size: 50 };
        if (bundle.inputData.priority_filter) {
          params.priority = bundle.inputData.priority_filter;
        }

        const response = await z.request({
          url: `${bundle.authData.instance_url}/api/v1/approvals`,
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
      status: "approved",
      priority: "high",
      decided_by: "770e8400-e29b-41d4-a716-446655440002",
      decided_at: "2026-02-21T10:30:00.000Z",
      decision_comment: "Looks good, approved!",
      metadata: { environment: "production" },
      created_at: "2026-02-21T10:00:00.000Z",
      updated_at: "2026-02-21T10:30:00.000Z",
    },
  },
};

module.exports = approvalDecided;

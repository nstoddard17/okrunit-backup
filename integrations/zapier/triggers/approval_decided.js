// ---------------------------------------------------------------------------
// Gatekeeper Zapier -- Approval Decided Trigger (Polling)
// ---------------------------------------------------------------------------

const { GATEKEEPER_URL } = require("../authentication");

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

    inputFields: [],

    perform: async (z, bundle) => {
      const allResults = [];

      for (const status of ["approved", "rejected"]) {
        const response = await z.request({
          url: `${GATEKEEPER_URL}/api/v1/approvals`,
          params: { status, page_size: 50 },
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

// ---------------------------------------------------------------------------
// OKRunit Zapier -- Add Comment to Approval
// ---------------------------------------------------------------------------

const { OKRUNIT_URL } = require("../authentication");

const addComment = {
  key: "add_comment",
  noun: "Comment",

  display: {
    label: "Add Comment",
    description: "Add a comment to an existing approval request.",
  },

  operation: {
    inputFields: [
      {
        key: "approval_id",
        label: "Approval ID",
        type: "string",
        required: true,
        helpText: "The UUID of the approval request to comment on.",
        dynamic: "new_approval.id.title",
      },
      {
        key: "body",
        label: "Comment",
        type: "text",
        required: true,
        helpText: "The comment text (max 5000 characters).",
      },
    ],

    perform: async (z, bundle) => {
      const response = await z.request({
        method: "POST",
        url: `${OKRUNIT_URL}/api/v1/approvals/${bundle.inputData.approval_id}/comments`,
        body: { body: bundle.inputData.body },
      });

      return response.json;
    },

    sample: {
      id: "660e8400-e29b-41d4-a716-446655440001",
      request_id: "550e8400-e29b-41d4-a716-446655440000",
      body: "Looks good, proceeding with approval.",
      created_at: "2026-02-21T10:05:00.000Z",
      updated_at: "2026-02-21T10:05:00.000Z",
    },
  },
};

module.exports = addComment;

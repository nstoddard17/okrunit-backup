// ---------------------------------------------------------------------------
// Gatekeeper Zapier Integration -- App Definition
// ---------------------------------------------------------------------------

const {
  authentication,
  addAuthHeader,
  handleErrors,
} = require("./authentication");
const requestApproval = require("./creates/request_approval");
const createApproval = require("./creates/create_approval");
const addComment = require("./creates/add_comment");
const getApproval = require("./searches/get_approval");
const listApprovals = require("./searches/list_approvals");
const approvalDecided = require("./triggers/approval_decided");

module.exports = {
  version: require("./package.json").version,
  platformVersion: require("zapier-platform-core").version,

  authentication,

  beforeRequest: [addAuthHeader],
  afterResponse: [handleErrors],

  triggers: {
    [approvalDecided.key]: approvalDecided,
  },

  creates: {
    [requestApproval.key]: requestApproval,
    [createApproval.key]: createApproval,
    [addComment.key]: addComment,
  },

  searches: {
    [getApproval.key]: getApproval,
    [listApprovals.key]: listApprovals,
  },
};

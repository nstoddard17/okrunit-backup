import { defineApp } from "@pipedream/types";
import { axios } from "@pipedream/platform";

export default defineApp({
  type: "app",
  app: "okrunit",
  propDefinitions: {
    approvalId: {
      type: "string",
      label: "Approval ID",
      description: "The UUID of the approval request",
    },
    title: {
      type: "string",
      label: "Title",
      description:
        "Short title for the approval request (max 500 chars). Defaults to 'Approval request from pipedream' if blank.",
      optional: true,
    },
    description: {
      type: "string",
      label: "Description",
      description: "Detailed description for the reviewer",
      optional: true,
    },
    priority: {
      type: "string",
      label: "Priority",
      description: "Urgency level",
      options: [
        { label: "All", value: "" },
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" },
        { label: "Critical", value: "critical" },
      ],
      default: "medium",
    },
    status: {
      type: "string",
      label: "Status",
      description: "Filter by status",
      options: [
        { label: "All", value: "" },
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Expired", value: "expired" },
      ],
      optional: true,
    },
  },
  methods: {
    _baseUrl(): string {
      return `${this.$auth.api_url}/api/v1`;
    },
    _headers(): Record<string, string> {
      return {
        Authorization: `Bearer ${this.$auth.api_key}`,
        "Content-Type": "application/json",
      };
    },
    async _makeRequest(opts: {
      method?: string;
      path: string;
      data?: Record<string, unknown>;
      params?: Record<string, string>;
      $?: object;
    }) {
      const { method = "GET", path, data, params, $ } = opts;
      return axios($ ?? this, {
        method,
        url: `${this._baseUrl()}${path}`,
        headers: this._headers(),
        data,
        params,
      });
    },
    async createApproval(args: {
      data: Record<string, unknown>;
      $?: object;
    }) {
      return this._makeRequest({
        method: "POST",
        path: "/approvals",
        ...args,
      });
    },
    async getApproval(approvalId: string, $?: object) {
      return this._makeRequest({ path: `/approvals/${approvalId}`, $ });
    },
    async listApprovals(params: Record<string, string>, $?: object) {
      return this._makeRequest({ path: "/approvals", params, $ });
    },
    async addComment(
      approvalId: string,
      body: string,
      $?: object,
    ) {
      return this._makeRequest({
        method: "POST",
        path: `/approvals/${approvalId}/comments`,
        data: { body },
        $,
      });
    },
  },
});

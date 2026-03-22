import { defineAction } from "@pipedream/types";
import okrunit from "../../components/okrunit.app.mts";

export default defineAction({
  name: "List Approvals",
  description:
    "Search and list approval requests with filters. [See the docs](https://docs.okrunit.com)",
  key: "okrunit-list-approvals",
  version: "0.0.1",
  type: "action",
  props: {
    okrunit,
    status: { propDefinition: [okrunit, "status"] },
    priority: {
      propDefinition: [okrunit, "priority"],
      optional: true,
    },
    search: {
      type: "string",
      label: "Search",
      description: "Full-text search on title and description",
      optional: true,
    },
    limit: {
      type: "integer",
      label: "Limit",
      description: "Maximum number of results (default 25)",
      optional: true,
      default: 25,
    },
  },
  async run({ $ }) {
    const params: Record<string, string> = {};
    if (this.status) params.status = this.status;
    if (this.priority) params.priority = this.priority;
    if (this.search) params.search = this.search;
    if (this.limit) params.page_size = String(this.limit);

    const result = await this.okrunit.listApprovals(params, $);
    const count = result.data?.length ?? 0;
    $.export("$summary", `Found ${count} approval(s)`);
    return result;
  },
});

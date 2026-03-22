import { defineSource } from "@pipedream/types";
import okrunit from "../../components/okrunit.app.mts";

export default defineSource({
  name: "New Approval Request",
  description:
    "Emit an event when a new approval request is created in OKRunit. [See the docs](https://docs.okrunit.com)",
  key: "okrunit-new-approval",
  version: "0.0.1",
  type: "source",
  dedupe: "unique",
  props: {
    okrunit,
    timer: {
      type: "$.interface.timer",
      default: { intervalSeconds: 60 },
    },
    status: {
      propDefinition: [okrunit, "status"],
      description: "Only emit events for approvals with this status",
    },
    priority: {
      propDefinition: [okrunit, "priority"],
      optional: true,
      description: "Only emit events for approvals with this priority",
    },
  },
  methods: {
    generateMeta(approval: {
      id: string;
      title: string;
      created_at: string;
    }) {
      return {
        id: approval.id,
        summary: `New Approval: ${approval.title}`,
        ts: new Date(approval.created_at).getTime(),
      };
    },
  },
  async run() {
    const params: Record<string, string> = { page_size: "50" };
    if (this.status) params.status = this.status;
    if (this.priority) params.priority = this.priority;

    const result = await this.okrunit.listApprovals(params);
    const approvals = result.data ?? [];

    // Emit in reverse chronological order (oldest first for dedup)
    for (const approval of approvals.reverse()) {
      this.$emit(approval, this.generateMeta(approval));
    }
  },
});

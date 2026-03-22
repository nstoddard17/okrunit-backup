import { defineSource } from "@pipedream/types";
import okrunit from "../../components/okrunit.app.mts";

export default defineSource({
  name: "Approval Decided",
  description:
    "Emit an event when an approval is approved or rejected in OKRunit. [See the docs](https://docs.okrunit.com)",
  key: "okrunit-approval-decided",
  version: "0.0.1",
  type: "source",
  dedupe: "unique",
  props: {
    okrunit,
    timer: {
      type: "$.interface.timer",
      default: { intervalSeconds: 60 },
    },
    decision: {
      type: "string",
      label: "Decision Type",
      description: "Filter by decision type",
      options: [
        { label: "Approved or Rejected", value: "any" },
        { label: "Approved Only", value: "approved" },
        { label: "Rejected Only", value: "rejected" },
      ],
      default: "any",
      optional: true,
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
      status: string;
      decided_at: string;
    }) {
      return {
        id: approval.id,
        summary: `${approval.status === "approved" ? "Approved" : "Rejected"}: ${approval.title}`,
        ts: new Date(approval.decided_at).getTime(),
      };
    },
  },
  async run() {
    const statuses =
      !this.decision || this.decision === "any"
        ? ["approved", "rejected"]
        : [this.decision];

    for (const status of statuses) {
      const params: Record<string, string> = { status, page_size: "50" };
      if (this.priority) params.priority = this.priority;

      const result = await this.okrunit.listApprovals(params);
      const approvals = result.data ?? [];

      for (const approval of approvals.reverse()) {
        if (approval.decided_at) {
          this.$emit(approval, this.generateMeta(approval));
        }
      }
    }
  },
});

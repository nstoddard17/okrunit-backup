import { defineAction } from "@pipedream/types";
import okrunit from "../../components/okrunit.app.mts";

export default defineAction({
  name: "Create Approval",
  description:
    "Create a new approval request in OKRunit and optionally wait for a decision via callback webhook. [See the docs](https://docs.okrunit.com)",
  key: "okrunit-create-approval",
  version: "0.0.1",
  type: "action",
  props: {
    okrunit,
    title: { propDefinition: [okrunit, "title"] },
    description: { propDefinition: [okrunit, "description"] },
    priority: { propDefinition: [okrunit, "priority"] },
    callbackUrl: {
      type: "string",
      label: "Callback URL",
      description: "Webhook URL to receive the decision",
      optional: true,
    },
    metadata: {
      type: "string",
      label: "Metadata (JSON)",
      description: "Optional JSON data to attach to the approval",
      optional: true,
    },
  },
  async run({ $ }) {
    const idempotencyKey = `pipedream-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const body: Record<string, unknown> = {
      title: this.title || "Approval request from pipedream",
      priority: this.priority || "medium",
      source: "pipedream",
      idempotency_key: idempotencyKey,
    };

    if (this.description) body.description = this.description;
    if (this.callbackUrl) body.callback_url = this.callbackUrl;

    if (this.metadata) {
      try {
        body.metadata = JSON.parse(this.metadata);
      } catch {
        throw new Error("Metadata must be valid JSON");
      }
    }

    const result = await this.okrunit.createApproval({ data: body, $ });

    $.export("$summary", `Created approval "${result.title}" (${result.id})`);
    return result;
  },
});

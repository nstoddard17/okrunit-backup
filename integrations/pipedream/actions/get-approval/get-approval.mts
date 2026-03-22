import { defineAction } from "@pipedream/types";
import okrunit from "../../components/okrunit.app.mts";

export default defineAction({
  name: "Get Approval",
  description:
    "Fetch a single approval request by its ID. [See the docs](https://docs.okrunit.com)",
  key: "okrunit-get-approval",
  version: "0.0.1",
  type: "action",
  props: {
    okrunit,
    approvalId: { propDefinition: [okrunit, "approvalId"] },
  },
  async run({ $ }) {
    const result = await this.okrunit.getApproval(this.approvalId, $);
    $.export("$summary", `Fetched approval "${result.title}" (${result.status})`);
    return result;
  },
});

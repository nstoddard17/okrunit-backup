import { defineAction } from "@pipedream/types";
import okrunit from "../../components/okrunit.app.mts";

export default defineAction({
  name: "Add Comment",
  description:
    "Add a comment to an approval request. [See the docs](https://docs.okrunit.com)",
  key: "okrunit-add-comment",
  version: "0.0.1",
  type: "action",
  props: {
    okrunit,
    approvalId: { propDefinition: [okrunit, "approvalId"] },
    comment: {
      type: "string",
      label: "Comment",
      description: "The comment text to add (max 5000 chars)",
    },
  },
  async run({ $ }) {
    const result = await this.okrunit.addComment(
      this.approvalId,
      this.comment,
      $,
    );
    $.export("$summary", `Added comment to approval ${this.approvalId}`);
    return result;
  },
});

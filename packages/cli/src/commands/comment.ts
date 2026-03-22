// ---------------------------------------------------------------------------
// OKRunit CLI -- `okrunit comment` command
// ---------------------------------------------------------------------------

import { Command } from "commander";
import { OKRunitClient, OKRunitError } from "@okrunit/sdk";
import { requireConfig } from "../config";
import { formatJson } from "../output";

export function makeCommentCommand(): Command {
  return new Command("comment")
    .description("Add a comment to an approval")
    .argument("<id>", "Approval request ID")
    .argument("<body>", "Comment text")
    .option("--json", "Output raw JSON", false)
    .action(async (id: string, body: string, opts: Record<string, unknown>) => {
      const config = requireConfig();
      const client = new OKRunitClient({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
      });

      try {
        const comment = await client.addComment(id, body);

        if (opts.json) {
          console.log(formatJson(comment));
        } else {
          console.log(`Comment added (${comment.id})`);
        }
      } catch (err) {
        if (err instanceof OKRunitError) {
          console.error(`Error: ${err.message} (${err.code})`);
          process.exit(1);
        }
        throw err;
      }
    });
}

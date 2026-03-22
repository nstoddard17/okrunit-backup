// ---------------------------------------------------------------------------
// OKRunit CLI -- `okrunit reject` command
// ---------------------------------------------------------------------------

import { Command } from "commander";
import { OKRunitClient, OKRunitError } from "@okrunit/sdk";
import { requireConfig } from "../config";
import { formatApprovalDetail, formatJson } from "../output";

export function makeRejectCommand(): Command {
  return new Command("reject")
    .description("Reject a pending request")
    .argument("<id>", "Approval request ID")
    .option("-c, --comment <text>", "Rejection reason / comment")
    .option("--json", "Output raw JSON", false)
    .action(async (id: string, opts: Record<string, unknown>) => {
      const config = requireConfig();
      const client = new OKRunitClient({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
      });

      try {
        const approval = await client.respondToApproval(id, {
          decision: "reject",
          comment: opts.comment ? String(opts.comment) : undefined,
          source: "api",
        });

        if (opts.json) {
          console.log(formatJson(approval));
        } else {
          console.log(`Rejected: ${approval.id}`);
          console.log(formatApprovalDetail(approval));
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

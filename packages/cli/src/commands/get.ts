// ---------------------------------------------------------------------------
// OKRunit CLI -- `okrunit get` command
// ---------------------------------------------------------------------------

import { Command } from "commander";
import { OKRunitClient, OKRunitError } from "@okrunit/sdk";
import { requireConfig } from "../config";
import { formatApprovalDetail, formatJson } from "../output";

export function makeGetCommand(): Command {
  return new Command("get")
    .description("Get approval details")
    .argument("<id>", "Approval request ID")
    .option("--json", "Output raw JSON", false)
    .action(async (id: string, opts: Record<string, unknown>) => {
      const config = requireConfig();
      const client = new OKRunitClient({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
      });

      try {
        const approval = await client.getApproval(id);

        if (opts.json) {
          console.log(formatJson(approval));
        } else {
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

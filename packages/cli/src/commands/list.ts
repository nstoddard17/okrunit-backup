// ---------------------------------------------------------------------------
// OKRunit CLI -- `okrunit list` command
// ---------------------------------------------------------------------------

import { Command } from "commander";
import { OKRunitClient, OKRunitError } from "@okrunit/sdk";
import type { ApprovalStatus, ApprovalPriority } from "@okrunit/sdk";
import { requireConfig } from "../config";
import { formatApprovalTable, formatJson } from "../output";

export function makeListCommand(): Command {
  return new Command("list")
    .description("List approval requests")
    .option(
      "-s, --status <status>",
      "Filter by status: pending, approved, rejected, cancelled, expired",
    )
    .option(
      "-p, --priority <level>",
      "Filter by priority: low, medium, high, critical",
    )
    .option("-q, --search <text>", "Full-text search")
    .option("-l, --limit <n>", "Number of results per page", "20")
    .option("--page <n>", "Page number", "1")
    .option("--json", "Output raw JSON", false)
    .action(async (opts: Record<string, unknown>) => {
      const config = requireConfig();
      const client = new OKRunitClient({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
      });

      try {
        const result = await client.listApprovals({
          status: opts.status ? (String(opts.status) as ApprovalStatus) : undefined,
          priority: opts.priority ? (String(opts.priority) as ApprovalPriority) : undefined,
          search: opts.search ? String(opts.search) : undefined,
          page_size: Number(opts.limit),
          page: Number(opts.page),
        });

        if (opts.json) {
          console.log(formatJson(result));
        } else {
          console.log(formatApprovalTable(result.data));
          console.log(`\nShowing ${result.data.length} of ${result.total} total`);
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

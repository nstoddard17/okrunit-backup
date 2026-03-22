// ---------------------------------------------------------------------------
// OKRunit CLI -- `okrunit wait` command
// ---------------------------------------------------------------------------

import { Command } from "commander";
import { OKRunitClient, OKRunitError } from "@okrunit/sdk";
import { requireConfig } from "../config";
import { formatApprovalDetail, formatJson } from "../output";

export function makeWaitCommand(): Command {
  return new Command("wait")
    .description("Wait for a decision on an approval")
    .argument("<id>", "Approval request ID")
    .option(
      "-t, --timeout <seconds>",
      "Maximum time to wait in seconds",
      "3600",
    )
    .option(
      "--poll-interval <seconds>",
      "Polling interval in seconds",
      "10",
    )
    .option("--json", "Output raw JSON", false)
    .action(async (id: string, opts: Record<string, unknown>) => {
      const config = requireConfig();
      const client = new OKRunitClient({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
      });

      const timeoutMs = Number(opts.timeout) * 1000;
      const pollIntervalMs = Number(opts.pollInterval) * 1000;
      const startTime = Date.now();

      process.stdout.write(`Waiting for decision on ${id.slice(0, 8)}...`);

      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        process.stdout.write(`\rWaiting for decision on ${id.slice(0, 8)}... ${elapsed}s`);
      }, 1000);

      try {
        const approval = await client.waitForDecision(id, {
          timeoutMs,
          pollIntervalMs,
        });

        clearInterval(interval);
        process.stdout.write("\n");

        if (opts.json) {
          console.log(formatJson(approval));
        } else {
          console.log(formatApprovalDetail(approval));
        }

        // Exit codes: 0 = approved, 1 = rejected, 2 = other
        if (approval.status === "approved") process.exit(0);
        if (approval.status === "rejected") process.exit(1);
        process.exit(2);
      } catch (err) {
        clearInterval(interval);
        process.stdout.write("\n");

        if (err instanceof OKRunitError && err.code === "TIMEOUT") {
          console.error("Timed out waiting for a decision.");
          process.exit(2);
        }
        if (err instanceof OKRunitError) {
          console.error(`Error: ${err.message} (${err.code})`);
          process.exit(1);
        }
        throw err;
      }
    });
}

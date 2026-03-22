// ---------------------------------------------------------------------------
// OKRunit CLI -- `okrunit request` command
// ---------------------------------------------------------------------------

import { Command } from "commander";
import { OKRunitClient, OKRunitError } from "@okrunit/sdk";
import type { CreateApprovalInput, ApprovalPriority } from "@okrunit/sdk";
import { requireConfig } from "../config";
import { formatApprovalDetail, formatJson } from "../output";

export function makeRequestCommand(): Command {
  return new Command("request")
    .description("Create an approval request")
    .argument("<title>", "Title for the approval request")
    .option("-d, --description <text>", "Description of the action")
    .option(
      "-p, --priority <level>",
      "Priority: low, medium, high, critical",
      "medium",
    )
    .option("-s, --source <name>", "Source identifier (e.g., deploy-bot)")
    .option("-m, --metadata <json>", "JSON metadata object")
    .option(
      "--callback-url <url>",
      "Webhook URL to call when a decision is made",
    )
    .option(
      "--idempotency-key <key>",
      "Idempotency key for deduplication",
    )
    .option(
      "-w, --wait",
      "Block until a decision is made",
      false,
    )
    .option(
      "--timeout <seconds>",
      "Timeout in seconds when using --wait",
      "3600",
    )
    .option("--json", "Output raw JSON", false)
    .action(async (title: string, opts: Record<string, unknown>) => {
      const config = requireConfig();
      const client = new OKRunitClient({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
      });

      const input: CreateApprovalInput = { title };

      if (opts.description) input.description = String(opts.description);
      if (opts.priority) input.priority = String(opts.priority) as ApprovalPriority;
      if (opts.source) input.source = String(opts.source);
      if (opts.callbackUrl) input.callback_url = String(opts.callbackUrl);
      if (opts.idempotencyKey) input.idempotency_key = String(opts.idempotencyKey);

      if (opts.metadata) {
        try {
          input.metadata = JSON.parse(String(opts.metadata));
        } catch {
          console.error("Error: --metadata must be valid JSON");
          process.exit(1);
        }
      }

      try {
        let approval = await client.createApproval(input);

        if (opts.wait) {
          const timeoutMs = Number(opts.timeout) * 1000;
          process.stdout.write(
            `Waiting for decision on ${approval.id.slice(0, 8)}...`,
          );

          const interval = setInterval(() => {
            process.stdout.write(".");
          }, 5000);

          try {
            approval = await client.waitForDecision(approval.id, {
              timeoutMs,
              pollIntervalMs: 10_000,
            });
          } finally {
            clearInterval(interval);
            process.stdout.write("\n");
          }
        }

        if (opts.json) {
          console.log(formatJson(approval));
        } else {
          console.log(formatApprovalDetail(approval));
        }

        // Exit codes based on decision
        if (opts.wait) {
          if (approval.status === "approved") process.exit(0);
          if (approval.status === "rejected") process.exit(1);
          process.exit(2); // timeout, expired, cancelled
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

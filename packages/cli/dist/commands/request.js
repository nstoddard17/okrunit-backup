"use strict";
// ---------------------------------------------------------------------------
// OKRunit CLI -- `okrunit request` command
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRequestCommand = makeRequestCommand;
const commander_1 = require("commander");
const sdk_1 = require("@okrunit/sdk");
const config_1 = require("../config");
const output_1 = require("../output");
function makeRequestCommand() {
    return new commander_1.Command("request")
        .description("Create an approval request")
        .argument("<title>", "Title for the approval request")
        .option("-d, --description <text>", "Description of the action")
        .option("-p, --priority <level>", "Priority: low, medium, high, critical", "medium")
        .option("-s, --source <name>", "Source identifier (e.g., deploy-bot)")
        .option("-m, --metadata <json>", "JSON metadata object")
        .option("--callback-url <url>", "Webhook URL to call when a decision is made")
        .option("--idempotency-key <key>", "Idempotency key for deduplication")
        .option("-w, --wait", "Block until a decision is made", false)
        .option("--timeout <seconds>", "Timeout in seconds when using --wait", "3600")
        .option("--json", "Output raw JSON", false)
        .action(async (title, opts) => {
        const config = (0, config_1.requireConfig)();
        const client = new sdk_1.OKRunitClient({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
        });
        const input = { title };
        if (opts.description)
            input.description = String(opts.description);
        if (opts.priority)
            input.priority = String(opts.priority);
        if (opts.source)
            input.source = String(opts.source);
        if (opts.callbackUrl)
            input.callback_url = String(opts.callbackUrl);
        if (opts.idempotencyKey)
            input.idempotency_key = String(opts.idempotencyKey);
        if (opts.metadata) {
            try {
                input.metadata = JSON.parse(String(opts.metadata));
            }
            catch {
                console.error("Error: --metadata must be valid JSON");
                process.exit(1);
            }
        }
        try {
            let approval = await client.createApproval(input);
            if (opts.wait) {
                const timeoutMs = Number(opts.timeout) * 1000;
                process.stdout.write(`Waiting for decision on ${approval.id.slice(0, 8)}...`);
                const interval = setInterval(() => {
                    process.stdout.write(".");
                }, 5000);
                try {
                    approval = await client.waitForDecision(approval.id, {
                        timeoutMs,
                        pollIntervalMs: 10000,
                    });
                }
                finally {
                    clearInterval(interval);
                    process.stdout.write("\n");
                }
            }
            if (opts.json) {
                console.log((0, output_1.formatJson)(approval));
            }
            else {
                console.log((0, output_1.formatApprovalDetail)(approval));
            }
            // Exit codes based on decision
            if (opts.wait) {
                if (approval.status === "approved")
                    process.exit(0);
                if (approval.status === "rejected")
                    process.exit(1);
                process.exit(2); // timeout, expired, cancelled
            }
        }
        catch (err) {
            if (err instanceof sdk_1.OKRunitError) {
                console.error(`Error: ${err.message} (${err.code})`);
                process.exit(1);
            }
            throw err;
        }
    });
}
//# sourceMappingURL=request.js.map
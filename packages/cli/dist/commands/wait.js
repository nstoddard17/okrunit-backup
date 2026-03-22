"use strict";
// ---------------------------------------------------------------------------
// OKRunit CLI -- `okrunit wait` command
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeWaitCommand = makeWaitCommand;
const commander_1 = require("commander");
const sdk_1 = require("@okrunit/sdk");
const config_1 = require("../config");
const output_1 = require("../output");
function makeWaitCommand() {
    return new commander_1.Command("wait")
        .description("Wait for a decision on an approval")
        .argument("<id>", "Approval request ID")
        .option("-t, --timeout <seconds>", "Maximum time to wait in seconds", "3600")
        .option("--poll-interval <seconds>", "Polling interval in seconds", "10")
        .option("--json", "Output raw JSON", false)
        .action(async (id, opts) => {
        const config = (0, config_1.requireConfig)();
        const client = new sdk_1.OKRunitClient({
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
                console.log((0, output_1.formatJson)(approval));
            }
            else {
                console.log((0, output_1.formatApprovalDetail)(approval));
            }
            // Exit codes: 0 = approved, 1 = rejected, 2 = other
            if (approval.status === "approved")
                process.exit(0);
            if (approval.status === "rejected")
                process.exit(1);
            process.exit(2);
        }
        catch (err) {
            clearInterval(interval);
            process.stdout.write("\n");
            if (err instanceof sdk_1.OKRunitError && err.code === "TIMEOUT") {
                console.error("Timed out waiting for a decision.");
                process.exit(2);
            }
            if (err instanceof sdk_1.OKRunitError) {
                console.error(`Error: ${err.message} (${err.code})`);
                process.exit(1);
            }
            throw err;
        }
    });
}
//# sourceMappingURL=wait.js.map
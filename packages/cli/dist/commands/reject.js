"use strict";
// ---------------------------------------------------------------------------
// OKRunit CLI -- `okrunit reject` command
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRejectCommand = makeRejectCommand;
const commander_1 = require("commander");
const sdk_1 = require("@okrunit/sdk");
const config_1 = require("../config");
const output_1 = require("../output");
function makeRejectCommand() {
    return new commander_1.Command("reject")
        .description("Reject a pending request")
        .argument("<id>", "Approval request ID")
        .option("-c, --comment <text>", "Rejection reason / comment")
        .option("--json", "Output raw JSON", false)
        .action(async (id, opts) => {
        const config = (0, config_1.requireConfig)();
        const client = new sdk_1.OKRunitClient({
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
                console.log((0, output_1.formatJson)(approval));
            }
            else {
                console.log(`Rejected: ${approval.id}`);
                console.log((0, output_1.formatApprovalDetail)(approval));
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
//# sourceMappingURL=reject.js.map
"use strict";
// ---------------------------------------------------------------------------
// OKRunit CLI -- `okrunit get` command
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGetCommand = makeGetCommand;
const commander_1 = require("commander");
const sdk_1 = require("@okrunit/sdk");
const config_1 = require("../config");
const output_1 = require("../output");
function makeGetCommand() {
    return new commander_1.Command("get")
        .description("Get approval details")
        .argument("<id>", "Approval request ID")
        .option("--json", "Output raw JSON", false)
        .action(async (id, opts) => {
        const config = (0, config_1.requireConfig)();
        const client = new sdk_1.OKRunitClient({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
        });
        try {
            const approval = await client.getApproval(id);
            if (opts.json) {
                console.log((0, output_1.formatJson)(approval));
            }
            else {
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
//# sourceMappingURL=get.js.map
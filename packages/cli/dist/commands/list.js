"use strict";
// ---------------------------------------------------------------------------
// OKRunit CLI -- `okrunit list` command
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeListCommand = makeListCommand;
const commander_1 = require("commander");
const sdk_1 = require("@okrunit/sdk");
const config_1 = require("../config");
const output_1 = require("../output");
function makeListCommand() {
    return new commander_1.Command("list")
        .description("List approval requests")
        .option("-s, --status <status>", "Filter by status: pending, approved, rejected, cancelled, expired")
        .option("-p, --priority <level>", "Filter by priority: low, medium, high, critical")
        .option("-q, --search <text>", "Full-text search")
        .option("-l, --limit <n>", "Number of results per page", "20")
        .option("--page <n>", "Page number", "1")
        .option("--json", "Output raw JSON", false)
        .action(async (opts) => {
        const config = (0, config_1.requireConfig)();
        const client = new sdk_1.OKRunitClient({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
        });
        try {
            const result = await client.listApprovals({
                status: opts.status ? String(opts.status) : undefined,
                priority: opts.priority ? String(opts.priority) : undefined,
                search: opts.search ? String(opts.search) : undefined,
                page_size: Number(opts.limit),
                page: Number(opts.page),
            });
            if (opts.json) {
                console.log((0, output_1.formatJson)(result));
            }
            else {
                console.log((0, output_1.formatApprovalTable)(result.data));
                console.log(`\nShowing ${result.data.length} of ${result.total} total`);
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
//# sourceMappingURL=list.js.map
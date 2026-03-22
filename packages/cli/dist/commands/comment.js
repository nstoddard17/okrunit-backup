"use strict";
// ---------------------------------------------------------------------------
// OKRunit CLI -- `okrunit comment` command
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCommentCommand = makeCommentCommand;
const commander_1 = require("commander");
const sdk_1 = require("@okrunit/sdk");
const config_1 = require("../config");
const output_1 = require("../output");
function makeCommentCommand() {
    return new commander_1.Command("comment")
        .description("Add a comment to an approval")
        .argument("<id>", "Approval request ID")
        .argument("<body>", "Comment text")
        .option("--json", "Output raw JSON", false)
        .action(async (id, body, opts) => {
        const config = (0, config_1.requireConfig)();
        const client = new sdk_1.OKRunitClient({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
        });
        try {
            const comment = await client.addComment(id, body);
            if (opts.json) {
                console.log((0, output_1.formatJson)(comment));
            }
            else {
                console.log(`Comment added (${comment.id})`);
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
//# sourceMappingURL=comment.js.map
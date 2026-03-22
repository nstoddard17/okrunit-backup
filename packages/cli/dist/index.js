#!/usr/bin/env node
"use strict";
// ---------------------------------------------------------------------------
// OKRunit CLI -- Entry point
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const request_1 = require("./commands/request");
const list_1 = require("./commands/list");
const get_1 = require("./commands/get");
const approve_1 = require("./commands/approve");
const reject_1 = require("./commands/reject");
const wait_1 = require("./commands/wait");
const comment_1 = require("./commands/comment");
const config_1 = require("./commands/config");
const program = new commander_1.Command();
program
    .name("okrunit")
    .description("OKRunit CLI -- Human-in-the-loop approval gateway")
    .version("0.1.0");
program.addCommand((0, request_1.makeRequestCommand)());
program.addCommand((0, list_1.makeListCommand)());
program.addCommand((0, get_1.makeGetCommand)());
program.addCommand((0, approve_1.makeApproveCommand)());
program.addCommand((0, reject_1.makeRejectCommand)());
program.addCommand((0, wait_1.makeWaitCommand)());
program.addCommand((0, comment_1.makeCommentCommand)());
program.addCommand((0, config_1.makeConfigCommand)());
program.parse();
//# sourceMappingURL=index.js.map
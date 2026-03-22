#!/usr/bin/env node
// ---------------------------------------------------------------------------
// OKRunit CLI -- Entry point
// ---------------------------------------------------------------------------

import { Command } from "commander";
import { makeRequestCommand } from "./commands/request";
import { makeListCommand } from "./commands/list";
import { makeGetCommand } from "./commands/get";
import { makeApproveCommand } from "./commands/approve";
import { makeRejectCommand } from "./commands/reject";
import { makeWaitCommand } from "./commands/wait";
import { makeCommentCommand } from "./commands/comment";
import { makeConfigCommand } from "./commands/config";

const program = new Command();

program
  .name("okrunit")
  .description("OKRunit CLI -- Human-in-the-loop approval gateway")
  .version("0.1.0");

program.addCommand(makeRequestCommand());
program.addCommand(makeListCommand());
program.addCommand(makeGetCommand());
program.addCommand(makeApproveCommand());
program.addCommand(makeRejectCommand());
program.addCommand(makeWaitCommand());
program.addCommand(makeCommentCommand());
program.addCommand(makeConfigCommand());

program.parse();

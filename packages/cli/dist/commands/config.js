"use strict";
// ---------------------------------------------------------------------------
// OKRunit CLI -- `okrunit config` command
// ---------------------------------------------------------------------------
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeConfigCommand = makeConfigCommand;
const commander_1 = require("commander");
const readline = __importStar(require("readline"));
const config_1 = require("../config");
function prompt(question, defaultValue) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const suffix = defaultValue ? ` (${defaultValue})` : "";
    return new Promise((resolve) => {
        rl.question(`${question}${suffix}: `, (answer) => {
            rl.close();
            resolve(answer.trim() || defaultValue || "");
        });
    });
}
function makeConfigCommand() {
    return new commander_1.Command("config")
        .description("Configure API key and base URL")
        .option("--show", "Show current configuration", false)
        .action(async (opts) => {
        const current = (0, config_1.loadConfig)();
        if (opts.show) {
            const maskedKey = current.apiKey
                ? current.apiKey.slice(0, 6) + "..." + current.apiKey.slice(-4)
                : "(not set)";
            console.log(`API Key:  ${maskedKey}`);
            console.log(`Base URL: ${current.baseUrl}`);
            return;
        }
        console.log("OKRunit CLI Configuration\n");
        const apiKey = await prompt("API Key", current.apiKey || undefined);
        const baseUrl = await prompt("Base URL", current.baseUrl);
        (0, config_1.writeConfigFile)({ apiKey, baseUrl });
        console.log("\nConfiguration saved to ~/.okrunitrc");
    });
}
//# sourceMappingURL=config.js.map
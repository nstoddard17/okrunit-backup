"use strict";
// ---------------------------------------------------------------------------
// OKRunit CLI -- Configuration loading
// Priority: environment variables > config file > defaults
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
exports.writeConfigFile = writeConfigFile;
exports.loadConfig = loadConfig;
exports.requireConfig = requireConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const CONFIG_FILE_NAME = ".okrunitrc";
const DEFAULT_BASE_URL = "https://app.okrunit.com";
function getConfigPath() {
    return path.join(os.homedir(), CONFIG_FILE_NAME);
}
/**
 * Read the config file from ~/.okrunitrc. Returns an empty object if the
 * file does not exist or cannot be parsed.
 */
function readConfigFile() {
    const configPath = getConfigPath();
    try {
        const raw = fs.readFileSync(configPath, "utf-8");
        return JSON.parse(raw);
    }
    catch {
        return {};
    }
}
/**
 * Write a config object to ~/.okrunitrc.
 */
function writeConfigFile(config) {
    const configPath = getConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", {
        mode: 0o600, // owner read/write only
    });
}
/**
 * Load the effective configuration by merging sources in priority order:
 *   1. Environment variables (OKRUNIT_API_KEY, OKRUNIT_BASE_URL)
 *   2. Config file (~/.okrunitrc)
 *   3. Defaults
 */
function loadConfig() {
    const file = readConfigFile();
    const apiKey = process.env.OKRUNIT_API_KEY ?? file.apiKey ?? "";
    const baseUrl = process.env.OKRUNIT_BASE_URL ?? file.baseUrl ?? DEFAULT_BASE_URL;
    return { apiKey, baseUrl };
}
/**
 * Load config and verify an API key is available. Exits with an error
 * message if no API key is configured.
 */
function requireConfig() {
    const config = loadConfig();
    if (!config.apiKey) {
        console.error("Error: No API key configured.\n\n" +
            "Set one with:\n" +
            "  okrunit config\n" +
            "  export OKRUNIT_API_KEY=gk_...\n");
        process.exit(1);
    }
    return config;
}
//# sourceMappingURL=config.js.map
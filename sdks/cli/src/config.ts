// ---------------------------------------------------------------------------
// OKRunit CLI -- Configuration
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CONFIG_DIR = join(homedir(), ".okrunit");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

interface Config {
  api_key?: string;
  base_url?: string;
}

export function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8")) as Config;
  } catch {
    return {};
  }
}

export function saveConfig(config: Config): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n");
}

export function getApiKey(): string {
  const envKey = process.env.OKRUNIT_API_KEY;
  if (envKey) return envKey;

  const config = loadConfig();
  if (config.api_key) return config.api_key;

  console.error("Error: No API key configured.");
  console.error("Set OKRUNIT_API_KEY env var or run: okrunit configure");
  process.exit(1);
}

export function getBaseUrl(): string {
  return process.env.OKRUNIT_BASE_URL ?? loadConfig().base_url ?? "https://okrunit.com";
}

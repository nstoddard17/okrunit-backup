// ---------------------------------------------------------------------------
// OKRunit CLI -- `okrunit config` command
// ---------------------------------------------------------------------------

import { Command } from "commander";
import * as readline from "readline";
import { loadConfig, writeConfigFile } from "../config";

function prompt(question: string, defaultValue?: string): Promise<string> {
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

export function makeConfigCommand(): Command {
  return new Command("config")
    .description("Configure API key and base URL")
    .option("--show", "Show current configuration", false)
    .action(async (opts: Record<string, unknown>) => {
      const current = loadConfig();

      if (opts.show) {
        const maskedKey = current.apiKey
          ? current.apiKey.slice(0, 6) + "..." + current.apiKey.slice(-4)
          : "(not set)";
        console.log(`API Key:  ${maskedKey}`);
        console.log(`Base URL: ${current.baseUrl}`);
        return;
      }

      console.log("OKRunit CLI Configuration\n");

      const apiKey = await prompt(
        "API Key",
        current.apiKey || undefined,
      );
      const baseUrl = await prompt(
        "Base URL",
        current.baseUrl,
      );

      writeConfigFile({ apiKey, baseUrl });
      console.log("\nConfiguration saved to ~/.okrunitrc");
    });
}

// Generic browser helper for screenshot capture
// Usage:
//   npx tsx tools/scripts/screenshots/browser.ts login <platform> <url>
//     → Opens browser to URL, pauses for login, saves session state
//   npx tsx tools/scripts/screenshots/browser.ts open <platform> [url]
//     → Opens browser with saved session, navigates to URL, pauses
//   npx tsx tools/scripts/screenshots/browser.ts snap <platform> <filename> [url]
//     → Opens browser with saved session, navigates to URL, takes screenshot, pauses

import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";

const STATE_DIR = path.join(process.cwd(), "tools/scripts/screenshots/.auth");
const OUTPUT_DIR = path.join(process.cwd(), "public/screenshots/docs/integrations");

async function main() {
  const [, , action, platform, ...rest] = process.argv;

  if (!action || !platform) {
    console.log("Usage:");
    console.log("  npx tsx browser.ts login <platform> <url>");
    console.log("  npx tsx browser.ts open <platform> [url]");
    console.log("  npx tsx browser.ts snap <platform> <filename> [url]");
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });

  const statePath = path.join(STATE_DIR, `${platform}.json`);

  if (action === "login") {
    const url = rest[0] || "https://example.com";
    const browser = await chromium.launch({ headless: false, args: ["--window-size=1440,900"] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto(url);
    await page.pause(); // User signs in, then clicks Resume
    await context.storageState({ path: statePath });
    console.log(`✅ ${platform} login state saved to ${statePath}`);
    await browser.close();
    return;
  }

  // Load saved state
  if (!fs.existsSync(statePath)) {
    console.error(`No saved state for ${platform}. Run 'login' first.`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false, args: ["--window-size=1440,900"] });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    storageState: statePath,
  });
  const page = await context.newPage();

  if (action === "open") {
    const url = rest[0];
    if (url) await page.goto(url);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.pause();
  } else if (action === "snap") {
    const filename = rest[0];
    const url = rest[1];
    if (url) {
      await page.goto(url);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(2000);
    }
    const filePath = path.join(OUTPUT_DIR, `${filename}.png`);
    await page.screenshot({ path: filePath, type: "png" });
    console.log(`✅ ${filePath}`);
    await page.pause(); // Keep open for inspection
  }

  await browser.close();
}

main().catch(console.error);

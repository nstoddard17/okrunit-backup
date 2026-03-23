import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

// ── Constants ──────────────────────────────────────────────────────────

export const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..', '..', '..');
export const INTEGRATIONS_DIR = path.join(PROJECT_ROOT, 'integrations');
export const SCREENSHOTS_DIR = path.join(import.meta.dirname, 'screenshots');

// ── Logging ────────────────────────────────────────────────────────────

export function log(platform: string, message: string): void {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] [${platform}] ${message}`);
}

export function logStep(platform: string, step: number, total: number, message: string): void {
  log(platform, `Step ${step}/${total}: ${message}`);
}

export function logWaiting(platform: string, message: string): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  [${platform}] ACTION REQUIRED: ${message}`);
  console.log(`${'='.repeat(60)}\n`);
}

export function logSuccess(platform: string, message: string): void {
  console.log(`\n[${platform}] ✓ ${message}\n`);
}

export function logError(platform: string, message: string): void {
  console.error(`\n[${platform}] ERROR: ${message}\n`);
}

// ── CLI Detection ──────────────────────────────────────────────────────

export function isCliInstalled(command: string): boolean {
  try {
    execSync(`which ${command}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function runCli(command: string, cwd: string): { success: boolean; output: string } {
  try {
    const output = execSync(command, { cwd, stdio: 'pipe', encoding: 'utf-8' });
    return { success: true, output };
  } catch (err: unknown) {
    const error = err as { stderr?: string; stdout?: string; message?: string };
    return {
      success: false,
      output: error.stderr || error.stdout || error.message || 'Unknown error',
    };
  }
}

// ── Browser Helpers ────────────────────────────────────────────────────

export interface LaunchResult {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

export async function launchBrowser(): Promise<LaunchResult> {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  return { browser, context, page };
}

export async function takeScreenshot(page: Page, platform: string, label: string): Promise<string> {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  const filename = `${platform}-${label}-${Date.now()}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  log(platform, `Screenshot saved: ${filepath}`);
  return filepath;
}

export async function waitForUserLogin(
  page: Page,
  platform: string,
  loginUrl: string,
  successIndicator: string | RegExp,
  timeoutMs: number = 300_000
): Promise<void> {
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

  logWaiting(platform, 'Please sign in to the browser window. The script will continue automatically once login is detected.');

  try {
    await page.waitForURL(successIndicator, { timeout: timeoutMs });
    logSuccess(platform, 'Login detected. Continuing automation...');
  } catch {
    throw new Error(
      `Login was not detected within ${timeoutMs / 1000}s. ` +
      `Expected URL to match: ${successIndicator}`
    );
  }
}

export async function safeClick(page: Page, selector: string, options?: { timeout?: number }): Promise<boolean> {
  try {
    await page.click(selector, { timeout: options?.timeout ?? 10_000 });
    return true;
  } catch {
    return false;
  }
}

export async function safeWaitForSelector(page: Page, selector: string, options?: { timeout?: number }): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: options?.timeout ?? 10_000 });
    return true;
  } catch {
    return false;
  }
}

// ── File Reading ───────────────────────────────────────────────────────

export function readJsonFile(filepath: string): unknown {
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content);
}

export function readFile(filepath: string): string {
  return fs.readFileSync(filepath, 'utf-8');
}

// ── Error Wrapper ──────────────────────────────────────────────────────

export async function runDeployment(
  platform: string,
  fn: () => Promise<void>
): Promise<boolean> {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Deploying: ${platform}`);
  console.log(`${'─'.repeat(60)}\n`);

  try {
    await fn();
    logSuccess(platform, 'Deployment completed successfully.');
    return true;
  } catch (err: unknown) {
    const error = err as Error;
    logError(platform, error.message);
    console.error('\nRetry hints:');
    console.error('  1. Check your internet connection');
    console.error('  2. Make sure you have the correct account permissions');
    console.error('  3. Check the screenshots/ directory for failure context');
    console.error(`  4. Run again: npm run deploy:${platform.toLowerCase()}\n`);
    return false;
  }
}

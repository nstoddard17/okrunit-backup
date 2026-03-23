#!/usr/bin/env npx tsx

/**
 * deploy-pipedream.ts
 *
 * Deploys OKRunit Pipedream components.
 *
 * Strategy:
 *   1. If the `pd` CLI is installed and authenticated, use `pd publish` for each component.
 *   2. Otherwise, open the Pipedream dashboard for manual registration.
 */

import * as path from 'path';
import * as fs from 'fs';
import {
  INTEGRATIONS_DIR,
  isCliInstalled,
  runCli,
  log,
  logStep,
  logWaiting,
  logSuccess,
  logError,
  launchBrowser,
  waitForUserLogin,
  takeScreenshot,
  runDeployment,
} from './helpers.js';

const PLATFORM = 'Pipedream';
const PIPEDREAM_DIR = path.join(INTEGRATIONS_DIR, 'pipedream');
const PIPEDREAM_URL = 'https://pipedream.com/apps';

// ── CLI Deploy Path ────────────────────────────────────────────────────

async function deployViaCli(): Promise<boolean> {
  log(PLATFORM, 'Pipedream CLI (pd) detected. Checking authentication...');

  const whoami = runCli('pd me', PIPEDREAM_DIR);
  if (!whoami.success) {
    logError(PLATFORM, 'Pipedream CLI is not authenticated. Run `pd login` first.');
    log(PLATFORM, 'Falling back to browser-based deployment...');
    return false;
  }
  log(PLATFORM, `Authenticated: ${whoami.output.trim()}`);

  // Find all component files (sources and actions)
  const componentDirs = ['sources', 'actions'];
  const componentFiles: string[] = [];

  for (const dir of componentDirs) {
    const dirPath = path.join(PIPEDREAM_DIR, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
      for (const file of files) {
        componentFiles.push(path.join(dirPath, file));
      }
    }
  }

  // Also check the components/ directory
  const componentsPath = path.join(PIPEDREAM_DIR, 'components');
  if (fs.existsSync(componentsPath)) {
    const files = fs.readdirSync(componentsPath).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
    for (const file of files) {
      componentFiles.push(path.join(componentsPath, file));
    }
  }

  if (componentFiles.length === 0) {
    logError(PLATFORM, 'No component files found in sources/, actions/, or components/ directories.');
    return false;
  }

  log(PLATFORM, `Found ${componentFiles.length} component file(s) to publish.`);

  let allSuccess = true;
  const total = componentFiles.length;

  for (let i = 0; i < componentFiles.length; i++) {
    const file = componentFiles[i];
    const name = path.basename(file);
    logStep(PLATFORM, i + 1, total, `Publishing ${name}...`);

    const result = runCli(`pd publish ${file}`, PIPEDREAM_DIR);
    if (result.success) {
      logSuccess(PLATFORM, `Published ${name}`);
      console.log(result.output);
    } else {
      logError(PLATFORM, `Failed to publish ${name}: ${result.output}`);
      allSuccess = false;
    }
  }

  return allSuccess;
}

// ── Browser Deploy Path ────────────────────────────────────────────────

async function deployViaBrowser(): Promise<void> {
  const { browser, page } = await launchBrowser();

  try {
    logStep(PLATFORM, 1, 3, 'Opening Pipedream dashboard...');
    await waitForUserLogin(
      page,
      PLATFORM,
      PIPEDREAM_URL,
      /pipedream\.com\/(apps|sources|workflows|settings|projects)/,
      300_000
    );

    logStep(PLATFORM, 2, 3, 'Navigating to component management...');

    // List available components
    const componentDirs = ['sources', 'actions', 'components'];
    const allFiles: string[] = [];
    for (const dir of componentDirs) {
      const dirPath = path.join(PIPEDREAM_DIR, dir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
        allFiles.push(...files.map(f => `${dir}/${f}`));
      }
    }

    logStep(PLATFORM, 3, 3, 'Manual component registration required.');

    logWaiting(PLATFORM,
      'The Pipedream CLI (pd) is not installed. Please register components manually.\n\n' +
      'To install the CLI (recommended):\n' +
      '  npm install -g @pipedream/cli\n' +
      '  pd login\n' +
      '  Then re-run this script.\n\n' +
      'Component files to register:\n' +
      allFiles.map((f, i) => `  ${i + 1}. ${f}`).join('\n') + '\n\n' +
      `Files are located at: ${PIPEDREAM_DIR}\n\n` +
      'You can also publish via CLI:\n' +
      allFiles.map(f => `  pd publish ${path.join(PIPEDREAM_DIR, f)}`).join('\n') + '\n\n' +
      'Press Enter when done.'
    );
    await page.pause();

    await takeScreenshot(page, 'pipedream', 'final');
  } catch (err) {
    await takeScreenshot(page, 'pipedream', 'error');
    throw err;
  } finally {
    await browser.close();
  }
}

// ── Main ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (isCliInstalled('pd')) {
    const cliSuccess = await deployViaCli();
    if (cliSuccess) return;
    log(PLATFORM, 'CLI deployment had failures. Opening browser for manual review...');
  } else {
    log(PLATFORM, 'Pipedream CLI (pd) not found.');
  }

  await deployViaBrowser();
}

runDeployment(PLATFORM, main);

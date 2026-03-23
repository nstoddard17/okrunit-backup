#!/usr/bin/env npx tsx

/**
 * deploy-windmill.ts
 *
 * Deploys OKRunit Windmill scripts and flows.
 *
 * Strategy:
 *   1. If the `wmill` CLI is installed and authenticated, use `wmill sync push`.
 *   2. Otherwise, open the Windmill dashboard for manual upload.
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

const PLATFORM = 'Windmill';
const WINDMILL_DIR = path.join(INTEGRATIONS_DIR, 'windmill');
const WINDMILL_URL = 'https://app.windmill.dev';

// ── CLI Deploy Path ────────────────────────────────────────────────────

async function deployViaCli(): Promise<boolean> {
  log(PLATFORM, 'Windmill CLI (wmill) detected. Checking workspace...');

  // Check if wmill is set up with a workspace
  const workspace = runCli('wmill workspace', WINDMILL_DIR);
  if (!workspace.success) {
    logError(PLATFORM,
      'Windmill CLI has no workspace configured.\n' +
      'Set one up with: wmill workspace add <name> <url> --token <token>'
    );
    return false;
  }
  log(PLATFORM, `Workspace: ${workspace.output.trim()}`);

  // Push scripts and flows
  logStep(PLATFORM, 1, 2, 'Syncing scripts and flows to Windmill...');

  const push = runCli('wmill sync push', WINDMILL_DIR);
  if (!push.success) {
    // Try pushing individual scripts if sync push fails
    log(PLATFORM, 'Sync push failed. Trying individual script uploads...');

    const scriptsDir = path.join(WINDMILL_DIR, 'scripts');
    const flowsDir = path.join(WINDMILL_DIR, 'flows');
    let anySuccess = false;

    if (fs.existsSync(scriptsDir)) {
      const scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.ts'));
      for (const script of scripts) {
        const scriptPath = path.join(scriptsDir, script);
        const scriptName = script.replace('.ts', '');
        log(PLATFORM, `Pushing script: ${scriptName}...`);

        const result = runCli(`wmill script push f/okrunit/${scriptName} ${scriptPath}`, WINDMILL_DIR);
        if (result.success) {
          logSuccess(PLATFORM, `Pushed script ${scriptName}`);
          anySuccess = true;
        } else {
          logError(PLATFORM, `Failed to push ${scriptName}: ${result.output}`);
        }
      }
    }

    if (fs.existsSync(flowsDir)) {
      const flows = fs.readdirSync(flowsDir).filter(f => f.endsWith('.yaml') || f.endsWith('.json'));
      for (const flow of flows) {
        const flowPath = path.join(flowsDir, flow);
        const flowName = flow.replace(/\.(yaml|json)$/, '');
        log(PLATFORM, `Pushing flow: ${flowName}...`);

        const result = runCli(`wmill flow push f/okrunit/${flowName} ${flowPath}`, WINDMILL_DIR);
        if (result.success) {
          logSuccess(PLATFORM, `Pushed flow ${flowName}`);
          anySuccess = true;
        } else {
          logError(PLATFORM, `Failed to push ${flowName}: ${result.output}`);
        }
      }
    }

    if (!anySuccess) {
      logError(PLATFORM, 'All individual pushes failed.');
      return false;
    }

    return true;
  }

  logStep(PLATFORM, 2, 2, 'Sync complete.');
  console.log(push.output);
  return true;
}

// ── Browser Deploy Path ────────────────────────────────────────────────

async function deployViaBrowser(): Promise<void> {
  const { browser, page } = await launchBrowser();

  try {
    logStep(PLATFORM, 1, 4, 'Opening Windmill dashboard...');
    await waitForUserLogin(
      page,
      PLATFORM,
      WINDMILL_URL,
      /app\.windmill\.dev\/.+/,
      300_000
    );

    // Step 2: Navigate to scripts
    logStep(PLATFORM, 2, 4, 'Navigating to scripts...');

    // List scripts and flows to upload
    const scriptsDir = path.join(WINDMILL_DIR, 'scripts');
    const flowsDir = path.join(WINDMILL_DIR, 'flows');

    const scripts = fs.existsSync(scriptsDir)
      ? fs.readdirSync(scriptsDir).filter(f => f.endsWith('.ts'))
      : [];
    const flows = fs.existsSync(flowsDir)
      ? fs.readdirSync(flowsDir).filter(f => f.endsWith('.yaml') || f.endsWith('.json'))
      : [];

    log(PLATFORM, `Found ${scripts.length} script(s) and ${flows.length} flow(s).`);

    // Step 3: Upload resource type
    logStep(PLATFORM, 3, 4, 'Checking resource type...');

    const resourceTypePath = path.join(WINDMILL_DIR, 'resource-type.json');
    if (fs.existsSync(resourceTypePath)) {
      log(PLATFORM, 'Found resource-type.json. Please create this resource type in Windmill.');

      logWaiting(PLATFORM,
        'Please create the OKRunit resource type in Windmill:\n' +
        '  1. Go to Resources > Resource Types > Add\n' +
        `  2. Upload: ${resourceTypePath}\n` +
        'Press Enter when done.'
      );
      await page.pause();
    }

    // Step 4: Upload scripts and flows
    logStep(PLATFORM, 4, 4, 'Upload scripts and flows...');

    logWaiting(PLATFORM,
      'Please upload the following scripts and flows to Windmill:\n\n' +
      'Scripts:\n' +
      scripts.map((s, i) => `  ${i + 1}. ${s} (${path.join(scriptsDir, s)})`).join('\n') + '\n\n' +
      'Flows:\n' +
      flows.map((f, i) => `  ${i + 1}. ${f} (${path.join(flowsDir, f)})`).join('\n') + '\n\n' +
      'Recommended: Install the Windmill CLI for automated deployment:\n' +
      '  npm install -g windmill-cli\n' +
      '  wmill workspace add okrunit https://app.windmill.dev --token <YOUR_TOKEN>\n' +
      '  cd integrations/windmill && wmill sync push\n\n' +
      'Press Enter when done.'
    );
    await page.pause();

    await takeScreenshot(page, 'windmill', 'final');
  } catch (err) {
    await takeScreenshot(page, 'windmill', 'error');
    throw err;
  } finally {
    await browser.close();
  }
}

// ── Main ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (isCliInstalled('wmill')) {
    const cliSuccess = await deployViaCli();
    if (cliSuccess) return;
    log(PLATFORM, 'CLI deployment failed. Opening browser for manual upload...');
  } else {
    log(PLATFORM, 'Windmill CLI (wmill) not found.');
  }

  await deployViaBrowser();
}

runDeployment(PLATFORM, main);

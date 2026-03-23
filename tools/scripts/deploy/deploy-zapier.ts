#!/usr/bin/env npx tsx

/**
 * deploy-zapier.ts
 *
 * Deploys the OKRunit Zapier integration.
 *
 * Strategy:
 *   1. If the `zapier` CLI is installed and authenticated, use `zapier push` (fast path).
 *   2. Otherwise, open the Zapier Developer Platform in a visible browser,
 *      let the user sign in manually, then automate the upload/configuration steps.
 */

import * as path from 'path';
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
  safeClick,
  safeWaitForSelector,
  readJsonFile,
  readFile,
  runDeployment,
} from './helpers.js';

const PLATFORM = 'Zapier';
const ZAPIER_DIR = path.join(INTEGRATIONS_DIR, 'zapier');
const ZAPIER_DEV_URL = 'https://developer.zapier.com';
const TOTAL_STEPS = 6;

// ── CLI Deploy Path ────────────────────────────────────────────────────

async function deployViaCli(): Promise<boolean> {
  log(PLATFORM, 'Zapier CLI detected. Attempting `zapier push`...');

  // Verify authentication first
  const whoami = runCli('npx zapier whoami', ZAPIER_DIR);
  if (!whoami.success) {
    logError(PLATFORM, 'Zapier CLI is not authenticated. Run `zapier login` first.');
    log(PLATFORM, 'Falling back to browser-based deployment...');
    return false;
  }
  log(PLATFORM, `Authenticated as: ${whoami.output.trim()}`);

  // Validate the integration
  logStep(PLATFORM, 1, 3, 'Validating integration...');
  const validate = runCli('npx zapier validate', ZAPIER_DIR);
  if (!validate.success) {
    logError(PLATFORM, `Validation failed:\n${validate.output}`);
    return false;
  }
  log(PLATFORM, 'Validation passed.');

  // Push the integration
  logStep(PLATFORM, 2, 3, 'Pushing integration to Zapier...');
  const push = runCli('npx zapier push', ZAPIER_DIR);
  if (!push.success) {
    logError(PLATFORM, `Push failed:\n${push.output}`);
    return false;
  }

  logStep(PLATFORM, 3, 3, 'Push complete.');
  console.log(push.output);
  return true;
}

// ── Browser Deploy Path ────────────────────────────────────────────────

async function deployViaBrowser(): Promise<void> {
  const { browser, page } = await launchBrowser();

  try {
    // Step 1: Login
    logStep(PLATFORM, 1, TOTAL_STEPS, 'Opening Zapier Developer Platform...');
    await waitForUserLogin(
      page,
      PLATFORM,
      ZAPIER_DEV_URL,
      /developer\.zapier\.com\/(app|platform)/,
      300_000
    );

    // Step 2: Find or create the OKRunit app
    logStep(PLATFORM, 2, TOTAL_STEPS, 'Looking for OKRunit app...');
    await page.goto(`${ZAPIER_DEV_URL}/app`, { waitUntil: 'networkidle' });

    // Check if the app list has OKRunit
    const appLink = page.locator('a:has-text("OKRunit")').first();
    const appExists = await appLink.isVisible({ timeout: 5_000 }).catch(() => false);

    if (appExists) {
      log(PLATFORM, 'Found existing OKRunit app. Clicking to open...');
      await appLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      log(PLATFORM, 'OKRunit app not found. Creating a new app...');

      // Click "Start a Zapier Integration" or equivalent button
      const createBtn = page.locator('button:has-text("Start"), a:has-text("Start"), button:has-text("Create"), a:has-text("Create")').first();
      if (await createBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForLoadState('networkidle');

        // Fill in app name
        const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
        if (await nameInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await nameInput.fill('OKRunit');
        }

        // Fill in description
        const descInput = page.locator('textarea[name="description"], input[name="description"]').first();
        if (await descInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await descInput.fill(
            'Human-in-the-loop approval gateway for AI agents and automated workflows.'
          );
        }

        // Submit creation form
        const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
        if (await submitBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await submitBtn.click();
          await page.waitForLoadState('networkidle');
        }
      } else {
        logWaiting(PLATFORM, 'Could not find the "Create" button. Please create the app manually, then press Enter in the terminal.');
        await page.pause();
      }
    }

    await takeScreenshot(page, 'zapier', 'app-page');

    // Step 3: Configure Authentication (OAuth 2.0)
    logStep(PLATFORM, 3, TOTAL_STEPS, 'Configuring OAuth 2.0 authentication...');

    const authLink = page.locator('a:has-text("Authentication"), [data-testid="authentication"]').first();
    if (await authLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await authLink.click();
      await page.waitForLoadState('networkidle');

      // Check if auth is already configured
      const oauthConfigured = page.locator('text=OAuth 2.0').first();
      if (await oauthConfigured.isVisible({ timeout: 3_000 }).catch(() => false)) {
        log(PLATFORM, 'OAuth 2.0 authentication already configured.');
      } else {
        log(PLATFORM, 'Setting up OAuth 2.0...');
        // Select OAuth 2.0 from the authentication scheme dropdown
        const authSchemeSelect = page.locator('select, [role="listbox"]').first();
        if (await authSchemeSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await authSchemeSelect.selectOption({ label: 'OAuth v2' }).catch(async () => {
            // Might be a custom dropdown
            await authSchemeSelect.click();
            const oauth2Option = page.locator('text=OAuth v2, [data-value="oauth2"]').first();
            await oauth2Option.click().catch(() => {});
          });
        }

        logWaiting(PLATFORM,
          'Please verify the OAuth 2.0 configuration in the browser:\n' +
          '  - Authorization URL: https://www.okrunit.com/api/v1/oauth/authorize\n' +
          '  - Token URL: https://www.okrunit.com/api/v1/oauth/token\n' +
          '  - Scopes: approvals:read approvals:write comments:write\n' +
          '  - Enable PKCE\n' +
          'Press Enter in the terminal when done.'
        );
        await page.pause();
      }
    } else {
      log(PLATFORM, 'Authentication tab not found. The UI may have changed.');
      logWaiting(PLATFORM, 'Please configure OAuth 2.0 authentication manually, then press Enter.');
      await page.pause();
    }

    // Step 4: Configure Triggers
    logStep(PLATFORM, 4, TOTAL_STEPS, 'Configuring triggers...');

    const triggersLink = page.locator('a:has-text("Triggers")').first();
    if (await triggersLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await triggersLink.click();
      await page.waitForLoadState('networkidle');

      const triggerFiles = [
        { file: 'newApproval.js', key: 'newApproval', label: 'New Approval Request' },
        { file: 'approvalDecided.js', key: 'approvalDecided', label: 'Approval Decided' },
      ];

      for (const trigger of triggerFiles) {
        log(PLATFORM, `Checking trigger: ${trigger.label}...`);
        const existing = page.locator(`text=${trigger.label}, text=${trigger.key}`).first();
        if (await existing.isVisible({ timeout: 3_000 }).catch(() => false)) {
          log(PLATFORM, `Trigger "${trigger.label}" already exists.`);
        } else {
          log(PLATFORM, `Trigger "${trigger.label}" may need manual configuration.`);
        }
      }

      logWaiting(PLATFORM,
        'Please verify that the following triggers are configured:\n' +
        '  1. newApproval - "New Approval Request" (REST Hook)\n' +
        '  2. approvalDecided - "Approval Decided" (REST Hook)\n' +
        'Press Enter in the terminal when done.'
      );
      await page.pause();
    }

    await takeScreenshot(page, 'zapier', 'triggers');

    // Step 5: Configure Actions
    logStep(PLATFORM, 5, TOTAL_STEPS, 'Configuring actions and searches...');

    const actionsLink = page.locator('a:has-text("Actions")').first();
    if (await actionsLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await actionsLink.click();
      await page.waitForLoadState('networkidle');

      const modules = [
        { type: 'create', key: 'requestApproval', label: 'Request Approval (with callback)' },
        { type: 'create', key: 'addComment', label: 'Add Comment' },
        { type: 'search', key: 'getApproval', label: 'Get Approval' },
        { type: 'search', key: 'listApprovals', label: 'List Approvals' },
      ];

      for (const mod of modules) {
        log(PLATFORM, `Checking ${mod.type}: ${mod.label}...`);
        const existing = page.locator(`text=${mod.label}, text=${mod.key}`).first();
        if (await existing.isVisible({ timeout: 2_000 }).catch(() => false)) {
          log(PLATFORM, `${mod.type} "${mod.label}" already exists.`);
        }
      }

      logWaiting(PLATFORM,
        'Please verify that the following actions/searches are configured:\n' +
        '  Actions:\n' +
        '    1. requestApproval - "Request Approval" (with performResume for callback)\n' +
        '    2. addComment - "Add Comment"\n' +
        '  Searches:\n' +
        '    3. getApproval - "Get Approval"\n' +
        '    4. listApprovals - "List Approvals"\n' +
        'Press Enter in the terminal when done.'
      );
      await page.pause();
    }

    await takeScreenshot(page, 'zapier', 'actions');

    // Step 6: Push version
    logStep(PLATFORM, 6, TOTAL_STEPS, 'Verifying deployment...');

    logWaiting(PLATFORM,
      'Deployment via browser is limited. For the best experience:\n' +
      '  1. Install Zapier CLI: npm install -g zapier-platform-cli\n' +
      '  2. Authenticate: zapier login\n' +
      '  3. Link your app: cd integrations/zapier && zapier link\n' +
      '  4. Push: zapier push\n\n' +
      'Press Enter to finish.'
    );
    await page.pause();

    await takeScreenshot(page, 'zapier', 'final');
  } catch (err) {
    await takeScreenshot(page, 'zapier', 'error');
    throw err;
  } finally {
    await browser.close();
  }
}

// ── Main ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Prefer CLI path if zapier CLI is available
  if (isCliInstalled('zapier') || isCliInstalled('npx')) {
    // Check if zapier is available via npx (local devDependency)
    const zapierCheck = runCli('npx zapier --version', ZAPIER_DIR);
    if (zapierCheck.success) {
      const cliSuccess = await deployViaCli();
      if (cliSuccess) return;
      log(PLATFORM, 'CLI deployment failed. Falling back to browser...');
    }
  }

  await deployViaBrowser();
}

runDeployment(PLATFORM, main);

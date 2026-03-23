#!/usr/bin/env npx tsx

/**
 * deploy-make.ts
 *
 * Deploys the OKRunit Make.com custom app.
 *
 * Opens the Make.com developer platform in a visible browser, waits for the user
 * to sign in, then automates uploading module JSON files and configuring the
 * OAuth 2.0 connection.
 */

import * as path from 'path';
import * as fs from 'fs';
import {
  INTEGRATIONS_DIR,
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

const PLATFORM = 'Make';
const MAKE_DIR = path.join(INTEGRATIONS_DIR, 'make');
const MAKE_DEV_URL = 'https://www.make.com/en/custom-apps';
const TOTAL_STEPS = 6;

async function main(): Promise<void> {
  const { browser, page } = await launchBrowser();

  try {
    // Step 1: Login
    logStep(PLATFORM, 1, TOTAL_STEPS, 'Opening Make.com developer platform...');
    await waitForUserLogin(
      page,
      PLATFORM,
      MAKE_DEV_URL,
      /make\.com\/(en\/)?(custom-apps|app)/,
      300_000
    );

    // Step 2: Find or create the OKRunit app
    logStep(PLATFORM, 2, TOTAL_STEPS, 'Looking for OKRunit custom app...');

    // Navigate to custom apps listing
    await page.goto('https://www.make.com/en/custom-apps', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2_000);

    const appLink = page.locator('a:has-text("OKRunit"), [data-name="OKRunit"]').first();
    const appExists = await appLink.isVisible({ timeout: 5_000 }).catch(() => false);

    if (appExists) {
      log(PLATFORM, 'Found existing OKRunit app. Opening...');
      await appLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      log(PLATFORM, 'OKRunit app not found. Creating a new custom app...');

      // Look for the create button
      const createBtn = page.locator(
        'button:has-text("Create"), a:has-text("Create a new app"), button:has-text("New app")'
      ).first();

      if (await createBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1_000);

        // Fill in app name
        const nameInput = page.locator('input[name="name"], input[placeholder*="name" i], input[id*="name" i]').first();
        if (await nameInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await nameInput.fill('OKRunit');
        }

        // Fill in description
        const descInput = page.locator('textarea, input[name="description"]').first();
        if (await descInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await descInput.fill(
            'Human-in-the-loop approval gateway for AI agents and automated workflows.'
          );
        }

        // Submit
        const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
        if (await submitBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await submitBtn.click();
          await page.waitForLoadState('networkidle');
        }
      } else {
        logWaiting(PLATFORM,
          'Could not find the "Create" button. Please create the custom app manually named "OKRunit".\n' +
          'Press Enter in the terminal when the app is created and you are on its page.'
        );
        await page.pause();
      }
    }

    await takeScreenshot(page, 'make', 'app-page');

    // Step 3: Upload Base configuration
    logStep(PLATFORM, 3, TOTAL_STEPS, 'Uploading base configuration...');

    const baseJson = readFile(path.join(MAKE_DIR, 'base.json'));
    log(PLATFORM, 'Read base.json configuration.');

    // Navigate to the Base tab if available
    const baseTab = page.locator('a:has-text("Base"), [data-tab="base"], button:has-text("Base")').first();
    if (await baseTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await baseTab.click();
      await page.waitForLoadState('networkidle');

      // Look for JSON editor or code input
      const codeEditor = page.locator('.CodeMirror, textarea[name="base"], .monaco-editor, [data-mode="json"]').first();
      if (await codeEditor.isVisible({ timeout: 5_000 }).catch(() => false)) {
        // If CodeMirror, we need to click into it first
        await codeEditor.click();
        // Select all and replace
        await page.keyboard.press('Meta+a');
        await page.keyboard.type(baseJson, { delay: 0 });
        log(PLATFORM, 'Pasted base.json into editor.');
      } else {
        log(PLATFORM, 'Could not find code editor for base.json.');
        logWaiting(PLATFORM,
          'Please paste the base.json configuration manually.\n' +
          `File location: ${path.join(MAKE_DIR, 'base.json')}\n` +
          'Press Enter when done.'
        );
        await page.pause();
      }
    } else {
      log(PLATFORM, 'Base tab not found on this page.');
    }

    // Step 4: Upload Connection (OAuth 2.0)
    logStep(PLATFORM, 4, TOTAL_STEPS, 'Configuring OAuth 2.0 connection...');

    const connectionsTab = page.locator(
      'a:has-text("Connection"), [data-tab="connections"], button:has-text("Connection")'
    ).first();

    if (await connectionsTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await connectionsTab.click();
      await page.waitForLoadState('networkidle');

      const oauth2Json = readFile(path.join(MAKE_DIR, 'connections', 'oauth2.json'));
      log(PLATFORM, 'Read oauth2.json connection configuration.');

      // Check for existing connection or create new
      const newConnBtn = page.locator(
        'button:has-text("Add"), button:has-text("New"), button:has-text("Create")'
      ).first();

      // Try to find and edit existing oauth2 connection
      const existingConn = page.locator('text=oauth2, text=OAuth').first();
      if (await existingConn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        log(PLATFORM, 'Found existing OAuth connection. Clicking to edit...');
        await existingConn.click();
        await page.waitForTimeout(1_000);
      } else if (await newConnBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        log(PLATFORM, 'Creating new connection...');
        await newConnBtn.click();
        await page.waitForTimeout(1_000);
      }

      // Try to paste into the JSON editor
      const connEditor = page.locator('.CodeMirror, textarea, .monaco-editor, [data-mode="json"]').first();
      if (await connEditor.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await connEditor.click();
        await page.keyboard.press('Meta+a');
        await page.keyboard.type(oauth2Json, { delay: 0 });
        log(PLATFORM, 'Pasted OAuth 2.0 configuration.');

        // Save
        const saveBtn = page.locator('button:has-text("Save")').first();
        if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await saveBtn.click();
          await page.waitForLoadState('networkidle');
          log(PLATFORM, 'Saved connection configuration.');
        }
      } else {
        logWaiting(PLATFORM,
          'Please configure the OAuth 2.0 connection manually.\n' +
          `File location: ${path.join(MAKE_DIR, 'connections', 'oauth2.json')}\n` +
          'Press Enter when done.'
        );
        await page.pause();
      }
    }

    await takeScreenshot(page, 'make', 'connection');

    // Step 5: Upload Modules
    logStep(PLATFORM, 5, TOTAL_STEPS, 'Uploading modules...');

    const modulesTab = page.locator(
      'a:has-text("Module"), [data-tab="modules"], button:has-text("Module")'
    ).first();

    if (await modulesTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await modulesTab.click();
      await page.waitForLoadState('networkidle');
    }

    const modulesDir = path.join(MAKE_DIR, 'modules');
    const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.endsWith('.json'));
    log(PLATFORM, `Found ${moduleFiles.length} module files to upload.`);

    for (const moduleFile of moduleFiles) {
      const moduleName = moduleFile.replace('.json', '');
      log(PLATFORM, `Processing module: ${moduleName}...`);

      const moduleJson = readFile(path.join(modulesDir, moduleFile));

      // Check if module already exists
      const existingModule = page.locator(`text=${moduleName}`).first();
      if (await existingModule.isVisible({ timeout: 2_000 }).catch(() => false)) {
        log(PLATFORM, `Module "${moduleName}" already exists. Click to update.`);
        await existingModule.click();
        await page.waitForTimeout(1_000);
      } else {
        // Try to create a new module
        const addModuleBtn = page.locator(
          'button:has-text("Add"), button:has-text("New module"), button:has-text("Create")'
        ).first();
        if (await addModuleBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await addModuleBtn.click();
          await page.waitForTimeout(1_000);
        }
      }

      // Try to paste into editor
      const modEditor = page.locator('.CodeMirror, textarea, .monaco-editor, [data-mode="json"]').first();
      if (await modEditor.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await modEditor.click();
        await page.keyboard.press('Meta+a');
        await page.keyboard.type(moduleJson, { delay: 0 });

        const saveBtn = page.locator('button:has-text("Save")').first();
        if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(1_000);
          log(PLATFORM, `Saved module "${moduleName}".`);
        }
      }
    }

    // If automation was unable to upload all modules, fall back to manual
    logWaiting(PLATFORM,
      `Please verify that all ${moduleFiles.length} modules are correctly configured:\n` +
      moduleFiles.map((f, i) => `  ${i + 1}. ${f.replace('.json', '')}`).join('\n') + '\n' +
      `Module files are at: ${modulesDir}\n` +
      'Press Enter when done.'
    );
    await page.pause();

    await takeScreenshot(page, 'make', 'modules');

    // Step 6: Upload Webhooks and RPCs if they exist
    logStep(PLATFORM, 6, TOTAL_STEPS, 'Uploading webhooks and RPCs...');

    const webhooksDir = path.join(MAKE_DIR, 'webhooks');
    const rpcsDir = path.join(MAKE_DIR, 'rpcs');

    const hasWebhooks = fs.existsSync(webhooksDir) && fs.readdirSync(webhooksDir).filter(f => f.endsWith('.json')).length > 0;
    const hasRpcs = fs.existsSync(rpcsDir) && fs.readdirSync(rpcsDir).filter(f => f.endsWith('.json')).length > 0;

    if (hasWebhooks) {
      const webhookFiles = fs.readdirSync(webhooksDir).filter(f => f.endsWith('.json'));
      log(PLATFORM, `Found ${webhookFiles.length} webhook file(s).`);

      const webhooksTab = page.locator(
        'a:has-text("Webhook"), [data-tab="webhooks"], button:has-text("Webhook")'
      ).first();
      if (await webhooksTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await webhooksTab.click();
        await page.waitForLoadState('networkidle');
      }

      logWaiting(PLATFORM,
        'Please verify that webhook configurations are uploaded.\n' +
        `Webhook files are at: ${webhooksDir}\n` +
        'Press Enter when done.'
      );
      await page.pause();
    }

    if (hasRpcs) {
      const rpcFiles = fs.readdirSync(rpcsDir).filter(f => f.endsWith('.json'));
      log(PLATFORM, `Found ${rpcFiles.length} RPC file(s).`);

      const rpcsTab = page.locator(
        'a:has-text("RPC"), [data-tab="rpcs"], button:has-text("RPC")'
      ).first();
      if (await rpcsTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await rpcsTab.click();
        await page.waitForLoadState('networkidle');
      }

      logWaiting(PLATFORM,
        'Please verify that RPC configurations are uploaded.\n' +
        `RPC files are at: ${rpcsDir}\n` +
        'Press Enter when done.'
      );
      await page.pause();
    }

    await takeScreenshot(page, 'make', 'final');
    logSuccess(PLATFORM, 'All Make.com modules have been reviewed.');
  } catch (err) {
    await takeScreenshot(page, 'make', 'error');
    throw err;
  } finally {
    await browser.close();
  }
}

runDeployment(PLATFORM, main);

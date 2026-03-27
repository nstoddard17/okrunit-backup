#!/usr/bin/env npx tsx

/**
 * deploy-all.ts
 *
 * Master deployment script that runs all integration deployments in sequence.
 * Reports a summary at the end showing which deployments succeeded or failed.
 */

import { execSync } from 'child_process';
import * as path from 'path';

const SCRIPT_DIR = import.meta.dirname;

interface DeploymentResult {
  platform: string;
  script: string;
  success: boolean;
  duration: number;
  error?: string;
}

const DEPLOYMENTS = [
  { platform: 'Zapier', script: 'deploy-zapier.ts' },
  { platform: 'Make.com', script: 'deploy-make.ts' },
  { platform: 'Pipedream', script: 'deploy-pipedream.ts' },
  { platform: 'Windmill', script: 'deploy-windmill.ts' },
  { platform: 'monday.com', script: 'deploy-monday.ts' },
];

async function main(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('  OKRunit Integration Deployment');
  console.log('  Deploying to all platforms');
  console.log('='.repeat(60) + '\n');

  // Parse args to allow selecting specific platforms
  const args = process.argv.slice(2).map(a => a.toLowerCase());
  const selectedDeployments = args.length > 0
    ? DEPLOYMENTS.filter(d => args.includes(d.platform.toLowerCase().replace('.', '')))
    : DEPLOYMENTS;

  if (args.length > 0 && selectedDeployments.length === 0) {
    console.error('No matching platforms found. Available platforms:');
    DEPLOYMENTS.forEach(d => console.error(`  - ${d.platform}`));
    process.exit(1);
  }

  console.log(`Deploying to ${selectedDeployments.length} platform(s):\n`);
  selectedDeployments.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d.platform}`);
  });
  console.log('');

  const results: DeploymentResult[] = [];

  for (let i = 0; i < selectedDeployments.length; i++) {
    const deployment = selectedDeployments[i];
    const scriptPath = path.join(SCRIPT_DIR, deployment.script);

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  [${i + 1}/${selectedDeployments.length}] Deploying: ${deployment.platform}`);
    console.log(`${'─'.repeat(60)}\n`);

    const start = Date.now();

    try {
      execSync(`npx tsx ${scriptPath}`, {
        cwd: SCRIPT_DIR,
        stdio: 'inherit',
        timeout: 600_000, // 10 minute timeout per platform
      });

      results.push({
        platform: deployment.platform,
        script: deployment.script,
        success: true,
        duration: Date.now() - start,
      });
    } catch (err: unknown) {
      const error = err as Error;
      results.push({
        platform: deployment.platform,
        script: deployment.script,
        success: false,
        duration: Date.now() - start,
        error: error.message,
      });

      console.error(`\n[${deployment.platform}] Deployment failed. Continuing to next platform...\n`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('  Deployment Summary');
  console.log('='.repeat(60) + '\n');

  const maxNameLen = Math.max(...results.map(r => r.platform.length));

  for (const result of results) {
    const status = result.success ? 'SUCCESS' : 'FAILED ';
    const marker = result.success ? '+' : 'x';
    const duration = (result.duration / 1000).toFixed(1);
    const name = result.platform.padEnd(maxNameLen);
    console.log(`  [${marker}] ${name}  ${status}  (${duration}s)`);
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n  Total: ${results.length} | Succeeded: ${succeeded} | Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('  Failed deployments:');
    for (const result of results.filter(r => !r.success)) {
      console.log(`    - ${result.platform}: Re-run with "npm run deploy:${result.platform.toLowerCase().replace('.com', '')}"`);
    }
    console.log('');
    process.exit(1);
  }
}

main();

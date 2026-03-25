# @okrunit/sdk

Official TypeScript/JavaScript SDK for the OKRunit approval gateway API.

## Installation

```bash
npm install @okrunit/sdk
```

## Quick Start

```typescript
import { OKRunitClient } from "@okrunit/sdk";

const client = new OKRunitClient({
  apiKey: "gk_your_api_key_here",
  baseUrl: "https://okrunit.com", // optional, defaults to https://okrunit.com
});

// Create an approval request
const { data: approval } = await client.createApproval({
  title: "Deploy v2.3 to production",
  priority: "high",
  callback_url: "https://your-app.com/webhook",
  metadata: { version: "2.3", environment: "production" },
});

// Wait for a decision (blocks until resolved or timeout)
const decided = await client.waitForDecision(approval.id, {
  timeout: 600_000, // 10 minutes
});

console.log(`Decision: ${decided.status}`); // "approved" or "rejected"

// List pending approvals
const pending = await client.listApprovals({ status: "pending" });

// Add a comment
await client.addComment(approval.id, "Deployment pipeline is ready");

// Batch approve
await client.batchRespond({
  ids: ["id1", "id2"],
  decision: "approve",
  comment: "Batch approved via SDK",
});
```

## API Reference

### `new OKRunitClient(config)`

| Parameter | Type | Required | Description |
|---|---|---|---|
| `apiKey` | `string` | Yes | Your OKRunit API key (`gk_...`) |
| `baseUrl` | `string` | No | API base URL (default: `https://okrunit.com`) |
| `timeout` | `number` | No | Request timeout in ms (default: `30000`) |

### Methods

| Method | Description |
|---|---|
| `createApproval(params)` | Create a new approval request |
| `getApproval(id)` | Get a single approval by ID |
| `listApprovals(params?)` | List approvals with optional filters |
| `respondToApproval(id, params)` | Approve or reject an approval |
| `cancelApproval(id)` | Cancel a pending approval |
| `batchRespond(params)` | Batch approve/reject multiple approvals |
| `waitForDecision(id, options?)` | Poll until a terminal state is reached |
| `listComments(approvalId)` | List comments on an approval |
| `addComment(approvalId, body)` | Add a comment to an approval |

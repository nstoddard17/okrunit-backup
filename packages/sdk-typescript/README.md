# @okrunit/sdk

Official TypeScript SDK for the OKRunit human-in-the-loop approval API.

## Installation

```bash
npm install @okrunit/sdk
```

## Quick Start

```typescript
import { OKRunitClient } from "@okrunit/sdk";

const client = new OKRunitClient({
  apiKey: "gk_your_api_key_here",
  baseUrl: "https://app.okrunit.com", // optional, this is the default
});

// Create an approval request
const approval = await client.createApproval({
  title: "Deploy v2.5.0 to production",
  description: "Release includes new billing module",
  priority: "high",
  metadata: { version: "2.5.0", environment: "production" },
});

console.log(`Approval created: ${approval.id} (status: ${approval.status})`);
```

## Usage

### Create an Approval

```typescript
const approval = await client.createApproval({
  title: "Delete user account #12345",
  description: "User requested account deletion via support ticket",
  priority: "medium",
  source: "support-bot",
  callback_url: "https://your-app.com/webhooks/okrunit",
  metadata: { user_id: "12345", ticket_id: "SUP-789" },
});
```

### Wait for a Decision

Block until a human approves or rejects the request:

```typescript
const decided = await client.waitForDecision(approval.id, {
  timeoutMs: 300_000,    // 5 minutes
  pollIntervalMs: 5_000, // poll every 5 seconds
});

if (decided.status === "approved") {
  console.log("Approved! Proceeding...");
} else {
  console.log(`Rejected: ${decided.decision_comment}`);
}
```

### List Approvals

```typescript
const page = await client.listApprovals({
  status: "pending",
  priority: "critical",
  page: 1,
  page_size: 10,
});

console.log(`${page.total} total results`);
for (const item of page.data) {
  console.log(`- ${item.title} (${item.priority})`);
}
```

### Respond to an Approval

```typescript
await client.respondToApproval(approval.id, {
  decision: "approve",
  comment: "Looks good, ship it!",
});
```

### Cancel an Approval

```typescript
await client.cancelApproval(approval.id);
```

### Comments

```typescript
// Add a comment
const comment = await client.addComment(approval.id, "Checking with legal first");

// List comments
const comments = await client.listComments(approval.id);
```

## Error Handling

All API errors throw `OKRunitError` with structured information:

```typescript
import { OKRunitError } from "@okrunit/sdk";

try {
  await client.getApproval("nonexistent-id");
} catch (err) {
  if (err instanceof OKRunitError) {
    console.error(`Status: ${err.status}`);   // 404
    console.error(`Code: ${err.code}`);       // "NOT_FOUND"
    console.error(`Message: ${err.message}`); // "Approval request not found"
  }
}
```

## Configuration

The client reads its API key from the constructor. You can also set:

| Option    | Default                     | Description          |
|-----------|-----------------------------|----------------------|
| `apiKey`  | (required)                  | Your OKRunit API key |
| `baseUrl` | `https://app.okrunit.com`   | API base URL         |

## Requirements

- Node.js 18+ (uses native `fetch`)
- No external dependencies

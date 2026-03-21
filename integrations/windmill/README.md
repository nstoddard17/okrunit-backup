# OKRunit Windmill Integration

Windmill scripts and resource type for integrating [OKRunit](https://github.com/your-org/okrunit) into Windmill workflows.

## Setup

### 1. Add the Resource Type

In your Windmill instance, go to **Resources > Resource Types > New Resource Type** and paste the contents of `resource-type.json`.

### 2. Create a Resource

Create a new resource of type `gatekeeper` with:

- **api_key**: Your OKRunit API key (starts with `gk_`)
- **api_url**: Your OKRunit instance URL (e.g., `https://okrunit.example.com`)

### 3. Import Scripts

Import the scripts from the `scripts/` directory into your Windmill instance. Each script accepts a `gatekeeper` resource parameter as its first argument.

## Available Scripts

| Script | Description |
|--------|-------------|
| `create_approval.ts` | Create a new approval request |
| `get_approval.ts` | Get an approval request by ID |
| `list_approvals.ts` | List/search approval requests with filters |
| `add_comment.ts` | Add a comment to an approval request |
| `poll_decisions.ts` | Poll for recently decided approvals (use as trigger) |

## Example Flow

See `flows/wait_for_approval.yaml` for a complete example that creates an approval, waits for a decision, and branches on the result.

## Operations

### Create Approval

```typescript
create_approval(gatekeeper, "Deploy v2.3.1 to production", "high", "Release includes new payment flow");
```

### Get Approval

```typescript
get_approval(gatekeeper, "550e8400-e29b-41d4-a716-446655440000");
```

### List Approvals

```typescript
list_approvals(gatekeeper, "pending", "high"); // All pending high-priority approvals
```

### Add Comment

```typescript
add_comment(gatekeeper, "550e8400-e29b-41d4-a716-446655440000", "Looks good to me!");
```

### Poll for Decisions

```typescript
// Get all decisions made in the last hour
const since = new Date(Date.now() - 3600000).toISOString();
poll_decisions(gatekeeper, since, "approved");
```

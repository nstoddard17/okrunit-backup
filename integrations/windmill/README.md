# OKRunit Windmill Integration

Windmill scripts and resource type for integrating [OKRunit](https://okrunit.com) into Windmill workflows.

## CLI Setup

The Windmill CLI (`wmill`) makes deployment seamless:

```bash
# Install the Windmill CLI
pip install wmill

# Authenticate with your Windmill instance
wmill workspace add <workspace> <url> --token <token>
```

### Deploy Scripts

```bash
# Push all OKRunit scripts to your Windmill instance
wmill sync push --folder integrations/windmill/scripts

# Or deploy individual scripts
wmill script push scripts/create_approval.ts
```

### Run via CLI

```bash
# Create an approval request
wmill script run create_approval -- \
  --title "Deploy v2.3.1 to production" \
  --priority high \
  --description "Release includes new payment flow"

# Get an approval by ID
wmill script run get_approval -- \
  --approval_id "550e8400-e29b-41d4-a716-446655440000"

# List pending high-priority approvals
wmill script run list_approvals -- \
  --status pending --priority high

# Add a comment
wmill script run add_comment -- \
  --approval_id "550e8400-e29b-41d4-a716-446655440000" \
  --body "Looks good to me!"

# Poll for recent decisions
wmill script run poll_decisions -- \
  --since "2026-03-21T00:00:00Z" --status_filter approved

# Run the full approval flow
wmill flow run wait_for_approval -- \
  --title "Deploy v2.3.1" --priority high
```

## Resource Setup

### 1. Add the Resource Type

```bash
# Via CLI
wmill resource-type push resource-type.json
```

Or in the UI: **Resources > Resource Types > New Resource Type** and paste `resource-type.json`.

### 2. Create a Resource

Create a new resource of type `gatekeeper` with:

- **api_key**: Your OKRunit API key (starts with `gk_`)
- **api_url**: Your OKRunit instance URL (e.g., `https://app.okrunit.com`)

## Available Scripts

| Script | Description |
|--------|-------------|
| `create_approval.ts` | Create a new approval request (auto-sets `source: "windmill"` and idempotency key) |
| `get_approval.ts` | Get an approval request by ID |
| `list_approvals.ts` | List/search approval requests with filters |
| `add_comment.ts` | Add a comment to an approval request |
| `poll_decisions.ts` | Poll for recently decided approvals (use as trigger) |

## Example Flow

See `flows/wait_for_approval.yaml` for a complete example that:
1. Creates an approval request
2. Polls until a human decision is made
3. Branches on approved vs rejected

```bash
# Deploy and run the example flow
wmill flow push flows/wait_for_approval.yaml
wmill flow run wait_for_approval -- --title "Deploy v2.3.1" --priority high
```

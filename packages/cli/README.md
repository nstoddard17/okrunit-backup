# okrunit CLI

Command-line tool for interacting with the OKRunit human-in-the-loop approval API.

## Installation

```bash
npm install -g okrunit
```

## Configuration

Configure your API key and base URL:

```bash
okrunit config
```

This saves credentials to `~/.okrunitrc`. You can also use environment variables:

```bash
export OKRUNIT_API_KEY=gk_your_api_key_here
export OKRUNIT_BASE_URL=https://app.okrunit.com  # optional
```

Priority order: environment variables > config file > defaults.

## Commands

### Create an Approval Request

```bash
okrunit request "Deploy v2.5.0 to production" \
  --priority high \
  --description "Release includes new billing module" \
  --source deploy-bot \
  --metadata '{"version": "2.5.0"}'
```

Block until a decision is made:

```bash
okrunit request "Delete user #12345" --wait --timeout 300
```

Exit codes when using `--wait`:
- `0` -- approved
- `1` -- rejected
- `2` -- timeout / expired / cancelled

### List Approvals

```bash
okrunit list
okrunit list --status pending --priority critical
okrunit list --search "billing" --limit 5
okrunit list --json
```

### Get Approval Details

```bash
okrunit get <approval-id>
okrunit get <approval-id> --json
```

### Approve / Reject

```bash
okrunit approve <approval-id> --comment "Looks good, ship it"
okrunit reject <approval-id> --comment "Missing security review"
```

### Wait for Decision

```bash
okrunit wait <approval-id> --timeout 600 --poll-interval 5
```

Exit codes:
- `0` -- approved
- `1` -- rejected
- `2` -- timeout / expired / cancelled

### Add a Comment

```bash
okrunit comment <approval-id> "Checking with legal team first"
```

### View / Set Configuration

```bash
okrunit config --show
okrunit config
```

## Usage in Scripts

The CLI is designed for use in CI/CD pipelines and automation scripts:

```bash
#!/bin/bash
set -e

# Create approval and wait for decision
okrunit request "Deploy to production" \
  --priority high \
  --source "github-actions" \
  --wait \
  --timeout 1800

# If we get here, the request was approved (exit code 0)
echo "Approved! Deploying..."
./deploy.sh
```

```bash
# Use JSON output for programmatic access
APPROVAL_ID=$(okrunit request "Run migration" --json | jq -r '.id')
okrunit wait "$APPROVAL_ID" --timeout 600
```

## Requirements

- Node.js 18+
- An OKRunit API key (create one in the dashboard under Connections)

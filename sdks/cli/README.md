# okrunit-cli

Official CLI for the OKRunit approval gateway.

## Installation

```bash
npm install -g okrunit-cli
```

## Setup

```bash
okrunit configure --api-key gk_your_api_key_here
```

Or set the environment variable:
```bash
export OKRUNIT_API_KEY=gk_your_api_key_here
```

## Usage

```bash
# Create an approval and wait for decision
okrunit request "Deploy v2.3 to production" --priority high --wait

# List pending approvals
okrunit list --status pending

# Approve a request
okrunit approve abc-123 --comment "Looks good"

# Reject a request
okrunit reject abc-123 --comment "Missing tests"

# Get details
okrunit get abc-123

# Wait for a specific approval
okrunit wait abc-123 --timeout 600

# Add a comment
okrunit comment abc-123 "Ready for review"

# List comments
okrunit comments abc-123

# JSON output
okrunit list --format json
```

## Exit Codes

- `0` — success (or approval approved when using `--wait`)
- `1` — error (or approval rejected/cancelled/expired when using `--wait`)

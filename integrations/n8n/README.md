# n8n-nodes-gatekeeper

n8n community node for [Gatekeeper](https://github.com/your-org/gatekeeper) — a human-in-the-loop approval gateway for AI agents and automation platforms.

## Installation

### Community Node (recommended)

1. In n8n, go to **Settings > Community Nodes**
2. Enter `n8n-nodes-gatekeeper`
3. Click **Install**

### Manual Installation

```bash
cd ~/.n8n
npm install n8n-nodes-gatekeeper
```

## Credentials

1. In Gatekeeper, go to **Connections** and create a new API connection
2. Copy the API key (shown only once)
3. In n8n, create a new **Gatekeeper API** credential with:
   - **API Key**: Your `gk_...` key
   - **Base URL**: Your Gatekeeper instance URL

## Operations

### Approval

| Operation | Description |
|-----------|-------------|
| **Create** | Submit a new approval request for human review |
| **Get** | Fetch an approval request by ID |
| **List** | List/search approval requests with filters |

### Comment

| Operation | Description |
|-----------|-------------|
| **Add** | Add a comment to an approval request |
| **List** | List all comments on an approval request |

### Trigger

| Trigger | Description |
|---------|-------------|
| **Approval Decided** | Fires when an approval is approved or rejected (polling) |

## Development

```bash
cd integrations/n8n
npm install
npm run build

# Link to local n8n for testing
npm link
cd ~/.n8n
npm link n8n-nodes-gatekeeper
# Restart n8n
```

## Publishing

```bash
npm publish
```

Then submit for verification at the [n8n Creator Portal](https://creators.n8n.io).

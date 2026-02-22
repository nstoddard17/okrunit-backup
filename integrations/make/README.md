# Gatekeeper Make (Integromat) Integration

Native Make integration for the [Gatekeeper](https://github.com/your-org/gatekeeper) human-in-the-loop approval gateway.

## Features

### Triggers

- **Approval Decided** — Fires when an approval request is approved or rejected. Supports filtering by decision type and priority.

### Actions

- **Create Approval Request** — Submit a new approval request for human review with title, priority, description, metadata, and more.
- **Get Approval Request** — Fetch a single approval by its UUID.
- **Add Comment** — Add a comment to an existing approval request.

### Searches

- **List Approvals** — Search approval requests with status, priority, and full-text filters.

## Setup

### Prerequisites

- A running Gatekeeper instance with an API key
- A [Make Developer](https://www.make.com/en/developer) account

### Installation

1. Go to the [Make Developer Portal](https://www.make.com/en/developer)
2. Create a new app or import from these JSON files
3. Import each file into the appropriate section:
   - `base.json` → App settings
   - `connections/api_key.json` → Connections
   - `rpcs/check_auth.json` → RPCs
   - `modules/*.json` → Modules

### Configuration

When adding the Gatekeeper connection in Make:

- **API Key**: Your Gatekeeper API key (starts with `gk_`)
- **Gatekeeper URL**: The base URL of your Gatekeeper instance

## Project Structure

```
make/
├── base.json                    # App metadata and default headers
├── connections/
│   └── api_key.json             # Connection definition with auth test
├── rpcs/
│   └── check_auth.json          # Remote procedure call for auth validation
├── modules/
│   ├── create_approval.json     # Create Approval action
│   ├── get_approval.json        # Get Approval action
│   ├── list_approvals.json      # List/Search Approvals
│   ├── add_comment.json         # Add Comment action
│   └── approval_decided.json    # Polling trigger for decisions
└── README.md
```

## API Endpoints Used

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Create Approval | POST | `/api/v1/approvals` |
| Get Approval | GET | `/api/v1/approvals/:id` |
| List Approvals | GET | `/api/v1/approvals` |
| Add Comment | POST | `/api/v1/approvals/:id/comments` |
| Auth Test | GET | `/api/v1/approvals?page_size=1` |

## Authentication

The integration uses API Key authentication. The key is sent as a Bearer token in the `Authorization` header on every request. Sensitive headers are automatically sanitized in Make's request logs.

## Testing

1. Import the JSON files into the Make Developer Portal
2. Create a connection using your Gatekeeper API key and URL
3. Test each module in a scenario:
   - Create an approval, verify it appears in the Gatekeeper dashboard
   - Get the approval by ID, verify all fields
   - List approvals with filters, verify results
   - Add a comment, verify it appears
   - Set up the trigger, approve/reject via dashboard, verify the trigger fires

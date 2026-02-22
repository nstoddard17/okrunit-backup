# Gatekeeper Zapier Integration

Native Zapier integration for the [Gatekeeper](https://github.com/your-org/gatekeeper) human-in-the-loop approval gateway.

## Features

### Triggers

- **Approval Decided** — Fires when an approval request is approved or rejected. Supports filtering by decision type and priority.

### Actions (Creates)

- **Create Approval Request** — Submit a new approval request for human review with title, priority, description, metadata, and more.
- **Add Comment** — Add a comment to an existing approval request.

### Searches

- **Get Approval Request** — Fetch a single approval by its UUID.
- **Find Approvals** — Search approval requests with status, priority, and full-text filters.

## Setup

### Prerequisites

- A running Gatekeeper instance with an API key
- [Zapier CLI](https://github.com/zapier/zapier-platform/tree/main/packages/cli) installed globally: `npm install -g zapier-platform-cli`
- Node.js 18+

### Installation

```bash
cd integrations/zapier
npm install
```

### Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```
BASE_URL=http://localhost:3000
API_KEY=gk_your_api_key_here
```

### Running Tests

```bash
npm test
# or
zapier test
```

### Validation

Check that the integration meets Zapier's requirements:

```bash
zapier validate
```

### Local Development

1. Start your Gatekeeper dev server: `npm run dev` (from the project root)
2. Create a test connection in the Gatekeeper dashboard to get an API key
3. Run tests: `npm test`
4. Test interactively: `zapier invoke trigger approval_decided`

### Publishing

```bash
# Login to Zapier
zapier login

# Register the integration (first time only)
zapier register "Gatekeeper"

# Push to Zapier
zapier push
```

## Authentication

The integration uses API Key authentication:

- **API Key**: Your Gatekeeper API key (starts with `gk_`)
- **Gatekeeper URL**: The base URL of your Gatekeeper instance

The API key is sent as a Bearer token in the `Authorization` header on every request.

## Project Structure

```
zapier/
├── package.json           # Dependencies and scripts
├── index.js               # App definition (wires everything together)
├── authentication.js      # Auth config, test, and middleware
├── .env.example           # Environment variable template
├── creates/
│   ├── create_approval.js # Create Approval action
│   └── add_comment.js     # Add Comment action
├── triggers/
│   └── approval_decided.js # Polling trigger for decisions
├── searches/
│   ├── get_approval.js    # Get single approval
│   └── list_approvals.js  # Search/list approvals
└── test/
    ├── authentication.test.js
    ├── creates.test.js
    ├── triggers.test.js
    └── searches.test.js
```

## API Endpoints Used

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Create Approval | POST | `/api/v1/approvals` |
| Get Approval | GET | `/api/v1/approvals/:id` |
| List Approvals | GET | `/api/v1/approvals` |
| Add Comment | POST | `/api/v1/approvals/:id/comments` |
| Auth Test | GET | `/api/v1/approvals?page_size=1` |

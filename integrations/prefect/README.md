# OKRunit Prefect Integration

Prefect tasks and flows for [OKRunit](https://okrunit.com) human-in-the-loop approval gates.

## Installation

```bash
pip install prefect-okrunit
```

## CLI Setup

```bash
# Store your API key as a Prefect secret block
prefect block register -m prefect.blocks.system
prefect secret create okrunit-api-key --value "gk_..."

# Or set via environment variable
export OKRUNIT_API_KEY="gk_..."
```

## CLI Usage

### Run the Approval Gate Flow

```bash
# Create an approval and wait for a decision
prefect flow-run create okrunit-approval-gate \
  --param title="Deploy v2.3.1 to production" \
  --param priority=high \
  --param description="Release includes new payment flow" \
  --param timeout_seconds=1800
```

### Deploy as a Scheduled Flow

```bash
# Deploy the approval gate flow
prefect deploy integrations/prefect/flows.py:approval_gate \
  --name "production-deploy-gate" \
  --pool default-agent-pool

# Trigger a deployment run
prefect deployment run okrunit-approval-gate/production-deploy-gate \
  --param title="Deploy v2.3.1" \
  --param priority=critical
```

### Monitor

```bash
# List recent flow runs
prefect flow-run ls --flow-name okrunit-approval-gate

# View a specific run
prefect flow-run inspect <flow-run-id>

# Stream logs
prefect flow-run logs <flow-run-id> --follow
```

## Platform Behavior

- **Source:** Automatically set to `"prefect"` on all approval creation requests.
- **Idempotency key:** Auto-generated with the format `prefect-{timestamp}-{random}` (e.g., `prefect-1711100000-a3f8b2c1`).
- **Default title:** If no title is provided, defaults to `"Approval request from prefect"`.
- **Priority validation:** Must be one of `low`, `medium`, `high`, or `critical`.
- **Triggers not yet implemented:** The canonical `newApproval` and `approvalDecided` triggers are not yet implemented in this integration. Only task-based actions and searches are available.

## Tasks

The following tasks map to the canonical spec module types defined in `integrations/shared/module-specs.md`:

| Task | Canonical Module | Type | Description |
|------|-----------------|------|-------------|
| `create_approval` | requestApproval | Action | Create a new approval request (auto-sets `source: "prefect"` and idempotency key) |
| `get_approval` | getApproval | Search | Fetch an approval request by ID |
| `list_approvals` | listApprovals | Search | Search/list approval requests with filters |
| `add_comment` | addComment | Action | Add a comment to an approval request |

## Flows

| Flow | Description |
|------|-------------|
| `approval_gate` | Create approval + poll until decided (approve/reject/timeout) |

## Usage in Code

```python
from prefect_okrunit import approval_gate, create_approval, get_approval
from prefect import flow

@flow
async def deploy_pipeline():
    # Gate deployment on human approval
    result = await approval_gate(
        title="Deploy v2.3.1 to production",
        priority="high",
        description="Release includes new payment flow",
        timeout_seconds=1800,
    )

    # result contains the full approval object
    print(f"Approved by {result['decided_by_name']}")

    # Continue with deployment...
```

### Individual Tasks

```python
from prefect_okrunit import create_approval, get_approval, list_approvals, add_comment

@flow
async def my_flow():
    # Create an approval
    approval = await create_approval(
        title="Delete old records",
        priority="critical",
    )

    # Check status
    status = await get_approval(approval["id"])

    # List pending approvals
    pending = await list_approvals(status="pending", priority="high")

    # Add a comment
    await add_comment(approval["id"], comment="Automated check passed")
```

## Authentication

Tasks resolve the API key in this order:
1. Explicit `api_key` parameter
2. Prefect Secret block named `okrunit-api-key`

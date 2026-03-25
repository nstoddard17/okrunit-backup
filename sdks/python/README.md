# okrunit

Official Python SDK for the OKRunit approval gateway API.

## Installation

```bash
pip install okrunit
```

## Quick Start

### Synchronous

```python
from okrunit import OKRunitClient, CreateApprovalParams

client = OKRunitClient(api_key="gk_your_api_key_here")

# Create an approval request
approval = client.create_approval(CreateApprovalParams(
    title="Deploy v2.3 to production",
    priority="high",
    callback_url="https://your-app.com/webhook",
    metadata={"version": "2.3", "environment": "production"},
))

# Wait for a decision (blocks until resolved or timeout)
decided = client.wait_for_decision(approval.id, timeout=600)
print(f"Decision: {decided.status}")

# List pending approvals
pending = client.list_approvals(ListApprovalsParams(status="pending"))

# Add a comment
client.add_comment(approval.id, "Deployment pipeline is ready")
```

### Asynchronous

```python
import asyncio
from okrunit import AsyncOKRunitClient, CreateApprovalParams

async def main():
    async with AsyncOKRunitClient(api_key="gk_your_api_key_here") as client:
        approval = await client.create_approval(CreateApprovalParams(
            title="Deploy v2.3 to production",
            priority="high",
        ))
        decided = await client.wait_for_decision(approval.id)
        print(f"Decision: {decided.status}")

asyncio.run(main())
```

## API Reference

### `OKRunitClient(api_key, base_url="https://okrunit.com", timeout=30.0)`

| Method | Description |
|---|---|
| `create_approval(params)` | Create a new approval request |
| `get_approval(id)` | Get a single approval by ID |
| `list_approvals(params?)` | List approvals with optional filters |
| `respond_to_approval(id, params)` | Approve or reject an approval |
| `cancel_approval(id)` | Cancel a pending approval |
| `batch_respond(params)` | Batch approve/reject multiple approvals |
| `wait_for_decision(id, timeout?, poll_interval?)` | Poll until terminal state |
| `list_comments(approval_id)` | List comments on an approval |
| `add_comment(approval_id, body)` | Add a comment to an approval |

`AsyncOKRunitClient` has the same methods, all returning coroutines.

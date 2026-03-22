"""OKRunit Prefect tasks for human-in-the-loop approval gates."""

import time
import random
import string

import httpx
from prefect import task
from prefect.blocks.system import Secret


def _random_suffix(length: int = 8) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))


def _headers(api_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


async def _resolve_api_key(api_key: str | None) -> str:
    if api_key:
        return api_key
    secret = await Secret.load("okrunit-api-key")
    return secret.get()


VALID_PRIORITIES = {"low", "medium", "high", "critical"}


@task(name="okrunit-create-approval", retries=2, retry_delay_seconds=5)
async def create_approval(
    title: str | None = None,
    priority: str = "medium",
    description: str | None = None,
    metadata: dict | None = None,
    callback_url: str | None = None,
    api_key: str | None = None,
    api_url: str = "https://app.okrunit.com",
) -> dict:
    """Create an OKRunit approval request.

    Automatically sets source to 'prefect' and generates an idempotency key.
    If title is empty or None, defaults to "Approval request from prefect".
    """
    if priority not in VALID_PRIORITIES:
        raise ValueError(
            f"Invalid priority '{priority}'. Must be one of: {', '.join(sorted(VALID_PRIORITIES))}"
        )

    api_key = await _resolve_api_key(api_key)
    idempotency_key = f"prefect-{int(time.time())}-{_random_suffix()}"

    resolved_title = title if title else "Approval request from prefect"

    body: dict = {
        "title": resolved_title,
        "priority": priority,
        "source": "prefect",
        "idempotency_key": idempotency_key,
    }
    if description:
        body["description"] = description
    if metadata:
        body["metadata"] = metadata
    if callback_url:
        body["callback_url"] = callback_url

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{api_url}/api/v1/approvals",
            json=body,
            headers=_headers(api_key),
        )
        resp.raise_for_status()
        return resp.json()


@task(name="okrunit-get-approval")
async def get_approval(
    approval_id: str,
    api_key: str | None = None,
    api_url: str = "https://app.okrunit.com",
) -> dict:
    """Fetch a single approval request by ID."""
    api_key = await _resolve_api_key(api_key)

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{api_url}/api/v1/approvals/{approval_id}",
            headers=_headers(api_key),
        )
        resp.raise_for_status()
        return resp.json()


@task(name="okrunit-list-approvals")
async def list_approvals(
    status: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    limit: int = 25,
    api_key: str | None = None,
    api_url: str = "https://app.okrunit.com",
) -> dict:
    """Search and list approval requests with filters."""
    api_key = await _resolve_api_key(api_key)

    params: dict[str, str] = {"page_size": str(limit)}
    if status:
        params["status"] = status
    if priority:
        params["priority"] = priority
    if search:
        params["search"] = search

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{api_url}/api/v1/approvals",
            params=params,
            headers=_headers(api_key),
        )
        resp.raise_for_status()
        return resp.json()


@task(name="okrunit-add-comment")
async def add_comment(
    approval_id: str,
    comment: str,
    api_key: str | None = None,
    api_url: str = "https://app.okrunit.com",
) -> dict:
    """Add a comment to an approval request."""
    api_key = await _resolve_api_key(api_key)

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{api_url}/api/v1/approvals/{approval_id}/comments",
            json={"body": comment},
            headers=_headers(api_key),
        )
        resp.raise_for_status()
        return resp.json()


VALID_STATUSES = {"pending", "approved", "rejected", "cancelled", "expired"}


@task(name="okrunit-poll-new-approvals")
async def poll_new_approvals(
    cursor: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    limit: int = 25,
    api_key: str | None = None,
    api_url: str = "https://app.okrunit.com",
) -> list[dict]:
    """Poll for new approval requests created after the cursor timestamp.

    Returns approvals sorted by created_at descending, filtered to only those
    created after the given cursor. Deduplication is by approval id.

    Args:
        cursor: ISO 8601 timestamp. Only approvals created after this time are returned.
        status: Optional status filter (pending, approved, rejected, cancelled, expired).
        priority: Optional priority filter (low, medium, high, critical).
        limit: Maximum number of results to return.
        api_key: OKRunit API key. Falls back to Prefect Secret block 'okrunit-api-key'.
        api_url: Base URL for the OKRunit API.

    Returns:
        List of approval dicts created after the cursor, sorted by created_at desc.
    """
    if status and status not in VALID_STATUSES:
        raise ValueError(
            f"Invalid status '{status}'. Must be one of: {', '.join(sorted(VALID_STATUSES))}"
        )
    if priority and priority not in VALID_PRIORITIES:
        raise ValueError(
            f"Invalid priority '{priority}'. Must be one of: {', '.join(sorted(VALID_PRIORITIES))}"
        )

    api_key = await _resolve_api_key(api_key)

    params: dict[str, str] = {"page_size": str(limit)}
    if status:
        params["status"] = status
    if priority:
        params["priority"] = priority

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{api_url}/api/v1/approvals",
            params=params,
            headers=_headers(api_key),
        )
        resp.raise_for_status()
        data = resp.json()

    approvals = data.get("data", data) if isinstance(data, dict) else data

    if cursor:
        approvals = [a for a in approvals if a.get("created_at", "") > cursor]

    seen: set[str] = set()
    deduped: list[dict] = []
    for a in approvals:
        aid = a.get("id")
        if aid and aid not in seen:
            seen.add(aid)
            deduped.append(a)

    deduped.sort(key=lambda a: a.get("created_at", ""), reverse=True)
    return deduped


@task(name="okrunit-poll-decided-approvals")
async def poll_decided_approvals(
    cursor: str | None = None,
    decision: str | None = None,
    priority: str | None = None,
    limit: int = 25,
    api_key: str | None = None,
    api_url: str = "https://app.okrunit.com",
) -> list[dict]:
    """Poll for approvals that have been approved or rejected after the cursor timestamp.

    Returns decided approvals sorted by updated_at descending, filtered to only
    those updated after the given cursor. Deduplication is by approval id.

    Args:
        cursor: ISO 8601 timestamp. Only approvals updated after this time are returned.
        decision: Optional decision filter: 'approved', 'rejected', or None for both.
        priority: Optional priority filter (low, medium, high, critical).
        limit: Maximum number of results to return.
        api_key: OKRunit API key. Falls back to Prefect Secret block 'okrunit-api-key'.
        api_url: Base URL for the OKRunit API.

    Returns:
        List of decided approval dicts updated after the cursor, sorted by updated_at desc.
    """
    valid_decisions = {"approved", "rejected"}
    if decision and decision not in valid_decisions:
        raise ValueError(
            f"Invalid decision '{decision}'. Must be one of: {', '.join(sorted(valid_decisions))}"
        )
    if priority and priority not in VALID_PRIORITIES:
        raise ValueError(
            f"Invalid priority '{priority}'. Must be one of: {', '.join(sorted(VALID_PRIORITIES))}"
        )

    api_key = await _resolve_api_key(api_key)

    # Fetch both approved and rejected, or just the specified decision
    statuses = [decision] if decision else ["approved", "rejected"]
    all_approvals: list[dict] = []

    async with httpx.AsyncClient() as client:
        for s in statuses:
            params: dict[str, str] = {
                "page_size": str(limit),
                "status": s,
            }
            if priority:
                params["priority"] = priority

            resp = await client.get(
                f"{api_url}/api/v1/approvals",
                params=params,
                headers=_headers(api_key),
            )
            resp.raise_for_status()
            data = resp.json()
            items = data.get("data", data) if isinstance(data, dict) else data
            all_approvals.extend(items)

    if cursor:
        all_approvals = [
            a for a in all_approvals if a.get("updated_at", "") > cursor
        ]

    seen: set[str] = set()
    deduped: list[dict] = []
    for a in all_approvals:
        aid = a.get("id")
        if aid and aid not in seen:
            seen.add(aid)
            deduped.append(a)

    deduped.sort(key=lambda a: a.get("updated_at", ""), reverse=True)
    return deduped

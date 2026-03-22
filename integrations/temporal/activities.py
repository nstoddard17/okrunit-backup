"""OKRunit Temporal activities for human-in-the-loop approval gates."""

import random
import string
import time
from dataclasses import dataclass

import httpx
from temporalio import activity


def _random_suffix(length: int = 8) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))


@dataclass
class OKRunitConfig:
    """Configuration for connecting to the OKRunit API."""

    api_key: str
    api_url: str = "https://app.okrunit.com"


def _headers(config: OKRunitConfig) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {config.api_key}",
        "Content-Type": "application/json",
    }


@activity.defn
async def create_approval(
    config: OKRunitConfig,
    title: str,
    priority: str = "medium",
    description: str | None = None,
    metadata: dict | None = None,
    callback_url: str | None = None,
) -> dict:
    """Create an approval request in OKRunit.

    Automatically sets source to 'temporal' and generates an idempotency key.
    If title is empty or None, defaults to 'Approval request from temporal'.
    Priority must be one of: low, medium, high, critical.
    """
    if not title:
        title = "Approval request from temporal"

    valid_priorities = ("low", "medium", "high", "critical")
    if priority not in valid_priorities:
        raise ValueError(
            f"Invalid priority '{priority}'. Must be one of: {', '.join(valid_priorities)}"
        )

    idempotency_key = f"temporal-{int(time.time())}-{_random_suffix()}"

    body: dict = {
        "title": title,
        "priority": priority,
        "source": "temporal",
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
            f"{config.api_url}/api/v1/approvals",
            json=body,
            headers=_headers(config),
        )
        resp.raise_for_status()
        return resp.json()


@activity.defn
async def get_approval(config: OKRunitConfig, approval_id: str) -> dict:
    """Fetch a single approval request by ID."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{config.api_url}/api/v1/approvals/{approval_id}",
            headers=_headers(config),
        )
        resp.raise_for_status()
        return resp.json()


@activity.defn
async def list_approvals(
    config: OKRunitConfig,
    status: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    limit: int = 25,
) -> dict:
    """Search and list approval requests with filters."""
    params: dict[str, str] = {"page_size": str(limit)}
    if status:
        params["status"] = status
    if priority:
        params["priority"] = priority
    if search:
        params["search"] = search

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{config.api_url}/api/v1/approvals",
            params=params,
            headers=_headers(config),
        )
        resp.raise_for_status()
        return resp.json()


@activity.defn
async def add_comment(
    config: OKRunitConfig,
    approval_id: str,
    body: str,
) -> dict:
    """Add a comment to an approval request."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{config.api_url}/api/v1/approvals/{approval_id}/comments",
            json={"body": body},
            headers=_headers(config),
        )
        resp.raise_for_status()
        return resp.json()


@activity.defn
async def poll_new_approvals(
    config: OKRunitConfig,
    cursor: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    limit: int = 25,
) -> dict:
    """Poll for new approval requests since a given cursor timestamp.

    Returns approvals sorted by created_at descending. The cursor is an ISO
    timestamp; only approvals created after this time are returned. The response
    includes a ``new_cursor`` field set to the most recent ``created_at`` value
    so the caller can pass it on the next poll.

    Filters:
        status  - pending, approved, rejected, cancelled, expired (optional)
        priority - low, medium, high, critical (optional)
    """
    params: dict[str, str] = {
        "page_size": str(limit),
        "sort": "created_at",
        "order": "desc",
    }
    if cursor:
        params["created_after"] = cursor
    if status:
        params["status"] = status
    if priority:
        params["priority"] = priority

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{config.api_url}/api/v1/approvals",
            params=params,
            headers=_headers(config),
        )
        resp.raise_for_status()
        data = resp.json()

    approvals = data.get("data", data if isinstance(data, list) else [])

    # Deduplicate by id (keep first occurrence, i.e. most recent)
    seen: set[str] = set()
    unique: list[dict] = []
    for item in approvals:
        aid = item["id"]
        if aid not in seen:
            seen.add(aid)
            unique.append(item)

    new_cursor = unique[0]["created_at"] if unique else cursor

    return {
        "approvals": unique,
        "new_cursor": new_cursor,
        "count": len(unique),
    }


@activity.defn
async def poll_decided_approvals(
    config: OKRunitConfig,
    cursor: str | None = None,
    decision: str | None = None,
    priority: str | None = None,
    limit: int = 25,
) -> dict:
    """Poll for approvals that have been approved or rejected since a cursor.

    Returns decided approvals sorted by updated_at descending. The cursor is an
    ISO timestamp; only approvals updated after this time are returned.

    Filters:
        decision - 'approved', 'rejected', or None for both (default: both)
        priority - low, medium, high, critical (optional)
    """
    valid_decisions = ("approved", "rejected")

    # Build status filter based on decision parameter
    if decision:
        if decision not in valid_decisions:
            raise ValueError(
                f"Invalid decision '{decision}'. Must be one of: {', '.join(valid_decisions)}"
            )
        status_filter = decision
    else:
        status_filter = "approved,rejected"

    params: dict[str, str] = {
        "page_size": str(limit),
        "status": status_filter,
        "sort": "updated_at",
        "order": "desc",
    }
    if cursor:
        params["updated_after"] = cursor
    if priority:
        params["priority"] = priority

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{config.api_url}/api/v1/approvals",
            params=params,
            headers=_headers(config),
        )
        resp.raise_for_status()
        data = resp.json()

    approvals = data.get("data", data if isinstance(data, list) else [])

    # Deduplicate by id (keep first occurrence, i.e. most recent)
    seen: set[str] = set()
    unique: list[dict] = []
    for item in approvals:
        aid = item["id"]
        if aid not in seen:
            seen.add(aid)
            unique.append(item)

    new_cursor = unique[0]["updated_at"] if unique else cursor

    return {
        "approvals": unique,
        "new_cursor": new_cursor,
        "count": len(unique),
    }

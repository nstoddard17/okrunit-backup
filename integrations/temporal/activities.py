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

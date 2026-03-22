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

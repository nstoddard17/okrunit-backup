"""OKRunit Dagster resource for human-in-the-loop approval gates."""

import random
import string
import time

import httpx
from dagster import ConfigurableResource


def _random_suffix(length: int = 8) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))


class OKRunitResource(ConfigurableResource):
    """OKRunit API resource for human-in-the-loop approval gates.

    Configure in your Definitions:
        Definitions(
            resources={"okrunit": OKRunitResource(
                api_key="gk_...",
                api_url="https://app.okrunit.com",
            )},
        )
    """

    api_key: str
    api_url: str = "https://app.okrunit.com"

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _base_url(self) -> str:
        return f"{self.api_url}/api/v1"

    _VALID_PRIORITIES = ("low", "medium", "high", "critical")

    def create_approval(
        self,
        title: str | None = None,
        priority: str = "medium",
        description: str | None = None,
        metadata: dict | None = None,
        callback_url: str | None = None,
    ) -> dict:
        """Create an approval request. Auto-sets source and idempotency key."""
        if not title:
            title = "Approval request from dagster"

        if priority not in self._VALID_PRIORITIES:
            raise ValueError(
                f"Invalid priority '{priority}'. Must be one of: {', '.join(self._VALID_PRIORITIES)}"
            )

        idempotency_key = f"dagster-{int(time.time())}-{_random_suffix()}"

        body: dict = {
            "title": title,
            "priority": priority,
            "source": "dagster",
            "idempotency_key": idempotency_key,
        }
        if description:
            body["description"] = description
        if metadata:
            body["metadata"] = metadata
        if callback_url:
            body["callback_url"] = callback_url

        resp = httpx.post(
            f"{self._base_url()}/approvals",
            json=body,
            headers=self._headers(),
        )
        resp.raise_for_status()
        return resp.json()

    def get_approval(self, approval_id: str) -> dict:
        """Fetch a single approval request by ID."""
        resp = httpx.get(
            f"{self._base_url()}/approvals/{approval_id}",
            headers=self._headers(),
        )
        resp.raise_for_status()
        return resp.json()

    def list_approvals(
        self,
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

        resp = httpx.get(
            f"{self._base_url()}/approvals",
            params=params,
            headers=self._headers(),
        )
        resp.raise_for_status()
        return resp.json()

    def add_comment(self, approval_id: str, body: str) -> dict:
        """Add a comment to an approval request."""
        resp = httpx.post(
            f"{self._base_url()}/approvals/{approval_id}/comments",
            json={"body": body},
            headers=self._headers(),
        )
        resp.raise_for_status()
        return resp.json()

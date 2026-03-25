"""OKRunit Python SDK -- Sync and Async Clients."""

from __future__ import annotations

import asyncio
import time
from typing import Any

import httpx

from okrunit.types import (
    Approval,
    Comment,
    CreateApprovalParams,
    ListApprovalsParams,
    PaginatedResponse,
    RespondApprovalParams,
    BatchApprovalParams,
)


class OKRunitError(Exception):
    """Error returned by the OKRunit API."""

    def __init__(self, status_code: int, message: str, code: str | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.code = code


# ---------------------------------------------------------------------------
# Sync Client
# ---------------------------------------------------------------------------


class OKRunitClient:
    """Synchronous OKRunit API client."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://okrunit.com",
        timeout: float = 30.0,
    ):
        if not api_key:
            raise ValueError("api_key is required")
        self._base_url = base_url.rstrip("/")
        self._client = httpx.Client(
            base_url=f"{self._base_url}/api/v1",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "okrunit-python/0.1.0",
            },
            timeout=timeout,
        )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> OKRunitClient:
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()

    def _handle_response(self, response: httpx.Response) -> Any:
        if not response.is_success:
            body = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
            raise OKRunitError(
                response.status_code,
                body.get("error", response.reason_phrase),
                body.get("code"),
            )
        return response.json()

    # ---- Approvals ---------------------------------------------------------

    def create_approval(self, params: CreateApprovalParams) -> Approval:
        resp = self._client.post("/approvals", json=params.to_dict())
        data = self._handle_response(resp)
        return Approval.from_dict(data["data"])

    def get_approval(self, approval_id: str) -> Approval:
        resp = self._client.get(f"/approvals/{approval_id}")
        data = self._handle_response(resp)
        return Approval.from_dict(data["data"])

    def list_approvals(self, params: ListApprovalsParams | None = None) -> PaginatedResponse:
        query = params.to_params() if params else {}
        resp = self._client.get("/approvals", params=query)
        data = self._handle_response(resp)
        return PaginatedResponse.from_dict(data)

    def respond_to_approval(self, approval_id: str, params: RespondApprovalParams) -> Approval:
        resp = self._client.patch(f"/approvals/{approval_id}", json=params.to_dict())
        data = self._handle_response(resp)
        return Approval.from_dict(data["data"])

    def cancel_approval(self, approval_id: str) -> Approval:
        resp = self._client.delete(f"/approvals/{approval_id}")
        data = self._handle_response(resp)
        return Approval.from_dict(data["data"])

    def batch_respond(self, params: BatchApprovalParams) -> dict[str, Any]:
        resp = self._client.post("/approvals/batch", json=params.to_dict())
        return self._handle_response(resp)

    def wait_for_decision(
        self,
        approval_id: str,
        timeout: float = 300.0,
        poll_interval: float = 2.0,
    ) -> Approval:
        """Poll until the approval reaches a terminal state or timeout."""
        terminal = {"approved", "rejected", "cancelled", "expired"}
        deadline = time.monotonic() + timeout

        while time.monotonic() < deadline:
            approval = self.get_approval(approval_id)
            if approval.status in terminal:
                return approval
            time.sleep(poll_interval)

        raise OKRunitError(408, "Timed out waiting for approval decision", "TIMEOUT")

    # ---- Comments ----------------------------------------------------------

    def list_comments(self, approval_id: str) -> list[Comment]:
        resp = self._client.get(f"/approvals/{approval_id}/comments")
        data = self._handle_response(resp)
        return [Comment.from_dict(c) for c in data["data"]]

    def add_comment(self, approval_id: str, body: str) -> Comment:
        resp = self._client.post(f"/approvals/{approval_id}/comments", json={"body": body})
        data = self._handle_response(resp)
        return Comment.from_dict(data["data"])


# ---------------------------------------------------------------------------
# Async Client
# ---------------------------------------------------------------------------


class AsyncOKRunitClient:
    """Asynchronous OKRunit API client."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://okrunit.com",
        timeout: float = 30.0,
    ):
        if not api_key:
            raise ValueError("api_key is required")
        self._base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(
            base_url=f"{self._base_url}/api/v1",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "okrunit-python/0.1.0",
            },
            timeout=timeout,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> AsyncOKRunitClient:
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.close()

    def _handle_response(self, response: httpx.Response) -> Any:
        if not response.is_success:
            body = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
            raise OKRunitError(
                response.status_code,
                body.get("error", response.reason_phrase),
                body.get("code"),
            )
        return response.json()

    # ---- Approvals ---------------------------------------------------------

    async def create_approval(self, params: CreateApprovalParams) -> Approval:
        resp = await self._client.post("/approvals", json=params.to_dict())
        data = self._handle_response(resp)
        return Approval.from_dict(data["data"])

    async def get_approval(self, approval_id: str) -> Approval:
        resp = await self._client.get(f"/approvals/{approval_id}")
        data = self._handle_response(resp)
        return Approval.from_dict(data["data"])

    async def list_approvals(self, params: ListApprovalsParams | None = None) -> PaginatedResponse:
        query = params.to_params() if params else {}
        resp = await self._client.get("/approvals", params=query)
        data = self._handle_response(resp)
        return PaginatedResponse.from_dict(data)

    async def respond_to_approval(self, approval_id: str, params: RespondApprovalParams) -> Approval:
        resp = await self._client.patch(f"/approvals/{approval_id}", json=params.to_dict())
        data = self._handle_response(resp)
        return Approval.from_dict(data["data"])

    async def cancel_approval(self, approval_id: str) -> Approval:
        resp = await self._client.delete(f"/approvals/{approval_id}")
        data = self._handle_response(resp)
        return Approval.from_dict(data["data"])

    async def batch_respond(self, params: BatchApprovalParams) -> dict[str, Any]:
        resp = await self._client.post("/approvals/batch", json=params.to_dict())
        return self._handle_response(resp)

    async def wait_for_decision(
        self,
        approval_id: str,
        timeout: float = 300.0,
        poll_interval: float = 2.0,
    ) -> Approval:
        """Poll until the approval reaches a terminal state or timeout."""
        terminal = {"approved", "rejected", "cancelled", "expired"}
        deadline = asyncio.get_event_loop().time() + timeout

        while asyncio.get_event_loop().time() < deadline:
            approval = await self.get_approval(approval_id)
            if approval.status in terminal:
                return approval
            await asyncio.sleep(poll_interval)

        raise OKRunitError(408, "Timed out waiting for approval decision", "TIMEOUT")

    # ---- Comments ----------------------------------------------------------

    async def list_comments(self, approval_id: str) -> list[Comment]:
        resp = await self._client.get(f"/approvals/{approval_id}/comments")
        data = self._handle_response(resp)
        return [Comment.from_dict(c) for c in data["data"]]

    async def add_comment(self, approval_id: str, body: str) -> Comment:
        resp = await self._client.post(f"/approvals/{approval_id}/comments", json={"body": body})
        data = self._handle_response(resp)
        return Comment.from_dict(data["data"])

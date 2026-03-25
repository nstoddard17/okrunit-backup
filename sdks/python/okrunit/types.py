"""OKRunit Python SDK -- Type definitions."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal


ApprovalStatus = Literal["pending", "approved", "rejected", "cancelled", "expired"]
ApprovalPriority = Literal["low", "medium", "high", "critical"]
DecisionSource = Literal[
    "dashboard", "email", "slack", "teams", "telegram", "discord", "push", "api", "auto_rule", "batch"
]


@dataclass
class CreateApprovalParams:
    title: str
    description: str | None = None
    action_type: str | None = None
    priority: ApprovalPriority | None = None
    callback_url: str | None = None
    callback_headers: dict[str, str] | None = None
    metadata: dict[str, Any] | None = None
    context_html: str | None = None
    expires_at: str | None = None
    idempotency_key: str | None = None
    required_approvals: int | None = None
    assigned_approvers: list[str] | None = None
    assigned_team_id: str | None = None
    source: str | None = None
    source_id: str | None = None
    is_sequential: bool | None = None
    auto_action: Literal["approve", "reject"] | None = None
    auto_action_after_minutes: int | None = None
    require_rejection_reason: bool | None = None

    def to_dict(self) -> dict[str, Any]:
        return {k: v for k, v in self.__dict__.items() if v is not None}


@dataclass
class RespondApprovalParams:
    decision: Literal["approve", "reject"]
    comment: str | None = None
    source: DecisionSource | None = None
    scheduled_execution_at: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {k: v for k, v in self.__dict__.items() if v is not None}


@dataclass
class BatchApprovalParams:
    ids: list[str]
    decision: Literal["approve", "reject"]
    comment: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {k: v for k, v in self.__dict__.items() if v is not None}


@dataclass
class ListApprovalsParams:
    status: ApprovalStatus | None = None
    priority: ApprovalPriority | None = None
    search: str | None = None
    page: int | None = None
    page_size: int | None = None

    def to_params(self) -> dict[str, str]:
        result: dict[str, str] = {}
        if self.status:
            result["status"] = self.status
        if self.priority:
            result["priority"] = self.priority
        if self.search:
            result["search"] = self.search
        if self.page is not None:
            result["page"] = str(self.page)
        if self.page_size is not None:
            result["page_size"] = str(self.page_size)
        return result


@dataclass
class Approval:
    id: str
    org_id: str
    title: str
    action_type: str
    priority: ApprovalPriority
    status: ApprovalStatus
    required_approvals: int
    current_approvals: int
    auto_approved: bool
    created_at: str
    updated_at: str
    connection_id: str | None = None
    flow_id: str | None = None
    source: str | None = None
    description: str | None = None
    callback_url: str | None = None
    callback_headers: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None
    context_html: str | None = None
    decided_by: str | None = None
    decided_at: str | None = None
    decision_comment: str | None = None
    decision_source: DecisionSource | None = None
    expires_at: str | None = None
    idempotency_key: str | None = None
    risk_score: float | None = None
    risk_level: str | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Approval:
        known_fields = {f.name for f in cls.__dataclass_fields__.values()}
        filtered = {k: v for k, v in data.items() if k in known_fields}
        return cls(**filtered)


@dataclass
class Comment:
    id: str
    request_id: str
    body: str
    created_at: str
    user_id: str | None = None
    connection_id: str | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Comment:
        known_fields = {f.name for f in cls.__dataclass_fields__.values()}
        filtered = {k: v for k, v in data.items() if k in known_fields}
        return cls(**filtered)


@dataclass
class PaginatedResponse:
    data: list[Approval]
    total: int
    page: int
    page_size: int

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> PaginatedResponse:
        return cls(
            data=[Approval.from_dict(d) for d in raw["data"]],
            total=raw["total"],
            page=raw["page"],
            page_size=raw["page_size"],
        )

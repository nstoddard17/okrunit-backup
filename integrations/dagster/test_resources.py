"""Tests for OKRunit Dagster resource."""

import re
from unittest.mock import MagicMock, patch

import pytest

from resources import OKRunitResource


@pytest.fixture
def resource():
    return OKRunitResource(api_key="gk_test_key", api_url="https://test.okrunit.com")


@pytest.fixture
def mock_response():
    """Factory for mock httpx responses."""

    def _make(json_data=None, status_code=200):
        resp = MagicMock()
        resp.status_code = status_code
        resp.json.return_value = json_data or {}
        resp.raise_for_status.return_value = None
        return resp

    return _make


@pytest.fixture
def sample_approval():
    return {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Deploy v2.3.1",
        "status": "pending",
        "priority": "high",
        "source": "dagster",
        "created_at": "2026-02-21T10:00:00.000Z",
    }


# ── create_approval ──────────────────────────────────────────────────────────


def test_create_approval_sets_source_to_dagster(
    resource, mock_response, sample_approval
):
    """create_approval must set source to 'dagster'."""
    mock_resp = mock_response(sample_approval)

    with patch("httpx.post", return_value=mock_resp) as mock_post:
        resource.create_approval(title="Test", priority="high")

    sent_body = mock_post.call_args.kwargs.get("json") or mock_post.call_args[1].get(
        "json"
    )
    assert sent_body["source"] == "dagster"


def test_create_approval_generates_idempotency_key(
    resource, mock_response, sample_approval
):
    """Idempotency key must follow format: dagster-{timestamp}-{random}."""
    mock_resp = mock_response(sample_approval)

    with patch("httpx.post", return_value=mock_resp) as mock_post:
        resource.create_approval(title="Test", priority="medium")

    sent_body = mock_post.call_args.kwargs.get("json") or mock_post.call_args[1].get(
        "json"
    )
    key = sent_body["idempotency_key"]
    assert re.match(r"^dagster-\d+-[a-z0-9]{8}$", key), (
        f"Idempotency key '{key}' does not match expected format"
    )


def test_create_approval_default_title_when_empty(
    resource, mock_response, sample_approval
):
    """When title is empty string, defaults to 'Approval request from dagster'."""
    mock_resp = mock_response(sample_approval)

    with patch("httpx.post", return_value=mock_resp) as mock_post:
        resource.create_approval(title="", priority="medium")

    sent_body = mock_post.call_args.kwargs.get("json") or mock_post.call_args[1].get(
        "json"
    )
    assert sent_body["title"] == "Approval request from dagster"


def test_create_approval_default_title_when_none(
    resource, mock_response, sample_approval
):
    """When title is None, defaults to 'Approval request from dagster'."""
    mock_resp = mock_response(sample_approval)

    with patch("httpx.post", return_value=mock_resp) as mock_post:
        resource.create_approval(title=None, priority="medium")

    sent_body = mock_post.call_args.kwargs.get("json") or mock_post.call_args[1].get(
        "json"
    )
    assert sent_body["title"] == "Approval request from dagster"


def test_create_approval_validates_priority_rejects_invalid(resource):
    """Invalid priority values must raise ValueError."""
    with pytest.raises(ValueError, match="Invalid priority 'urgent'"):
        resource.create_approval(title="Test", priority="urgent")


@pytest.mark.parametrize("priority", ["low", "medium", "high", "critical"])
def test_create_approval_accepts_valid_priorities(
    resource, mock_response, sample_approval, priority
):
    """All valid priority values must be accepted."""
    mock_resp = mock_response(sample_approval)

    with patch("httpx.post", return_value=mock_resp) as mock_post:
        resource.create_approval(title="Test", priority=priority)

    sent_body = mock_post.call_args.kwargs.get("json") or mock_post.call_args[1].get(
        "json"
    )
    assert sent_body["priority"] == priority


def test_create_approval_posts_to_correct_endpoint(
    resource, mock_response, sample_approval
):
    """Must POST to {api_url}/api/v1/approvals."""
    mock_resp = mock_response(sample_approval)

    with patch("httpx.post", return_value=mock_resp) as mock_post:
        resource.create_approval(title="Test", priority="medium")

    url = mock_post.call_args.args[0]
    assert url == "https://test.okrunit.com/api/v1/approvals"


def test_create_approval_includes_description_and_metadata(
    resource, mock_response, sample_approval
):
    """description and metadata are included in the body when provided."""
    mock_resp = mock_response(sample_approval)

    with patch("httpx.post", return_value=mock_resp) as mock_post:
        resource.create_approval(
            title="Test",
            priority="medium",
            description="Some context",
            metadata={"repo": "test-repo"},
        )

    sent_body = mock_post.call_args.kwargs.get("json") or mock_post.call_args[1].get(
        "json"
    )
    assert sent_body["description"] == "Some context"
    assert sent_body["metadata"] == {"repo": "test-repo"}


def test_create_approval_passes_callback_url(
    resource, mock_response, sample_approval
):
    """callback_url must be included in the request body when provided."""
    mock_resp = mock_response(sample_approval)

    with patch("httpx.post", return_value=mock_resp) as mock_post:
        resource.create_approval(
            title="Test",
            priority="medium",
            callback_url="https://example.com/callback",
        )

    sent_body = mock_post.call_args.kwargs.get("json") or mock_post.call_args[1].get(
        "json"
    )
    assert sent_body["callback_url"] == "https://example.com/callback"


def test_create_approval_omits_callback_url_when_none(
    resource, mock_response, sample_approval
):
    """callback_url must NOT be in the body when not provided."""
    mock_resp = mock_response(sample_approval)

    with patch("httpx.post", return_value=mock_resp) as mock_post:
        resource.create_approval(title="Test", priority="medium")

    sent_body = mock_post.call_args.kwargs.get("json") or mock_post.call_args[1].get(
        "json"
    )
    assert "callback_url" not in sent_body


# ── get_approval ─────────────────────────────────────────────────────────────


def test_get_approval_calls_correct_endpoint(
    resource, mock_response, sample_approval
):
    """get_approval must GET /api/v1/approvals/{id}."""
    mock_resp = mock_response(sample_approval)
    approval_id = "550e8400-e29b-41d4-a716-446655440000"

    with patch("httpx.get", return_value=mock_resp) as mock_get:
        result = resource.get_approval(approval_id)

    url = mock_get.call_args.args[0]
    assert url == f"https://test.okrunit.com/api/v1/approvals/{approval_id}"
    assert result == sample_approval


def test_get_approval_sends_auth_header(resource, mock_response, sample_approval):
    """get_approval must include the Authorization header."""
    mock_resp = mock_response(sample_approval)

    with patch("httpx.get", return_value=mock_resp) as mock_get:
        resource.get_approval("some-id")

    headers = mock_get.call_args.kwargs.get("headers") or mock_get.call_args[1].get(
        "headers"
    )
    assert headers["Authorization"] == "Bearer gk_test_key"


# ── list_approvals ───────────────────────────────────────────────────────────


def test_list_approvals_passes_filter_parameters(resource, mock_response):
    """list_approvals must pass status, priority, search as query params."""
    mock_resp = mock_response({"data": []})

    with patch("httpx.get", return_value=mock_resp) as mock_get:
        resource.list_approvals(
            status="pending", priority="high", search="deploy", limit=10
        )

    params = mock_get.call_args.kwargs.get("params") or mock_get.call_args[1].get(
        "params"
    )
    assert params["status"] == "pending"
    assert params["priority"] == "high"
    assert params["search"] == "deploy"
    assert params["page_size"] == "10"


def test_list_approvals_omits_unset_filters(resource, mock_response):
    """Filters not provided must not appear in query params."""
    mock_resp = mock_response({"data": []})

    with patch("httpx.get", return_value=mock_resp) as mock_get:
        resource.list_approvals()

    params = mock_get.call_args.kwargs.get("params") or mock_get.call_args[1].get(
        "params"
    )
    assert "status" not in params
    assert "priority" not in params
    assert "search" not in params
    assert params["page_size"] == "25"


def test_list_approvals_calls_correct_endpoint(resource, mock_response):
    """list_approvals must GET /api/v1/approvals."""
    mock_resp = mock_response({"data": []})

    with patch("httpx.get", return_value=mock_resp) as mock_get:
        resource.list_approvals()

    url = mock_get.call_args.args[0]
    assert url == "https://test.okrunit.com/api/v1/approvals"


# ── add_comment ──────────────────────────────────────────────────────────────


def test_add_comment_sends_correct_request_body(resource, mock_response):
    """add_comment must send {\"body\": <text>} to the comments endpoint."""
    comment_response = {
        "id": "comment-id",
        "approval_id": "appr-id",
        "body": "Looks good!",
        "created_at": "2026-02-21T10:05:00.000Z",
    }
    mock_resp = mock_response(comment_response)

    with patch("httpx.post", return_value=mock_resp) as mock_post:
        result = resource.add_comment("appr-id", "Looks good!")

    url = mock_post.call_args.args[0]
    sent_body = mock_post.call_args.kwargs.get("json") or mock_post.call_args[1].get(
        "json"
    )

    assert url == "https://test.okrunit.com/api/v1/approvals/appr-id/comments"
    assert sent_body == {"body": "Looks good!"}
    assert result == comment_response


# ── resource internals ───────────────────────────────────────────────────────


def test_headers_contains_bearer_token(resource):
    """_headers must return proper auth and content-type headers."""
    headers = resource._headers()
    assert headers["Authorization"] == "Bearer gk_test_key"
    assert headers["Content-Type"] == "application/json"


def test_base_url(resource):
    """_base_url must return {api_url}/api/v1."""
    assert resource._base_url() == "https://test.okrunit.com/api/v1"


def test_valid_priorities_constant(resource):
    """_VALID_PRIORITIES must contain all spec-defined priorities."""
    assert set(resource._VALID_PRIORITIES) == {"low", "medium", "high", "critical"}

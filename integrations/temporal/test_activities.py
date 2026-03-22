"""Tests for OKRunit Temporal activities."""

import re
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from .activities import (
    OKRunitConfig,
    create_approval,
    get_approval,
    list_approvals,
    add_comment,
    _headers,
)


@pytest.fixture
def config():
    return OKRunitConfig(api_key="gk_test_key", api_url="https://test.okrunit.com")


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
        "title": "Deploy v2.3.1 to production",
        "description": "Release includes new payment flow",
        "status": "pending",
        "priority": "high",
        "source": "temporal",
        "idempotency_key": "temporal-1234567890-abcdefgh",
        "created_at": "2026-02-21T10:00:00.000Z",
    }


# ── create_approval ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_approval_sets_source_to_temporal(
    config, mock_response, sample_approval
):
    """create_approval must set source to 'temporal'."""
    mock_resp = mock_response(sample_approval)
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await create_approval(
            config, title="Test approval", priority="high"
        )

    call_kwargs = mock_client.post.call_args
    sent_body = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
    assert sent_body["source"] == "temporal"


@pytest.mark.asyncio
async def test_create_approval_generates_idempotency_key(
    config, mock_response, sample_approval
):
    """Idempotency key must follow format: temporal-{timestamp}-{random}."""
    mock_resp = mock_response(sample_approval)
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await create_approval(config, title="Test", priority="medium")

    call_kwargs = mock_client.post.call_args
    sent_body = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
    key = sent_body["idempotency_key"]
    assert re.match(r"^temporal-\d+-[a-z0-9]{8}$", key), (
        f"Idempotency key '{key}' does not match expected format"
    )


@pytest.mark.asyncio
async def test_create_approval_default_title_when_empty(
    config, mock_response, sample_approval
):
    """When title is empty string, defaults to 'Approval request from temporal'."""
    mock_resp = mock_response(sample_approval)
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await create_approval(config, title="", priority="medium")

    call_kwargs = mock_client.post.call_args
    sent_body = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
    assert sent_body["title"] == "Approval request from temporal"


@pytest.mark.asyncio
async def test_create_approval_default_title_when_none(
    config, mock_response, sample_approval
):
    """When title is None, defaults to 'Approval request from temporal'."""
    mock_resp = mock_response(sample_approval)
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await create_approval(config, title=None, priority="medium")

    call_kwargs = mock_client.post.call_args
    sent_body = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
    assert sent_body["title"] == "Approval request from temporal"


@pytest.mark.asyncio
async def test_create_approval_validates_priority_rejects_invalid(config):
    """Invalid priority values must raise ValueError."""
    with pytest.raises(ValueError, match="Invalid priority 'urgent'"):
        await create_approval(config, title="Test", priority="urgent")


@pytest.mark.asyncio
@pytest.mark.parametrize("priority", ["low", "medium", "high", "critical"])
async def test_create_approval_accepts_valid_priorities(
    config, mock_response, sample_approval, priority
):
    """All valid priority values must be accepted."""
    mock_resp = mock_response(sample_approval)
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await create_approval(config, title="Test", priority=priority)

    call_kwargs = mock_client.post.call_args
    sent_body = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
    assert sent_body["priority"] == priority


@pytest.mark.asyncio
async def test_create_approval_passes_callback_url(
    config, mock_response, sample_approval
):
    """callback_url must be included in the request body when provided."""
    mock_resp = mock_response(sample_approval)
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await create_approval(
            config,
            title="Test",
            priority="medium",
            callback_url="https://example.com/callback",
        )

    call_kwargs = mock_client.post.call_args
    sent_body = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
    assert sent_body["callback_url"] == "https://example.com/callback"


@pytest.mark.asyncio
async def test_create_approval_omits_callback_url_when_none(
    config, mock_response, sample_approval
):
    """callback_url must NOT be in the body when not provided."""
    mock_resp = mock_response(sample_approval)
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await create_approval(config, title="Test", priority="medium")

    call_kwargs = mock_client.post.call_args
    sent_body = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
    assert "callback_url" not in sent_body


@pytest.mark.asyncio
async def test_create_approval_posts_to_correct_endpoint(
    config, mock_response, sample_approval
):
    """Must POST to {api_url}/api/v1/approvals."""
    mock_resp = mock_response(sample_approval)
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await create_approval(config, title="Test", priority="medium")

    call_args = mock_client.post.call_args
    url = call_args.args[0] if call_args.args else call_args.kwargs.get("url")
    assert url == "https://test.okrunit.com/api/v1/approvals"


@pytest.mark.asyncio
async def test_create_approval_includes_description_and_metadata(
    config, mock_response, sample_approval
):
    """description and metadata are included in the body when provided."""
    mock_resp = mock_response(sample_approval)
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await create_approval(
            config,
            title="Test",
            priority="medium",
            description="Some context",
            metadata={"repo": "test-repo"},
        )

    call_kwargs = mock_client.post.call_args
    sent_body = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
    assert sent_body["description"] == "Some context"
    assert sent_body["metadata"] == {"repo": "test-repo"}


# ── get_approval ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_approval_calls_correct_endpoint(
    config, mock_response, sample_approval
):
    """get_approval must GET /api/v1/approvals/{id}."""
    mock_resp = mock_response(sample_approval)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    approval_id = "550e8400-e29b-41d4-a716-446655440000"

    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await get_approval(config, approval_id)

    call_args = mock_client.get.call_args
    url = call_args.args[0] if call_args.args else call_args.kwargs.get("url")
    assert url == f"https://test.okrunit.com/api/v1/approvals/{approval_id}"
    assert result == sample_approval


@pytest.mark.asyncio
async def test_get_approval_sends_auth_header(config, mock_response, sample_approval):
    """get_approval must include the Authorization header."""
    mock_resp = mock_response(sample_approval)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await get_approval(config, "some-id")

    call_kwargs = mock_client.get.call_args
    headers = call_kwargs.kwargs.get("headers") or call_kwargs[1].get("headers")
    assert headers["Authorization"] == "Bearer gk_test_key"


# ── list_approvals ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_approvals_passes_filter_parameters(config, mock_response):
    """list_approvals must pass status, priority, search as query params."""
    mock_resp = mock_response({"data": []})
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await list_approvals(
            config,
            status="pending",
            priority="high",
            search="deploy",
            limit=10,
        )

    call_kwargs = mock_client.get.call_args
    params = call_kwargs.kwargs.get("params") or call_kwargs[1].get("params")
    assert params["status"] == "pending"
    assert params["priority"] == "high"
    assert params["search"] == "deploy"
    assert params["page_size"] == "10"


@pytest.mark.asyncio
async def test_list_approvals_omits_unset_filters(config, mock_response):
    """Filters not provided must not appear in query params."""
    mock_resp = mock_response({"data": []})
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await list_approvals(config)

    call_kwargs = mock_client.get.call_args
    params = call_kwargs.kwargs.get("params") or call_kwargs[1].get("params")
    assert "status" not in params
    assert "priority" not in params
    assert "search" not in params
    assert params["page_size"] == "25"


@pytest.mark.asyncio
async def test_list_approvals_calls_correct_endpoint(config, mock_response):
    """list_approvals must GET /api/v1/approvals."""
    mock_resp = mock_response({"data": []})
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await list_approvals(config)

    call_args = mock_client.get.call_args
    url = call_args.args[0] if call_args.args else call_args.kwargs.get("url")
    assert url == "https://test.okrunit.com/api/v1/approvals"


# ── add_comment ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_add_comment_sends_correct_request_body(config, mock_response):
    """add_comment must send {\"body\": <text>} to the comments endpoint."""
    comment_response = {
        "id": "comment-id",
        "approval_id": "approval-id",
        "body": "Looks good!",
        "created_at": "2026-02-21T10:05:00.000Z",
    }
    mock_resp = mock_response(comment_response)
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await add_comment(config, "approval-id", "Looks good!")

    call_kwargs = mock_client.post.call_args
    url = call_kwargs.args[0] if call_kwargs.args else call_kwargs.kwargs.get("url")
    sent_body = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")

    assert url == "https://test.okrunit.com/api/v1/approvals/approval-id/comments"
    assert sent_body == {"body": "Looks good!"}
    assert result == comment_response


# ── _headers helper ──────────────────────────────────────────────────────────


def test_headers_contains_bearer_token(config):
    """_headers must return Authorization bearer and content-type."""
    headers = _headers(config)
    assert headers["Authorization"] == "Bearer gk_test_key"
    assert headers["Content-Type"] == "application/json"

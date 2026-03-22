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
    poll_new_approvals,
    poll_decided_approvals,
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


# ── poll_new_approvals ──────────────────────────────────────────────────────


@pytest.fixture
def sample_approvals_list():
    return {
        "data": [
            {
                "id": "aaa-111",
                "title": "Deploy v2.4.0",
                "status": "pending",
                "priority": "high",
                "created_at": "2026-02-21T12:00:00.000Z",
                "updated_at": "2026-02-21T12:00:00.000Z",
            },
            {
                "id": "bbb-222",
                "title": "Deploy v2.3.1",
                "status": "pending",
                "priority": "medium",
                "created_at": "2026-02-21T11:00:00.000Z",
                "updated_at": "2026-02-21T11:00:00.000Z",
            },
        ]
    }


@pytest.fixture
def sample_decided_list():
    return {
        "data": [
            {
                "id": "ccc-333",
                "title": "Deploy v2.4.0",
                "status": "approved",
                "priority": "high",
                "decided_by_name": "Jane Smith",
                "decided_at": "2026-02-21T12:30:00.000Z",
                "created_at": "2026-02-21T12:00:00.000Z",
                "updated_at": "2026-02-21T12:30:00.000Z",
            },
            {
                "id": "ddd-444",
                "title": "Delete user data",
                "status": "rejected",
                "priority": "critical",
                "decided_by_name": "John Doe",
                "decided_at": "2026-02-21T11:30:00.000Z",
                "created_at": "2026-02-21T11:00:00.000Z",
                "updated_at": "2026-02-21T11:30:00.000Z",
            },
        ]
    }


@pytest.mark.asyncio
async def test_poll_new_approvals_returns_approvals_and_cursor(
    config, mock_response, sample_approvals_list
):
    """poll_new_approvals must return approvals, new_cursor, and count."""
    mock_resp = mock_response(sample_approvals_list)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await poll_new_approvals(config)

    assert result["count"] == 2
    assert len(result["approvals"]) == 2
    assert result["new_cursor"] == "2026-02-21T12:00:00.000Z"


@pytest.mark.asyncio
async def test_poll_new_approvals_passes_cursor_as_created_after(
    config, mock_response, sample_approvals_list
):
    """When cursor is provided, it must be passed as created_after param."""
    mock_resp = mock_response(sample_approvals_list)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    cursor = "2026-02-21T10:00:00.000Z"

    with patch("httpx.AsyncClient", return_value=mock_client):
        await poll_new_approvals(config, cursor=cursor)

    call_kwargs = mock_client.get.call_args
    params = call_kwargs.kwargs.get("params") or call_kwargs[1].get("params")
    assert params["created_after"] == cursor
    assert params["sort"] == "created_at"
    assert params["order"] == "desc"


@pytest.mark.asyncio
async def test_poll_new_approvals_omits_cursor_when_none(
    config, mock_response, sample_approvals_list
):
    """When cursor is None, created_after must not appear in params."""
    mock_resp = mock_response(sample_approvals_list)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await poll_new_approvals(config, cursor=None)

    call_kwargs = mock_client.get.call_args
    params = call_kwargs.kwargs.get("params") or call_kwargs[1].get("params")
    assert "created_after" not in params


@pytest.mark.asyncio
async def test_poll_new_approvals_passes_status_and_priority_filters(
    config, mock_response, sample_approvals_list
):
    """Status and priority filters must be passed as query params."""
    mock_resp = mock_response(sample_approvals_list)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await poll_new_approvals(config, status="pending", priority="high")

    call_kwargs = mock_client.get.call_args
    params = call_kwargs.kwargs.get("params") or call_kwargs[1].get("params")
    assert params["status"] == "pending"
    assert params["priority"] == "high"


@pytest.mark.asyncio
async def test_poll_new_approvals_deduplicates_by_id(config, mock_response):
    """Duplicate approval IDs must be removed, keeping first occurrence."""
    duped_data = {
        "data": [
            {"id": "aaa-111", "title": "First", "created_at": "2026-02-21T12:00:00.000Z"},
            {"id": "aaa-111", "title": "Duplicate", "created_at": "2026-02-21T11:00:00.000Z"},
            {"id": "bbb-222", "title": "Second", "created_at": "2026-02-21T10:00:00.000Z"},
        ]
    }
    mock_resp = mock_response(duped_data)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await poll_new_approvals(config)

    assert result["count"] == 2
    ids = [a["id"] for a in result["approvals"]]
    assert ids == ["aaa-111", "bbb-222"]
    assert result["approvals"][0]["title"] == "First"


@pytest.mark.asyncio
async def test_poll_new_approvals_empty_result_preserves_cursor(config, mock_response):
    """When no approvals are returned, cursor must remain unchanged."""
    mock_resp = mock_response({"data": []})
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    original_cursor = "2026-02-21T10:00:00.000Z"

    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await poll_new_approvals(config, cursor=original_cursor)

    assert result["count"] == 0
    assert result["approvals"] == []
    assert result["new_cursor"] == original_cursor


@pytest.mark.asyncio
async def test_poll_new_approvals_calls_correct_endpoint(
    config, mock_response, sample_approvals_list
):
    """Must GET /api/v1/approvals."""
    mock_resp = mock_response(sample_approvals_list)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await poll_new_approvals(config)

    call_args = mock_client.get.call_args
    url = call_args.args[0] if call_args.args else call_args.kwargs.get("url")
    assert url == "https://test.okrunit.com/api/v1/approvals"


# ── poll_decided_approvals ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_poll_decided_approvals_returns_decisions_and_cursor(
    config, mock_response, sample_decided_list
):
    """poll_decided_approvals must return approvals, new_cursor, and count."""
    mock_resp = mock_response(sample_decided_list)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await poll_decided_approvals(config)

    assert result["count"] == 2
    assert len(result["approvals"]) == 2
    assert result["new_cursor"] == "2026-02-21T12:30:00.000Z"


@pytest.mark.asyncio
async def test_poll_decided_approvals_default_status_is_both(
    config, mock_response, sample_decided_list
):
    """Without decision filter, status must be 'approved,rejected'."""
    mock_resp = mock_response(sample_decided_list)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await poll_decided_approvals(config)

    call_kwargs = mock_client.get.call_args
    params = call_kwargs.kwargs.get("params") or call_kwargs[1].get("params")
    assert params["status"] == "approved,rejected"
    assert params["sort"] == "updated_at"
    assert params["order"] == "desc"


@pytest.mark.asyncio
async def test_poll_decided_approvals_filters_by_approved_only(
    config, mock_response, sample_decided_list
):
    """When decision='approved', status param must be 'approved'."""
    mock_resp = mock_response(sample_decided_list)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await poll_decided_approvals(config, decision="approved")

    call_kwargs = mock_client.get.call_args
    params = call_kwargs.kwargs.get("params") or call_kwargs[1].get("params")
    assert params["status"] == "approved"


@pytest.mark.asyncio
async def test_poll_decided_approvals_filters_by_rejected_only(
    config, mock_response, sample_decided_list
):
    """When decision='rejected', status param must be 'rejected'."""
    mock_resp = mock_response(sample_decided_list)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await poll_decided_approvals(config, decision="rejected")

    call_kwargs = mock_client.get.call_args
    params = call_kwargs.kwargs.get("params") or call_kwargs[1].get("params")
    assert params["status"] == "rejected"


@pytest.mark.asyncio
async def test_poll_decided_approvals_rejects_invalid_decision(config):
    """Invalid decision values must raise ValueError."""
    with pytest.raises(ValueError, match="Invalid decision 'cancelled'"):
        await poll_decided_approvals(config, decision="cancelled")


@pytest.mark.asyncio
async def test_poll_decided_approvals_passes_cursor_as_updated_after(
    config, mock_response, sample_decided_list
):
    """When cursor is provided, it must be passed as updated_after param."""
    mock_resp = mock_response(sample_decided_list)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    cursor = "2026-02-21T10:00:00.000Z"

    with patch("httpx.AsyncClient", return_value=mock_client):
        await poll_decided_approvals(config, cursor=cursor)

    call_kwargs = mock_client.get.call_args
    params = call_kwargs.kwargs.get("params") or call_kwargs[1].get("params")
    assert params["updated_after"] == cursor


@pytest.mark.asyncio
async def test_poll_decided_approvals_omits_cursor_when_none(
    config, mock_response, sample_decided_list
):
    """When cursor is None, updated_after must not appear in params."""
    mock_resp = mock_response(sample_decided_list)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await poll_decided_approvals(config, cursor=None)

    call_kwargs = mock_client.get.call_args
    params = call_kwargs.kwargs.get("params") or call_kwargs[1].get("params")
    assert "updated_after" not in params


@pytest.mark.asyncio
async def test_poll_decided_approvals_passes_priority_filter(
    config, mock_response, sample_decided_list
):
    """Priority filter must be passed as query param."""
    mock_resp = mock_response(sample_decided_list)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await poll_decided_approvals(config, priority="critical")

    call_kwargs = mock_client.get.call_args
    params = call_kwargs.kwargs.get("params") or call_kwargs[1].get("params")
    assert params["priority"] == "critical"


@pytest.mark.asyncio
async def test_poll_decided_approvals_deduplicates_by_id(config, mock_response):
    """Duplicate approval IDs must be removed, keeping first occurrence."""
    duped_data = {
        "data": [
            {"id": "ccc-333", "title": "First", "status": "approved", "updated_at": "2026-02-21T12:30:00.000Z"},
            {"id": "ccc-333", "title": "Duplicate", "status": "approved", "updated_at": "2026-02-21T12:00:00.000Z"},
            {"id": "ddd-444", "title": "Second", "status": "rejected", "updated_at": "2026-02-21T11:30:00.000Z"},
        ]
    }
    mock_resp = mock_response(duped_data)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await poll_decided_approvals(config)

    assert result["count"] == 2
    ids = [a["id"] for a in result["approvals"]]
    assert ids == ["ccc-333", "ddd-444"]


@pytest.mark.asyncio
async def test_poll_decided_approvals_empty_result_preserves_cursor(config, mock_response):
    """When no approvals are returned, cursor must remain unchanged."""
    mock_resp = mock_response({"data": []})
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    original_cursor = "2026-02-21T10:00:00.000Z"

    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await poll_decided_approvals(config, cursor=original_cursor)

    assert result["count"] == 0
    assert result["approvals"] == []
    assert result["new_cursor"] == original_cursor


@pytest.mark.asyncio
async def test_poll_decided_approvals_calls_correct_endpoint(
    config, mock_response, sample_decided_list
):
    """Must GET /api/v1/approvals."""
    mock_resp = mock_response(sample_decided_list)
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=mock_client):
        await poll_decided_approvals(config)

    call_args = mock_client.get.call_args
    url = call_args.args[0] if call_args.args else call_args.kwargs.get("url")
    assert url == "https://test.okrunit.com/api/v1/approvals"

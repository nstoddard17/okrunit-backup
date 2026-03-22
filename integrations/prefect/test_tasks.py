"""Tests for OKRunit Prefect tasks."""

"""Tests for OKRunit Prefect tasks."""

import re
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from tasks import (
    create_approval,
    get_approval,
    list_approvals,
    add_comment,
    poll_new_approvals,
    poll_decided_approvals,
    _headers,
    VALID_PRIORITIES,
    VALID_STATUSES,
)


API_KEY = "gk_test_key"
API_URL = "https://test.okrunit.com"


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
        "source": "prefect",
        "created_at": "2026-02-21T10:00:00.000Z",
    }


def _patch_resolve_api_key():
    """Patch _resolve_api_key so tests don't try to load Prefect Secret blocks."""
    return patch(
        "tasks._resolve_api_key",
        new_callable=AsyncMock,
        return_value=API_KEY,
    )


def _make_mock_client(mock_resp):
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    return mock_client


# ── create_approval ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_approval_sets_source_to_prefect(mock_response, sample_approval):
    """create_approval must set source to 'prefect'."""
    mock_resp = mock_response(sample_approval)
    mock_client = _make_mock_client(mock_resp)
    mock_client.post.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await create_approval.fn(
            title="Test", priority="high", api_key=API_KEY, api_url=API_URL
        )

    sent_body = mock_client.post.call_args.kwargs.get(
        "json"
    ) or mock_client.post.call_args[1].get("json")
    assert sent_body["source"] == "prefect"


@pytest.mark.asyncio
async def test_create_approval_generates_idempotency_key(
    mock_response, sample_approval
):
    """Idempotency key must follow format: prefect-{timestamp}-{random}."""
    mock_resp = mock_response(sample_approval)
    mock_client = _make_mock_client(mock_resp)
    mock_client.post.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await create_approval.fn(
            title="Test", priority="medium", api_key=API_KEY, api_url=API_URL
        )

    sent_body = mock_client.post.call_args.kwargs.get(
        "json"
    ) or mock_client.post.call_args[1].get("json")
    key = sent_body["idempotency_key"]
    assert re.match(r"^prefect-\d+-[a-z0-9]{8}$", key), (
        f"Idempotency key '{key}' does not match expected format"
    )


@pytest.mark.asyncio
async def test_create_approval_default_title_when_empty(
    mock_response, sample_approval
):
    """When title is empty string, defaults to 'Approval request from prefect'."""
    mock_resp = mock_response(sample_approval)
    mock_client = _make_mock_client(mock_resp)
    mock_client.post.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await create_approval.fn(
            title="", priority="medium", api_key=API_KEY, api_url=API_URL
        )

    sent_body = mock_client.post.call_args.kwargs.get(
        "json"
    ) or mock_client.post.call_args[1].get("json")
    assert sent_body["title"] == "Approval request from prefect"


@pytest.mark.asyncio
async def test_create_approval_default_title_when_none(
    mock_response, sample_approval
):
    """When title is None, defaults to 'Approval request from prefect'."""
    mock_resp = mock_response(sample_approval)
    mock_client = _make_mock_client(mock_resp)
    mock_client.post.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await create_approval.fn(
            title=None, priority="medium", api_key=API_KEY, api_url=API_URL
        )

    sent_body = mock_client.post.call_args.kwargs.get(
        "json"
    ) or mock_client.post.call_args[1].get("json")
    assert sent_body["title"] == "Approval request from prefect"


@pytest.mark.asyncio
async def test_create_approval_validates_priority():
    """Invalid priority values must raise ValueError."""
    with _patch_resolve_api_key():
        with pytest.raises(ValueError, match="Invalid priority 'urgent'"):
            await create_approval.fn(
                title="Test", priority="urgent", api_key=API_KEY, api_url=API_URL
            )


@pytest.mark.asyncio
@pytest.mark.parametrize("priority", ["low", "medium", "high", "critical"])
async def test_create_approval_accepts_valid_priorities(
    mock_response, sample_approval, priority
):
    """All valid priority values must be accepted."""
    mock_resp = mock_response(sample_approval)
    mock_client = _make_mock_client(mock_resp)
    mock_client.post.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await create_approval.fn(
            title="Test", priority=priority, api_key=API_KEY, api_url=API_URL
        )

    sent_body = mock_client.post.call_args.kwargs.get(
        "json"
    ) or mock_client.post.call_args[1].get("json")
    assert sent_body["priority"] == priority


@pytest.mark.asyncio
async def test_create_approval_posts_to_correct_endpoint(
    mock_response, sample_approval
):
    """Must POST to {api_url}/api/v1/approvals."""
    mock_resp = mock_response(sample_approval)
    mock_client = _make_mock_client(mock_resp)
    mock_client.post.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await create_approval.fn(
            title="Test", priority="medium", api_key=API_KEY, api_url=API_URL
        )

    url = mock_client.post.call_args.args[0]
    assert url == f"{API_URL}/api/v1/approvals"


# ── add_comment ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_add_comment_uses_comment_parameter_name(mock_response):
    """The add_comment task parameter is named 'comment' (not 'body')."""
    comment_response = {
        "id": "comment-id",
        "approval_id": "appr-id",
        "body": "LGTM",
        "created_at": "2026-02-21T10:05:00.000Z",
    }
    mock_resp = mock_response(comment_response)
    mock_client = _make_mock_client(mock_resp)
    mock_client.post.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        # Must accept `comment` as the parameter name (per the spec)
        result = await add_comment.fn(
            approval_id="appr-id",
            comment="LGTM",
            api_key=API_KEY,
            api_url=API_URL,
        )

    assert result == comment_response


@pytest.mark.asyncio
async def test_add_comment_sends_body_key_in_request(mock_response):
    """The request body must use 'body' as the JSON key (spec: addComment)."""
    mock_resp = mock_response({"id": "c1", "body": "test"})
    mock_client = _make_mock_client(mock_resp)
    mock_client.post.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await add_comment.fn(
            approval_id="appr-id",
            comment="Ship it",
            api_key=API_KEY,
            api_url=API_URL,
        )

    sent_body = mock_client.post.call_args.kwargs.get(
        "json"
    ) or mock_client.post.call_args[1].get("json")
    assert sent_body == {"body": "Ship it"}


@pytest.mark.asyncio
async def test_add_comment_posts_to_correct_endpoint(mock_response):
    """Must POST to /api/v1/approvals/{id}/comments."""
    mock_resp = mock_response({"id": "c1"})
    mock_client = _make_mock_client(mock_resp)
    mock_client.post.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await add_comment.fn(
            approval_id="appr-123",
            comment="test",
            api_key=API_KEY,
            api_url=API_URL,
        )

    url = mock_client.post.call_args.args[0]
    assert url == f"{API_URL}/api/v1/approvals/appr-123/comments"


# ── get_approval ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_approval_calls_correct_endpoint(mock_response, sample_approval):
    """get_approval must GET /api/v1/approvals/{id}."""
    mock_resp = mock_response(sample_approval)
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    approval_id = "550e8400-e29b-41d4-a716-446655440000"

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        result = await get_approval.fn(
            approval_id=approval_id, api_key=API_KEY, api_url=API_URL
        )

    url = mock_client.get.call_args.args[0]
    assert url == f"{API_URL}/api/v1/approvals/{approval_id}"
    assert result == sample_approval


@pytest.mark.asyncio
async def test_get_approval_sends_auth_header(mock_response, sample_approval):
    """get_approval must include the Authorization header."""
    mock_resp = mock_response(sample_approval)
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await get_approval.fn(
            approval_id="some-id", api_key=API_KEY, api_url=API_URL
        )

    headers = mock_client.get.call_args.kwargs.get(
        "headers"
    ) or mock_client.get.call_args[1].get("headers")
    assert headers["Authorization"] == f"Bearer {API_KEY}"


# ── list_approvals ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_approvals_passes_filter_parameters(mock_response):
    """list_approvals must pass status, priority, search as query params."""
    mock_resp = mock_response({"data": []})
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await list_approvals.fn(
            status="pending",
            priority="high",
            search="deploy",
            limit=10,
            api_key=API_KEY,
            api_url=API_URL,
        )

    params = mock_client.get.call_args.kwargs.get(
        "params"
    ) or mock_client.get.call_args[1].get("params")
    assert params["status"] == "pending"
    assert params["priority"] == "high"
    assert params["search"] == "deploy"
    assert params["page_size"] == "10"


@pytest.mark.asyncio
async def test_list_approvals_omits_unset_filters(mock_response):
    """Filters not provided must not appear in query params."""
    mock_resp = mock_response({"data": []})
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await list_approvals.fn(api_key=API_KEY, api_url=API_URL)

    params = mock_client.get.call_args.kwargs.get(
        "params"
    ) or mock_client.get.call_args[1].get("params")
    assert "status" not in params
    assert "priority" not in params
    assert "search" not in params
    assert params["page_size"] == "25"


@pytest.mark.asyncio
async def test_list_approvals_calls_correct_endpoint(mock_response):
    """list_approvals must GET /api/v1/approvals."""
    mock_resp = mock_response({"data": []})
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await list_approvals.fn(api_key=API_KEY, api_url=API_URL)

    url = mock_client.get.call_args.args[0]
    assert url == f"{API_URL}/api/v1/approvals"


# ── _headers helper ──────────────────────────────────────────────────────────


def test_headers_contains_bearer_token():
    """_headers must return proper auth and content-type headers."""
    headers = _headers("gk_test_key")
    assert headers["Authorization"] == "Bearer gk_test_key"
    assert headers["Content-Type"] == "application/json"


def test_valid_priorities_constant():
    """VALID_PRIORITIES must contain all spec-defined priorities."""
    assert VALID_PRIORITIES == {"low", "medium", "high", "critical"}


def test_valid_statuses_constant():
    """VALID_STATUSES must contain all spec-defined statuses."""
    assert VALID_STATUSES == {"pending", "approved", "rejected", "cancelled", "expired"}


# ── poll_new_approvals ──────────────────────────────────────────────────────


@pytest.fixture
def sample_approvals_list():
    return {
        "data": [
            {
                "id": "aaa-111",
                "title": "Deploy v3",
                "status": "pending",
                "priority": "high",
                "created_at": "2026-03-22T12:00:00.000Z",
                "updated_at": "2026-03-22T12:00:00.000Z",
            },
            {
                "id": "bbb-222",
                "title": "Deploy v2",
                "status": "pending",
                "priority": "medium",
                "created_at": "2026-03-22T11:00:00.000Z",
                "updated_at": "2026-03-22T11:00:00.000Z",
            },
            {
                "id": "ccc-333",
                "title": "Deploy v1",
                "status": "approved",
                "priority": "low",
                "created_at": "2026-03-22T10:00:00.000Z",
                "updated_at": "2026-03-22T10:30:00.000Z",
            },
        ]
    }


@pytest.mark.asyncio
async def test_poll_new_approvals_filters_by_cursor(mock_response, sample_approvals_list):
    """Only approvals created after the cursor should be returned."""
    mock_resp = mock_response(sample_approvals_list)
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        result = await poll_new_approvals.fn(
            cursor="2026-03-22T11:30:00.000Z",
            api_key=API_KEY,
            api_url=API_URL,
        )

    assert len(result) == 1
    assert result[0]["id"] == "aaa-111"


@pytest.mark.asyncio
async def test_poll_new_approvals_returns_all_without_cursor(
    mock_response, sample_approvals_list
):
    """Without a cursor, all approvals should be returned."""
    mock_resp = mock_response(sample_approvals_list)
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        result = await poll_new_approvals.fn(
            cursor=None,
            api_key=API_KEY,
            api_url=API_URL,
        )

    assert len(result) == 3


@pytest.mark.asyncio
async def test_poll_new_approvals_sorted_by_created_at_desc(
    mock_response, sample_approvals_list
):
    """Results must be sorted by created_at descending."""
    mock_resp = mock_response(sample_approvals_list)
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        result = await poll_new_approvals.fn(
            api_key=API_KEY, api_url=API_URL
        )

    created_times = [a["created_at"] for a in result]
    assert created_times == sorted(created_times, reverse=True)


@pytest.mark.asyncio
async def test_poll_new_approvals_deduplicates_by_id(mock_response):
    """Duplicate approval IDs should be deduplicated."""
    data_with_dupes = {
        "data": [
            {"id": "aaa-111", "title": "A", "created_at": "2026-03-22T12:00:00.000Z"},
            {"id": "aaa-111", "title": "A dup", "created_at": "2026-03-22T12:00:00.000Z"},
            {"id": "bbb-222", "title": "B", "created_at": "2026-03-22T11:00:00.000Z"},
        ]
    }
    mock_resp = mock_response(data_with_dupes)
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        result = await poll_new_approvals.fn(
            api_key=API_KEY, api_url=API_URL
        )

    assert len(result) == 2
    ids = [a["id"] for a in result]
    assert len(ids) == len(set(ids))


@pytest.mark.asyncio
async def test_poll_new_approvals_passes_status_filter(mock_response):
    """Status filter must be passed as a query param."""
    mock_resp = mock_response({"data": []})
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await poll_new_approvals.fn(
            status="pending", api_key=API_KEY, api_url=API_URL
        )

    params = mock_client.get.call_args.kwargs.get(
        "params"
    ) or mock_client.get.call_args[1].get("params")
    assert params["status"] == "pending"


@pytest.mark.asyncio
async def test_poll_new_approvals_passes_priority_filter(mock_response):
    """Priority filter must be passed as a query param."""
    mock_resp = mock_response({"data": []})
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await poll_new_approvals.fn(
            priority="high", api_key=API_KEY, api_url=API_URL
        )

    params = mock_client.get.call_args.kwargs.get(
        "params"
    ) or mock_client.get.call_args[1].get("params")
    assert params["priority"] == "high"


@pytest.mark.asyncio
async def test_poll_new_approvals_validates_invalid_status():
    """Invalid status must raise ValueError."""
    with _patch_resolve_api_key():
        with pytest.raises(ValueError, match="Invalid status 'bogus'"):
            await poll_new_approvals.fn(
                status="bogus", api_key=API_KEY, api_url=API_URL
            )


@pytest.mark.asyncio
async def test_poll_new_approvals_validates_invalid_priority():
    """Invalid priority must raise ValueError."""
    with _patch_resolve_api_key():
        with pytest.raises(ValueError, match="Invalid priority 'urgent'"):
            await poll_new_approvals.fn(
                priority="urgent", api_key=API_KEY, api_url=API_URL
            )


@pytest.mark.asyncio
async def test_poll_new_approvals_calls_correct_endpoint(mock_response):
    """Must GET /api/v1/approvals."""
    mock_resp = mock_response({"data": []})
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await poll_new_approvals.fn(api_key=API_KEY, api_url=API_URL)

    url = mock_client.get.call_args.args[0]
    assert url == f"{API_URL}/api/v1/approvals"


# ── poll_decided_approvals ──────────────────────────────────────────────────


@pytest.fixture
def sample_decided_approvals():
    return {
        "data": [
            {
                "id": "ddd-444",
                "title": "Deploy v3",
                "status": "approved",
                "priority": "high",
                "decided_by_name": "Jane",
                "decided_at": "2026-03-22T13:00:00.000Z",
                "created_at": "2026-03-22T12:00:00.000Z",
                "updated_at": "2026-03-22T13:00:00.000Z",
            },
            {
                "id": "eee-555",
                "title": "Deploy v2",
                "status": "rejected",
                "priority": "medium",
                "decided_by_name": "John",
                "decided_at": "2026-03-22T12:30:00.000Z",
                "created_at": "2026-03-22T11:00:00.000Z",
                "updated_at": "2026-03-22T12:30:00.000Z",
            },
        ]
    }


@pytest.mark.asyncio
async def test_poll_decided_approvals_filters_by_cursor(
    mock_response, sample_decided_approvals
):
    """Only decided approvals updated after the cursor should be returned."""
    mock_resp = mock_response(sample_decided_approvals)
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        result = await poll_decided_approvals.fn(
            cursor="2026-03-22T12:45:00.000Z",
            api_key=API_KEY,
            api_url=API_URL,
        )

    assert len(result) == 1
    assert result[0]["id"] == "ddd-444"


@pytest.mark.asyncio
async def test_poll_decided_approvals_fetches_both_statuses(mock_response):
    """Without decision filter, must fetch both approved and rejected."""
    mock_resp = mock_response({"data": []})
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await poll_decided_approvals.fn(api_key=API_KEY, api_url=API_URL)

    # Should have made 2 GET calls: one for approved, one for rejected
    assert mock_client.get.call_count == 2
    statuses_fetched = set()
    for call in mock_client.get.call_args_list:
        params = call.kwargs.get("params") or call[1].get("params")
        statuses_fetched.add(params["status"])
    assert statuses_fetched == {"approved", "rejected"}


@pytest.mark.asyncio
async def test_poll_decided_approvals_single_decision_filter(mock_response):
    """With decision='approved', should only fetch approved."""
    mock_resp = mock_response({"data": []})
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await poll_decided_approvals.fn(
            decision="approved", api_key=API_KEY, api_url=API_URL
        )

    assert mock_client.get.call_count == 1
    params = mock_client.get.call_args.kwargs.get(
        "params"
    ) or mock_client.get.call_args[1].get("params")
    assert params["status"] == "approved"


@pytest.mark.asyncio
async def test_poll_decided_approvals_sorted_by_updated_at_desc(
    mock_response, sample_decided_approvals
):
    """Results must be sorted by updated_at descending."""
    mock_resp = mock_response(sample_decided_approvals)
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        result = await poll_decided_approvals.fn(
            api_key=API_KEY, api_url=API_URL
        )

    updated_times = [a["updated_at"] for a in result]
    assert updated_times == sorted(updated_times, reverse=True)


@pytest.mark.asyncio
async def test_poll_decided_approvals_deduplicates_by_id(mock_response):
    """Duplicate IDs across status fetches should be deduplicated."""
    # Same approval appears in both approved and rejected fetches
    data = {
        "data": [
            {
                "id": "same-id",
                "title": "X",
                "status": "approved",
                "updated_at": "2026-03-22T13:00:00.000Z",
            },
        ]
    }
    mock_resp = mock_response(data)
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        result = await poll_decided_approvals.fn(
            api_key=API_KEY, api_url=API_URL
        )

    # Even though 2 fetches return the same ID, it should appear only once
    assert len(result) == 1
    assert result[0]["id"] == "same-id"


@pytest.mark.asyncio
async def test_poll_decided_approvals_validates_invalid_decision():
    """Invalid decision value must raise ValueError."""
    with _patch_resolve_api_key():
        with pytest.raises(ValueError, match="Invalid decision 'pending'"):
            await poll_decided_approvals.fn(
                decision="pending", api_key=API_KEY, api_url=API_URL
            )


@pytest.mark.asyncio
async def test_poll_decided_approvals_validates_invalid_priority():
    """Invalid priority must raise ValueError."""
    with _patch_resolve_api_key():
        with pytest.raises(ValueError, match="Invalid priority 'urgent'"):
            await poll_decided_approvals.fn(
                priority="urgent", api_key=API_KEY, api_url=API_URL
            )


@pytest.mark.asyncio
async def test_poll_decided_approvals_passes_priority_filter(mock_response):
    """Priority filter must be passed as a query param."""
    mock_resp = mock_response({"data": []})
    mock_client = _make_mock_client(mock_resp)
    mock_client.get.return_value = mock_resp

    with _patch_resolve_api_key(), patch(
        "httpx.AsyncClient", return_value=mock_client
    ):
        await poll_decided_approvals.fn(
            priority="critical", api_key=API_KEY, api_url=API_URL
        )

    for call in mock_client.get.call_args_list:
        params = call.kwargs.get("params") or call[1].get("params")
        assert params["priority"] == "critical"

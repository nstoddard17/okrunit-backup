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


# ── Sensor Tests ─────────────────────────────────────────────────────────────

from dagster import build_sensor_context, RunRequest, SkipReason

from sensors import new_approval_sensor, approval_decided_sensor, build_new_approval_sensor


def _mock_okrunit(approvals_by_call):
    """Create a mock OKRunit resource with side_effect for list_approvals."""
    okrunit = MagicMock()
    okrunit.list_approvals.side_effect = approvals_by_call
    return okrunit


def _run_sensor(sensor_def, cursor=None, okrunit_mock=None):
    """Execute a sensor definition and return (results, context)."""
    okrunit = okrunit_mock or MagicMock()
    ctx = build_sensor_context(cursor=cursor, resources={"okrunit": okrunit})
    # Call the raw function directly to avoid Dagster's resource injection
    # which conflicts with the required_resource_keys pattern
    gen = sensor_def._raw_fn(ctx)
    results = list(gen) if gen is not None else []
    return results, ctx


# ── new_approval_sensor ─────────────────────────────────────────────────────


def test_new_approval_sensor_yields_run_request_for_new_approvals():
    """new_approval_sensor must yield a RunRequest for each new approval."""
    okrunit = _mock_okrunit([
        {
            "data": [
                {
                    "id": "aaa-111",
                    "title": "Deploy v1",
                    "status": "pending",
                    "priority": "high",
                    "source": "dagster",
                    "created_at": "2026-03-01T10:00:00Z",
                }
            ]
        }
    ])

    results, ctx = _run_sensor(new_approval_sensor, cursor=None, okrunit_mock=okrunit)

    run_requests = [r for r in results if isinstance(r, RunRequest)]
    assert len(run_requests) == 1
    assert run_requests[0].run_key == "new-approval-aaa-111"
    config = run_requests[0].run_config["ops"]["process_new_approval"]["config"]
    assert config["approval_id"] == "aaa-111"
    assert config["title"] == "Deploy v1"
    assert config["status"] == "pending"
    assert config["priority"] == "high"
    assert config["source"] == "dagster"
    assert config["created_at"] == "2026-03-01T10:00:00Z"


def test_new_approval_sensor_skips_when_no_new_approvals():
    """new_approval_sensor must yield SkipReason when nothing is new."""
    okrunit = _mock_okrunit([
        {
            "data": [
                {
                    "id": "aaa-111",
                    "title": "Old",
                    "status": "pending",
                    "priority": "low",
                    "source": "api",
                    "created_at": "2026-03-01T10:00:00Z",
                }
            ]
        }
    ])

    results, ctx = _run_sensor(
        new_approval_sensor, cursor="2026-03-01T12:00:00Z", okrunit_mock=okrunit
    )

    skip_reasons = [r for r in results if isinstance(r, SkipReason)]
    assert len(skip_reasons) == 1
    assert "No new approval requests" in skip_reasons[0].skip_message


def test_new_approval_sensor_updates_cursor_to_latest():
    """Cursor must advance to the latest created_at seen."""
    okrunit = _mock_okrunit([
        {
            "data": [
                {
                    "id": "aaa-111",
                    "title": "First",
                    "status": "pending",
                    "priority": "low",
                    "source": "api",
                    "created_at": "2026-03-01T10:00:00Z",
                },
                {
                    "id": "bbb-222",
                    "title": "Second",
                    "status": "pending",
                    "priority": "high",
                    "source": "api",
                    "created_at": "2026-03-02T10:00:00Z",
                },
            ]
        }
    ])

    results, ctx = _run_sensor(new_approval_sensor, cursor=None, okrunit_mock=okrunit)

    assert ctx.cursor == "2026-03-02T10:00:00Z"


def test_new_approval_sensor_passes_status_filter():
    """When status filter is set, it must be passed to list_approvals."""
    okrunit = _mock_okrunit([{"data": []}])
    sensor_def = build_new_approval_sensor(status="pending")

    _run_sensor(sensor_def, cursor=None, okrunit_mock=okrunit)

    call_kwargs = okrunit.list_approvals.call_args.kwargs
    assert call_kwargs["status"] == "pending"


def test_new_approval_sensor_passes_priority_filter():
    """When priority filter is set, it must be passed to list_approvals."""
    okrunit = _mock_okrunit([{"data": []}])
    sensor_def = build_new_approval_sensor(priority="critical")

    _run_sensor(sensor_def, cursor=None, okrunit_mock=okrunit)

    call_kwargs = okrunit.list_approvals.call_args.kwargs
    assert call_kwargs["priority"] == "critical"


def test_new_approval_sensor_no_filters_by_default():
    """Default sensor must not pass status or priority filters."""
    okrunit = _mock_okrunit([{"data": []}])

    _run_sensor(new_approval_sensor, cursor=None, okrunit_mock=okrunit)

    call_kwargs = okrunit.list_approvals.call_args.kwargs
    assert "status" not in call_kwargs
    assert "priority" not in call_kwargs
    assert call_kwargs["limit"] == 50


def test_new_approval_sensor_deduplicates_by_id():
    """Run keys must include the approval id for deduplication."""
    okrunit = _mock_okrunit([
        {
            "data": [
                {
                    "id": "unique-id-123",
                    "title": "Test",
                    "status": "pending",
                    "priority": "medium",
                    "source": "api",
                    "created_at": "2026-03-01T10:00:00Z",
                }
            ]
        }
    ])

    results, ctx = _run_sensor(new_approval_sensor, cursor=None, okrunit_mock=okrunit)
    run_requests = [r for r in results if isinstance(r, RunRequest)]

    assert run_requests[0].run_key == "new-approval-unique-id-123"


# ── approval_decided_sensor ─────────────────────────────────────────────────


def test_approval_decided_sensor_yields_run_for_new_decisions():
    """approval_decided_sensor must yield RunRequest for new decisions."""
    okrunit = _mock_okrunit([
        {
            "data": [
                {
                    "id": "dec-111",
                    "title": "Deploy v2",
                    "status": "approved",
                    "decided_at": "2026-03-01T12:00:00Z",
                    "decided_by_name": "Alice",
                }
            ]
        },
        {"data": []},
    ])

    results, ctx = _run_sensor(
        approval_decided_sensor, cursor=None, okrunit_mock=okrunit
    )

    run_requests = [r for r in results if isinstance(r, RunRequest)]
    assert len(run_requests) == 1
    assert run_requests[0].run_key == "approval-dec-111"


def test_approval_decided_sensor_skips_when_no_new_decisions():
    """approval_decided_sensor must yield SkipReason when nothing new."""
    okrunit = _mock_okrunit([
        {
            "data": [
                {
                    "id": "dec-111",
                    "status": "approved",
                    "decided_at": "2026-03-01T10:00:00Z",
                    "decided_by_name": "Alice",
                }
            ]
        },
        {"data": []},
    ])

    results, ctx = _run_sensor(
        approval_decided_sensor, cursor="2026-03-01T12:00:00Z", okrunit_mock=okrunit
    )

    skip_reasons = [r for r in results if isinstance(r, SkipReason)]
    assert len(skip_reasons) == 1
    assert "No new approval decisions" in skip_reasons[0].skip_message

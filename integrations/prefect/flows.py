"""OKRunit Prefect flows for human-in-the-loop approval gates."""

import asyncio
from datetime import datetime, timezone

from prefect import flow, get_run_logger

from .tasks import (
    create_approval,
    get_approval,
    poll_new_approvals,
    poll_decided_approvals,
)


@flow(name="okrunit-approval-gate", log_prints=True)
async def approval_gate(
    title: str,
    priority: str = "medium",
    description: str | None = None,
    metadata: dict | None = None,
    timeout_seconds: int = 3600,
    poll_interval: int = 10,
    fail_on_reject: bool = True,
    api_key: str | None = None,
    api_url: str = "https://app.okrunit.com",
) -> dict:
    """Create an approval request and wait for a human decision.

    Creates an OKRunit approval, then polls until a decision is made or
    the timeout is reached. Returns the final approval object.

    Raises an exception if the approval is rejected (when fail_on_reject=True)
    or if the timeout is exceeded.
    """
    logger = get_run_logger()

    approval = await create_approval(
        title=title,
        priority=priority,
        description=description,
        metadata=metadata,
        api_key=api_key,
        api_url=api_url,
    )
    approval_id = approval["id"]
    logger.info(f"Created approval {approval_id}: {title}")
    logger.info(f"Waiting for decision (timeout: {timeout_seconds}s)...")

    import time

    deadline = time.time() + timeout_seconds

    while time.time() < deadline:
        result = await get_approval(
            approval_id=approval_id,
            api_key=api_key,
            api_url=api_url,
        )

        if result["status"] in ("approved", "rejected"):
            decided_by = result.get("decided_by_name", "unknown")
            comment = result.get("decision_comment", "")
            logger.info(
                f"Approval {approval_id} was {result['status']} by {decided_by}"
                + (f": {comment}" if comment else "")
            )

            if result["status"] == "rejected" and fail_on_reject:
                raise Exception(
                    f"Approval rejected by {decided_by}"
                    + (f": {comment}" if comment else "")
                )

            return result

        elapsed = int(time.time() - (deadline - timeout_seconds))
        logger.info(f"Still waiting... ({elapsed}s elapsed)")
        await asyncio.sleep(poll_interval)

    raise TimeoutError(
        f"Approval {approval_id} timed out after {timeout_seconds}s"
    )


@flow(name="okrunit-watch-new-approvals", log_prints=True)
async def watch_new_approvals(
    status: str | None = None,
    priority: str | None = None,
    cursor: str | None = None,
    max_iterations: int = 0,
    poll_interval: int = 30,
    limit: int = 25,
    api_key: str | None = None,
    api_url: str = "https://app.okrunit.com",
) -> list[dict]:
    """Watch for new approval requests by polling on a schedule.

    Polls GET /api/v1/approvals and returns approvals created after the cursor
    timestamp. Tracks cursor state between iterations so only new approvals are
    returned on each poll.

    When max_iterations is 0 (default), runs a single poll and returns. Set
    max_iterations > 1 for continuous watching (useful with Prefect schedules).

    Args:
        status: Optional status filter.
        priority: Optional priority filter.
        cursor: ISO 8601 timestamp to start from. Defaults to now.
        max_iterations: Number of poll cycles. 0 means single poll.
        poll_interval: Seconds between polls when max_iterations > 1.
        limit: Maximum results per poll.
        api_key: OKRunit API key.
        api_url: Base URL for the OKRunit API.

    Returns:
        List of all new approvals found across all iterations.
    """
    logger = get_run_logger()

    if cursor is None:
        cursor = datetime.now(timezone.utc).isoformat()

    iterations = max(max_iterations, 1)
    all_new: list[dict] = []

    for i in range(iterations):
        logger.info(f"Polling for new approvals (iteration {i + 1}, cursor={cursor})")

        new_approvals = await poll_new_approvals(
            cursor=cursor,
            status=status,
            priority=priority,
            limit=limit,
            api_key=api_key,
            api_url=api_url,
        )

        if new_approvals:
            logger.info(f"Found {len(new_approvals)} new approval(s)")
            for a in new_approvals:
                logger.info(f"  - {a.get('id')}: {a.get('title')} ({a.get('status')})")
            # Advance cursor to the most recent created_at
            cursor = new_approvals[0].get("created_at", cursor)
            all_new.extend(new_approvals)
        else:
            logger.info("No new approvals found")

        if i < iterations - 1:
            await asyncio.sleep(poll_interval)

    logger.info(f"Watch complete. Total new approvals found: {len(all_new)}")
    return all_new


@flow(name="okrunit-watch-decided-approvals", log_prints=True)
async def watch_decided_approvals(
    decision: str | None = None,
    priority: str | None = None,
    cursor: str | None = None,
    max_iterations: int = 0,
    poll_interval: int = 30,
    limit: int = 25,
    api_key: str | None = None,
    api_url: str = "https://app.okrunit.com",
) -> list[dict]:
    """Watch for approvals that have been approved or rejected.

    Polls GET /api/v1/approvals for decided approvals (approved/rejected)
    updated after the cursor timestamp. Tracks cursor state between iterations.

    When max_iterations is 0 (default), runs a single poll and returns. Set
    max_iterations > 1 for continuous watching (useful with Prefect schedules).

    Args:
        decision: Optional filter: 'approved', 'rejected', or None for both.
        priority: Optional priority filter.
        cursor: ISO 8601 timestamp to start from. Defaults to now.
        max_iterations: Number of poll cycles. 0 means single poll.
        poll_interval: Seconds between polls when max_iterations > 1.
        limit: Maximum results per poll.
        api_key: OKRunit API key.
        api_url: Base URL for the OKRunit API.

    Returns:
        List of all decided approvals found across all iterations.
    """
    logger = get_run_logger()

    if cursor is None:
        cursor = datetime.now(timezone.utc).isoformat()

    iterations = max(max_iterations, 1)
    all_decided: list[dict] = []

    for i in range(iterations):
        logger.info(f"Polling for decided approvals (iteration {i + 1}, cursor={cursor})")

        decided = await poll_decided_approvals(
            cursor=cursor,
            decision=decision,
            priority=priority,
            limit=limit,
            api_key=api_key,
            api_url=api_url,
        )

        if decided:
            logger.info(f"Found {len(decided)} decided approval(s)")
            for a in decided:
                logger.info(
                    f"  - {a.get('id')}: {a.get('title')} -> {a.get('status')}"
                    f" by {a.get('decided_by_name', 'unknown')}"
                )
            # Advance cursor to the most recent updated_at
            cursor = decided[0].get("updated_at", cursor)
            all_decided.extend(decided)
        else:
            logger.info("No decided approvals found")

        if i < iterations - 1:
            await asyncio.sleep(poll_interval)

    logger.info(f"Watch complete. Total decided approvals found: {len(all_decided)}")
    return all_decided

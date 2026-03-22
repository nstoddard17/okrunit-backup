"""OKRunit Prefect flows for human-in-the-loop approval gates."""

import asyncio

from prefect import flow, get_run_logger

from .tasks import create_approval, get_approval


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

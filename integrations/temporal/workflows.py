"""OKRunit Temporal workflows for human-in-the-loop approval gates."""

from datetime import timedelta

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from .activities import OKRunitConfig, create_approval, get_approval


@workflow.defn
class ApprovalGateWorkflow:
    """Workflow that creates an approval and waits for a human decision.

    Creates an OKRunit approval request, then polls until a decision is made
    or the timeout is reached. Returns the final approval object.

    Usage via temporal CLI:
        temporal workflow start \\
          --type ApprovalGateWorkflow \\
          --task-queue okrunit \\
          --input '{"config": {"api_key": "gk_...", "api_url": "https://app.okrunit.com"}, "title": "Deploy v2.3.1", "priority": "high"}'
    """

    def __init__(self) -> None:
        self._current_status: str = "initializing"

    @workflow.run
    async def run(
        self,
        config: OKRunitConfig,
        title: str,
        priority: str = "medium",
        description: str | None = None,
        metadata: dict | None = None,
        callback_url: str | None = None,
        timeout_seconds: int = 3600,
        poll_interval_seconds: int = 10,
    ) -> dict:
        """Create an approval and poll until decided or timed out."""
        self._current_status = "creating"

        # Create the approval request
        approval = await workflow.execute_activity(
            create_approval,
            args=[config, title, priority, description, metadata, callback_url],
            start_to_close_timeout=timedelta(seconds=30),
        )

        approval_id = approval["id"]
        self._current_status = f"waiting:{approval_id}"

        workflow.logger.info(f"Created approval {approval_id}: {title}")
        workflow.logger.info(
            f"Waiting for decision (timeout: {timeout_seconds}s)..."
        )

        # Poll until decided or timeout
        deadline = workflow.now() + timedelta(seconds=timeout_seconds)

        while workflow.now() < deadline:
            result = await workflow.execute_activity(
                get_approval,
                args=[config, approval_id],
                start_to_close_timeout=timedelta(seconds=30),
            )

            if result["status"] in ("approved", "rejected"):
                self._current_status = result["status"]
                decided_by = result.get("decided_by_name", "unknown")
                workflow.logger.info(
                    f"Approval {approval_id} was {result['status']} by {decided_by}"
                )
                return result

            await workflow.sleep(poll_interval_seconds)

        self._current_status = "timed_out"
        raise TimeoutError(
            f"Approval {approval_id} timed out after {timeout_seconds}s"
        )

    @workflow.query
    def current_status(self) -> str:
        """Query the current status of the approval workflow."""
        return self._current_status

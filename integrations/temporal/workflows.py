"""OKRunit Temporal workflows for human-in-the-loop approval gates."""

from datetime import timedelta

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from .activities import (
        OKRunitConfig,
        create_approval,
        get_approval,
        poll_new_approvals,
        poll_decided_approvals,
    )


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


@workflow.defn
class NewApprovalWatcherWorkflow:
    """Workflow that polls for new approval requests on a schedule.

    Runs continuously, polling OKRunit for new approvals created since the last
    cursor. Each new approval is yielded via a signal so downstream workflows
    or activities can react to it.

    Usage via temporal CLI:
        temporal workflow start \\
          --type NewApprovalWatcherWorkflow \\
          --task-queue okrunit \\
          --input '{"config": {"api_key": "gk_...", "api_url": "https://app.okrunit.com"}, "poll_interval_seconds": 30}'

    Query ``current_cursor`` to see the latest poll position.
    """

    def __init__(self) -> None:
        self._cursor: str | None = None
        self._should_stop: bool = False
        self._total_found: int = 0

    @workflow.signal
    async def stop(self) -> None:
        """Signal the watcher to stop after the current poll cycle."""
        self._should_stop = True

    @workflow.run
    async def run(
        self,
        config: OKRunitConfig,
        poll_interval_seconds: int = 30,
        status: str | None = None,
        priority: str | None = None,
        initial_cursor: str | None = None,
    ) -> dict:
        """Poll for new approvals until stopped.

        Returns summary with total approvals found and final cursor position.
        """
        self._cursor = initial_cursor

        workflow.logger.info(
            f"Starting NewApprovalWatcherWorkflow (interval: {poll_interval_seconds}s)"
        )

        while not self._should_stop:
            result = await workflow.execute_activity(
                poll_new_approvals,
                args=[config, self._cursor, status, priority],
                start_to_close_timeout=timedelta(seconds=30),
            )

            approvals = result["approvals"]
            if approvals:
                self._cursor = result["new_cursor"]
                self._total_found += result["count"]
                workflow.logger.info(
                    f"Found {result['count']} new approval(s), cursor: {self._cursor}"
                )

                # Signal each new approval for downstream processing
                for approval in approvals:
                    workflow.logger.info(
                        f"New approval: {approval['id']} - {approval.get('title', '')}"
                    )

            await workflow.sleep(poll_interval_seconds)

        workflow.logger.info(
            f"Watcher stopped. Total approvals found: {self._total_found}"
        )
        return {
            "total_found": self._total_found,
            "final_cursor": self._cursor,
        }

    @workflow.query
    def current_cursor(self) -> str | None:
        """Query the current cursor position."""
        return self._cursor

    @workflow.query
    def total_found(self) -> int:
        """Query total number of approvals found so far."""
        return self._total_found


@workflow.defn
class ApprovalDecidedWatcherWorkflow:
    """Workflow that polls for decided (approved/rejected) approvals on a schedule.

    Runs continuously, polling OKRunit for approvals that have been decided
    since the last cursor. Each decided approval is logged so downstream
    workflows or activities can react.

    Usage via temporal CLI:
        temporal workflow start \\
          --type ApprovalDecidedWatcherWorkflow \\
          --task-queue okrunit \\
          --input '{"config": {"api_key": "gk_...", "api_url": "https://app.okrunit.com"}, "poll_interval_seconds": 30}'

    Query ``current_cursor`` to see the latest poll position.
    """

    def __init__(self) -> None:
        self._cursor: str | None = None
        self._should_stop: bool = False
        self._total_found: int = 0

    @workflow.signal
    async def stop(self) -> None:
        """Signal the watcher to stop after the current poll cycle."""
        self._should_stop = True

    @workflow.run
    async def run(
        self,
        config: OKRunitConfig,
        poll_interval_seconds: int = 30,
        decision: str | None = None,
        priority: str | None = None,
        initial_cursor: str | None = None,
    ) -> dict:
        """Poll for decided approvals until stopped.

        Returns summary with total decisions found and final cursor position.
        """
        self._cursor = initial_cursor

        workflow.logger.info(
            f"Starting ApprovalDecidedWatcherWorkflow (interval: {poll_interval_seconds}s)"
        )

        while not self._should_stop:
            result = await workflow.execute_activity(
                poll_decided_approvals,
                args=[config, self._cursor, decision, priority],
                start_to_close_timeout=timedelta(seconds=30),
            )

            approvals = result["approvals"]
            if approvals:
                self._cursor = result["new_cursor"]
                self._total_found += result["count"]
                workflow.logger.info(
                    f"Found {result['count']} decided approval(s), cursor: {self._cursor}"
                )

                for approval in approvals:
                    decided_by = approval.get("decided_by_name", "unknown")
                    workflow.logger.info(
                        f"Decision: {approval['id']} {approval['status']} by {decided_by}"
                    )

            await workflow.sleep(poll_interval_seconds)

        workflow.logger.info(
            f"Watcher stopped. Total decisions found: {self._total_found}"
        )
        return {
            "total_found": self._total_found,
            "final_cursor": self._cursor,
        }

    @workflow.query
    def current_cursor(self) -> str | None:
        """Query the current cursor position."""
        return self._cursor

    @workflow.query
    def total_found(self) -> int:
        """Query total number of decisions found so far."""
        return self._total_found

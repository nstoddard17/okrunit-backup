"""OKRunit Dagster sensors for approval triggers."""

from dagster import (
    sensor,
    SensorEvaluationContext,
    RunRequest,
    SkipReason,
    SensorDefinition,
)


def build_new_approval_sensor(
    status: str | None = None,
    priority: str | None = None,
) -> SensorDefinition:
    """Factory that builds a new-approval sensor with optional filters.

    Args:
        status: Filter approvals by status (pending, approved, rejected, etc.).
        priority: Filter approvals by priority (low, medium, high, critical).

    Returns:
        A SensorDefinition that watches for new approval requests.
    """

    @sensor(
        name="new_approval_sensor",
        required_resource_keys={"okrunit"},
        minimum_interval_seconds=30,
    )
    def new_approval_sensor(context: SensorEvaluationContext):
        """Sensor that triggers runs when new OKRunit approvals are created.

        Polls for new approval requests sorted by created_at descending.
        Uses the cursor to track the last seen created_at timestamp and only
        emit new approvals.
        """
        last_cursor = context.cursor or "1970-01-01T00:00:00Z"
        new_cursor = last_cursor
        has_results = False

        kwargs: dict = {"limit": 50}
        if status:
            kwargs["status"] = status
        if priority:
            kwargs["priority"] = priority

        result = context.resources.okrunit.list_approvals(**kwargs)
        approvals = result.get("data", [])

        for approval in approvals:
            created_at = approval.get("created_at")
            if created_at and created_at > last_cursor:
                has_results = True
                yield RunRequest(
                    run_key=f"new-approval-{approval['id']}",
                    run_config={
                        "ops": {
                            "process_new_approval": {
                                "config": {
                                    "approval_id": approval["id"],
                                    "title": approval.get("title", ""),
                                    "status": approval.get("status", ""),
                                    "priority": approval.get("priority", ""),
                                    "source": approval.get("source", ""),
                                    "created_at": approval.get("created_at", ""),
                                }
                            }
                        }
                    },
                )
                if created_at > new_cursor:
                    new_cursor = created_at

        context.update_cursor(new_cursor)

        if not has_results:
            yield SkipReason("No new approval requests")

    return new_approval_sensor


# Default sensor instance (no filters) for convenience
new_approval_sensor = build_new_approval_sensor()


@sensor(required_resource_keys={"okrunit"}, minimum_interval_seconds=30)
def approval_decided_sensor(context: SensorEvaluationContext):
    """Sensor that triggers runs when OKRunit approvals are decided.

    Polls for recently approved and rejected approvals. Uses the cursor
    to track the last seen decision timestamp and only emit new decisions.
    """
    last_cursor = context.cursor or "1970-01-01T00:00:00Z"
    new_cursor = last_cursor
    has_results = False

    for status in ("approved", "rejected"):
        result = context.resources.okrunit.list_approvals(status=status, limit=50)
        approvals = result.get("data", [])

        for approval in approvals:
            decided_at = approval.get("decided_at")
            if decided_at and decided_at > last_cursor:
                has_results = True
                yield RunRequest(
                    run_key=f"approval-{approval['id']}",
                    run_config={
                        "ops": {
                            "process_decision": {
                                "config": {
                                    "approval_id": approval["id"],
                                    "status": approval["status"],
                                    "title": approval.get("title", ""),
                                    "decided_by": approval.get("decided_by_name", ""),
                                }
                            }
                        }
                    },
                )
                if decided_at > new_cursor:
                    new_cursor = decided_at

    context.update_cursor(new_cursor)

    if not has_results:
        yield SkipReason("No new approval decisions")

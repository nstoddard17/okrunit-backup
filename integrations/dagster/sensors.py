"""OKRunit Dagster sensor for detecting approval decisions."""

from dagster import (
    sensor,
    SensorEvaluationContext,
    RunRequest,
    SkipReason,
    SensorDefinition,
)


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

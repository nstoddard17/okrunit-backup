"""OKRunit Dagster example jobs."""

from dagster import job

from .ops import approval_gate_op


@job
def deploy_with_approval():
    """Example job that gates deployment on human approval.

    Usage:
        dagster job launch -j deploy_with_approval
    """
    approval_gate_op()

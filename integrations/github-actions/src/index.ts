import * as core from "@actions/core";
import * as github from "@actions/github";

interface ApprovalResponse {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  action_type: string;
  source: string;
  required_approvals: number;
  current_approvals: number;
  requested_by_name: string;
  metadata: Record<string, unknown>;
  decided_by?: string;
  decided_by_name?: string;
  decided_at?: string;
  decision_comment?: string;
  created_at: string;
  updated_at: string;
}

async function apiRequest(
  method: string,
  url: string,
  apiKey: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OKRunit API error (${resp.status}): ${text}`);
  }

  return resp.json();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run(): Promise<void> {
  try {
    const apiKey = core.getInput("api-key", { required: true });
    const apiUrl = core.getInput("api-url") || "https://app.okrunit.com";
    const inputTitle = core.getInput("title");
    const description = core.getInput("description");
    const priorityInput = core.getInput("priority") || "medium";
    const validPriorities = ["low", "medium", "high", "critical"];
    if (!validPriorities.includes(priorityInput)) {
      core.setFailed(
        `Invalid priority "${priorityInput}". Must be one of: ${validPriorities.join(", ")}`,
      );
      return;
    }
    const priority = priorityInput;
    const metadataInput = core.getInput("metadata");
    const timeout = parseInt(core.getInput("timeout") || "3600", 10);
    const pollInterval = parseInt(core.getInput("poll-interval") || "10", 10);

    const ctx = github.context;

    // Default title includes workflow context
    const title =
      inputTitle ||
      `Approval required: ${ctx.workflow} #${ctx.runNumber}`;

    // Auto-generate idempotency key from run context
    const idempotencyKey = `gha-${ctx.runId}-${ctx.runNumber}-${Date.now()}`;

    // Build metadata with GitHub context
    const githubMeta: Record<string, unknown> = {
      repository: `${ctx.repo.owner}/${ctx.repo.repo}`,
      workflow: ctx.workflow,
      run_id: ctx.runId,
      run_number: ctx.runNumber,
      actor: ctx.actor,
      ref: ctx.ref,
      sha: ctx.sha,
      event_name: ctx.eventName,
    };

    let metadata: Record<string, unknown> = githubMeta;
    if (metadataInput) {
      try {
        const userMeta = JSON.parse(metadataInput);
        metadata = { ...githubMeta, ...userMeta };
      } catch {
        core.warning("Failed to parse metadata input as JSON, using GitHub context only");
      }
    }

    // Create the approval request
    core.info(`Creating approval request: "${title}"`);
    const approval = (await apiRequest(
      "POST",
      `${apiUrl}/api/v1/approvals`,
      apiKey,
      {
        title,
        description: description || undefined,
        priority,
        metadata,
        source: "github-actions",
        idempotency_key: idempotencyKey,
      },
    )) as ApprovalResponse;

    core.info(`Approval created: ${approval.id}`);
    core.info(`Waiting for decision (timeout: ${timeout}s)...`);
    core.setOutput("approval-id", approval.id);

    // Poll until decided or timeout
    const deadline = Date.now() + timeout * 1000;

    while (Date.now() < deadline) {
      await sleep(pollInterval * 1000);

      const result = (await apiRequest(
        "GET",
        `${apiUrl}/api/v1/approvals/${approval.id}`,
        apiKey,
      )) as ApprovalResponse;

      if (result.status === "approved" || result.status === "rejected") {
        core.setOutput("status", result.status);
        core.setOutput("description", result.description || "");
        core.setOutput("priority", result.priority || "");
        core.setOutput("source", result.source || "");
        core.setOutput("action-type", result.action_type || "");
        core.setOutput("required-approvals", result.required_approvals ?? 0);
        core.setOutput("current-approvals", result.current_approvals ?? 0);
        core.setOutput("updated-at", result.updated_at || "");
        core.setOutput("decided-by", result.decided_by_name || "");
        core.setOutput("decided-at", result.decided_at || "");
        core.setOutput("decision-comment", result.decision_comment || "");

        if (result.status === "approved") {
          core.info(
            `Approved by ${result.decided_by_name || "unknown"}${result.decision_comment ? `: ${result.decision_comment}` : ""}`,
          );
          return;
        }

        // Rejected — fail the step
        const msg = result.decision_comment
          ? `Approval rejected by ${result.decided_by_name || "unknown"}: ${result.decision_comment}`
          : `Approval rejected by ${result.decided_by_name || "unknown"}`;
        core.setFailed(msg);
        return;
      }

      // Still pending
      const elapsed = Math.round((Date.now() - (deadline - timeout * 1000)) / 1000);
      core.info(`Still waiting... (${elapsed}s elapsed)`);
    }

    // Timeout
    core.setOutput("status", "timeout");
    core.setFailed(
      `Approval timed out after ${timeout}s. Approval ID: ${approval.id}`,
    );
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("An unexpected error occurred");
    }
  }
}

run();

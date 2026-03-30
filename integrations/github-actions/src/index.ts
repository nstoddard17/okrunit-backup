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
  decision_source?: string;
  risk_score?: number;
  risk_level?: string;
  auto_approved?: boolean;
  execution_status?: string;
  conditions_met?: boolean;
  sla_breached?: boolean;
  expires_at?: string;
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

function parseCommaSeparated(input: string): string[] {
  if (!input) return [];
  return input.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseBooleanInput(input: string): boolean | undefined {
  if (!input) return undefined;
  return input === "true";
}

async function run(): Promise<void> {
  try {
    // ---- Core inputs ----
    const apiKey = core.getInput("api-key", { required: true });
    const apiUrl = core.getInput("api-url") || "https://app.okrunit.com";
    const inputTitle = core.getInput("title");
    const description = core.getInput("description");
    const actionType = core.getInput("action-type");
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

    // ---- Advanced inputs ----
    const contextHtml = core.getInput("context-html");
    const requiredApprovals = parseInt(core.getInput("required-approvals") || "1", 10);
    const assignedApproversInput = core.getInput("assigned-approvers");
    const assignedTeamId = core.getInput("assigned-team-id");
    const isSequential = parseBooleanInput(core.getInput("is-sequential"));
    const autoAction = core.getInput("auto-action");
    const autoActionAfterMinutes = core.getInput("auto-action-after-minutes");
    const callbackUrl = core.getInput("callback-url");
    const callbackHeadersInput = core.getInput("callback-headers");
    const expiresAt = core.getInput("expires-at");
    const requireRejectionReason = parseBooleanInput(core.getInput("require-rejection-reason"));
    const notifyChannelIdsInput = core.getInput("notify-channel-ids");
    const conditionsInput = core.getInput("conditions");

    // ---- Validate auto-action ----
    if (autoAction && !["approve", "reject"].includes(autoAction)) {
      core.setFailed(
        `Invalid auto-action "${autoAction}". Must be "approve" or "reject".`,
      );
      return;
    }

    // ---- Parse complex inputs ----
    const assignedApprovers = parseCommaSeparated(assignedApproversInput);
    const notifyChannelIds = parseCommaSeparated(notifyChannelIdsInput);

    let callbackHeaders: Record<string, string> | undefined;
    if (callbackHeadersInput) {
      try {
        callbackHeaders = JSON.parse(callbackHeadersInput);
      } catch {
        core.warning("Failed to parse callback-headers as JSON, ignoring");
      }
    }

    let conditions: unknown[] | undefined;
    if (conditionsInput) {
      try {
        conditions = JSON.parse(conditionsInput);
      } catch {
        core.warning("Failed to parse conditions as JSON, ignoring");
      }
    }

    // ---- GitHub context ----
    const ctx = github.context;

    const title =
      inputTitle ||
      `Approval required: ${ctx.workflow} #${ctx.runNumber}`;

    const idempotencyKey = `gha-${ctx.runId}-${ctx.runNumber}-${Date.now()}`;

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

    // ---- Build request body ----
    const requestBody: Record<string, unknown> = {
      title,
      description: description || undefined,
      priority,
      metadata,
      source: "github-actions",
      source_url: `https://github.com/${ctx.repo.owner}/${ctx.repo.repo}/actions/runs/${ctx.runId}`,
      idempotency_key: idempotencyKey,
    };

    if (actionType) requestBody.action_type = actionType;
    if (contextHtml) requestBody.context_html = contextHtml;
    if (requiredApprovals > 1) requestBody.required_approvals = requiredApprovals;
    if (assignedApprovers.length > 0) requestBody.assigned_approvers = assignedApprovers;
    if (assignedTeamId) requestBody.assigned_team_id = assignedTeamId;
    if (isSequential) requestBody.is_sequential = isSequential;
    if (autoAction) requestBody.auto_action = autoAction;
    if (autoActionAfterMinutes) requestBody.auto_action_after_minutes = parseInt(autoActionAfterMinutes, 10);
    if (callbackUrl) requestBody.callback_url = callbackUrl;
    if (callbackHeaders) requestBody.callback_headers = callbackHeaders;
    if (expiresAt) requestBody.expires_at = expiresAt;
    if (requireRejectionReason) requestBody.require_rejection_reason = requireRejectionReason;
    if (notifyChannelIds.length > 0) requestBody.notify_channel_ids = notifyChannelIds;
    if (conditions) requestBody.conditions = conditions;

    // ---- Create the approval request ----
    core.info(`Creating approval request: "${title}"`);
    const approval = (await apiRequest(
      "POST",
      `${apiUrl}/api/v1/approvals`,
      apiKey,
      requestBody,
    )) as ApprovalResponse;

    core.info(`Approval created: ${approval.id}`);
    core.info(`Waiting for decision (timeout: ${timeout}s)...`);
    core.setOutput("approval-id", approval.id);

    // ---- Poll until decided or timeout ----
    const deadline = Date.now() + timeout * 1000;

    while (Date.now() < deadline) {
      await sleep(pollInterval * 1000);

      const result = (await apiRequest(
        "GET",
        `${apiUrl}/api/v1/approvals/${approval.id}`,
        apiKey,
      )) as ApprovalResponse;

      if (result.status === "approved" || result.status === "rejected" || result.status === "cancelled" || result.status === "expired") {
        setAllOutputs(result);

        if (result.status === "approved") {
          core.info(
            `Approved by ${result.decided_by_name || "unknown"}${result.decision_comment ? `: ${result.decision_comment}` : ""}`,
          );
          return;
        }

        if (result.status === "cancelled") {
          core.setFailed("Approval request was cancelled");
          return;
        }

        if (result.status === "expired") {
          core.setFailed(`Approval request expired at ${result.expires_at || "unknown time"}`);
          return;
        }

        // Rejected
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

function setAllOutputs(result: ApprovalResponse): void {
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
  core.setOutput("decision-source", result.decision_source || "");
  core.setOutput("risk-score", result.risk_score ?? "");
  core.setOutput("risk-level", result.risk_level || "");
  core.setOutput("auto-approved", result.auto_approved ?? false);
  core.setOutput("execution-status", result.execution_status || "");
  core.setOutput("conditions-met", result.conditions_met ?? false);
  core.setOutput("sla-breached", result.sla_breached ?? false);
  core.setOutput("expires-at", result.expires_at || "");
  core.setOutput("metadata", JSON.stringify(result.metadata || {}));
}

run();

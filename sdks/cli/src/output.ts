// ---------------------------------------------------------------------------
// OKRunit CLI -- Output Formatting
// ---------------------------------------------------------------------------

import type { Approval, Comment } from "@okrunit/sdk";

export type OutputFormat = "table" | "json";

export function formatApproval(approval: Approval, format: OutputFormat): string {
  if (format === "json") return JSON.stringify(approval, null, 2);

  const lines = [
    `ID:       ${approval.id}`,
    `Title:    ${approval.title}`,
    `Status:   ${approval.status}`,
    `Priority: ${approval.priority}`,
    `Type:     ${approval.action_type}`,
    `Created:  ${approval.created_at}`,
  ];

  if (approval.decided_at) {
    lines.push(`Decided:  ${approval.decided_at}`);
    lines.push(`Decision: ${approval.decision_source ?? "unknown"}`);
    if (approval.decision_comment) {
      lines.push(`Comment:  ${approval.decision_comment}`);
    }
  }

  if (approval.risk_level) {
    lines.push(`Risk:     ${approval.risk_level} (${approval.risk_score})`);
  }

  return lines.join("\n");
}

export function formatApprovalList(approvals: Approval[], total: number, format: OutputFormat): string {
  if (format === "json") return JSON.stringify({ data: approvals, total }, null, 2);

  if (approvals.length === 0) return "No approvals found.";

  const header = `${"ID".padEnd(38)} ${"STATUS".padEnd(10)} ${"PRIORITY".padEnd(10)} TITLE`;
  const separator = "-".repeat(90);
  const rows = approvals.map(
    (a) =>
      `${a.id.padEnd(38)} ${a.status.padEnd(10)} ${a.priority.padEnd(10)} ${a.title.slice(0, 50)}`,
  );

  return [header, separator, ...rows, "", `Total: ${total}`].join("\n");
}

export function formatComment(comment: Comment, format: OutputFormat): string {
  if (format === "json") return JSON.stringify(comment, null, 2);
  const author = comment.user_id ?? comment.connection_id ?? "system";
  return `[${comment.created_at}] ${author}: ${comment.body}`;
}

export function formatCommentList(comments: Comment[], format: OutputFormat): string {
  if (format === "json") return JSON.stringify(comments, null, 2);
  if (comments.length === 0) return "No comments.";
  return comments.map((c) => formatComment(c, "table")).join("\n");
}

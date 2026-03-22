// ---------------------------------------------------------------------------
// OKRunit CLI -- Output formatting helpers
// ---------------------------------------------------------------------------

import type { Approval, Comment } from "@okrunit/sdk";

// ---- Table rendering ------------------------------------------------------

interface Column {
  header: string;
  width: number;
  align?: "left" | "right";
  get: (row: Record<string, unknown>) => string;
}

function pad(value: string, width: number, align: "left" | "right" = "left"): string {
  const truncated = value.length > width ? value.slice(0, width - 1) + "\u2026" : value;
  return align === "right"
    ? truncated.padStart(width)
    : truncated.padEnd(width);
}

function renderTable(columns: Column[], rows: Record<string, unknown>[]): string {
  const header = columns.map((c) => pad(c.header, c.width, c.align)).join("  ");
  const separator = columns.map((c) => "-".repeat(c.width)).join("  ");
  const body = rows.map((row) =>
    columns.map((c) => pad(c.get(row), c.width, c.align)).join("  "),
  );

  return [header, separator, ...body].join("\n");
}

// ---- Status/priority formatting -------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
  expired: "EXPIRED",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "low",
  medium: "med",
  high: "HIGH",
  critical: "CRIT",
};

function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function formatPriority(priority: string): string {
  return PRIORITY_LABELS[priority] ?? priority;
}

function formatAge(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// ---- Public formatters ----------------------------------------------------

export function formatApprovalTable(approvals: Approval[]): string {
  if (approvals.length === 0) {
    return "No approvals found.";
  }

  const columns: Column[] = [
    { header: "ID", width: 8, get: (r) => String(r.id).slice(0, 8) },
    { header: "STATUS", width: 10, get: (r) => formatStatus(String(r.status)) },
    { header: "PRI", width: 4, get: (r) => formatPriority(String(r.priority)) },
    { header: "AGE", width: 5, align: "right", get: (r) => formatAge(String(r.created_at)) },
    { header: "TITLE", width: 50, get: (r) => String(r.title) },
  ];

  return renderTable(columns, approvals as unknown as Record<string, unknown>[]);
}

export function formatApprovalDetail(approval: Approval): string {
  const lines: string[] = [
    `ID:          ${approval.id}`,
    `Title:       ${approval.title}`,
    `Status:      ${formatStatus(approval.status)}`,
    `Priority:    ${approval.priority}`,
    `Source:      ${approval.source ?? "(none)"}`,
    `Created:     ${approval.created_at}`,
  ];

  if (approval.description) {
    lines.push(`Description: ${approval.description}`);
  }

  if (approval.decided_at) {
    lines.push(`Decided at:  ${approval.decided_at}`);
    lines.push(`Decided by:  ${approval.decided_by_name ?? approval.decided_by ?? "(unknown)"}`);
    if (approval.decision_comment) {
      lines.push(`Comment:     ${approval.decision_comment}`);
    }
  }

  if (approval.expires_at) {
    lines.push(`Expires at:  ${approval.expires_at}`);
  }

  if (approval.metadata && Object.keys(approval.metadata).length > 0) {
    lines.push(`Metadata:    ${JSON.stringify(approval.metadata)}`);
  }

  return lines.join("\n");
}

export function formatCommentList(comments: Comment[]): string {
  if (comments.length === 0) {
    return "No comments.";
  }

  return comments
    .map((c) => {
      const author = c.user_id ?? c.connection_id ?? "system";
      const date = new Date(c.created_at).toLocaleString();
      return `[${date}] ${author}:\n  ${c.body}`;
    })
    .join("\n\n");
}

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

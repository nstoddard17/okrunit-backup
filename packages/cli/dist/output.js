"use strict";
// ---------------------------------------------------------------------------
// OKRunit CLI -- Output formatting helpers
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatApprovalTable = formatApprovalTable;
exports.formatApprovalDetail = formatApprovalDetail;
exports.formatCommentList = formatCommentList;
exports.formatJson = formatJson;
function pad(value, width, align = "left") {
    const truncated = value.length > width ? value.slice(0, width - 1) + "\u2026" : value;
    return align === "right"
        ? truncated.padStart(width)
        : truncated.padEnd(width);
}
function renderTable(columns, rows) {
    const header = columns.map((c) => pad(c.header, c.width, c.align)).join("  ");
    const separator = columns.map((c) => "-".repeat(c.width)).join("  ");
    const body = rows.map((row) => columns.map((c) => pad(c.get(row), c.width, c.align)).join("  "));
    return [header, separator, ...body].join("\n");
}
// ---- Status/priority formatting -------------------------------------------
const STATUS_LABELS = {
    pending: "PENDING",
    approved: "APPROVED",
    rejected: "REJECTED",
    cancelled: "CANCELLED",
    expired: "EXPIRED",
};
const PRIORITY_LABELS = {
    low: "low",
    medium: "med",
    high: "HIGH",
    critical: "CRIT",
};
function formatStatus(status) {
    return STATUS_LABELS[status] ?? status;
}
function formatPriority(priority) {
    return PRIORITY_LABELS[priority] ?? priority;
}
function formatAge(createdAt) {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60)
        return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}
// ---- Public formatters ----------------------------------------------------
function formatApprovalTable(approvals) {
    if (approvals.length === 0) {
        return "No approvals found.";
    }
    const columns = [
        { header: "ID", width: 8, get: (r) => String(r.id).slice(0, 8) },
        { header: "STATUS", width: 10, get: (r) => formatStatus(String(r.status)) },
        { header: "PRI", width: 4, get: (r) => formatPriority(String(r.priority)) },
        { header: "AGE", width: 5, align: "right", get: (r) => formatAge(String(r.created_at)) },
        { header: "TITLE", width: 50, get: (r) => String(r.title) },
    ];
    return renderTable(columns, approvals);
}
function formatApprovalDetail(approval) {
    const lines = [
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
function formatCommentList(comments) {
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
function formatJson(data) {
    return JSON.stringify(data, null, 2);
}
//# sourceMappingURL=output.js.map
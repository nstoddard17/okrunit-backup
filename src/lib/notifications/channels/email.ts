// ---------------------------------------------------------------------------
// OKRunit -- Email Notification Channel (Resend)
// ---------------------------------------------------------------------------

import { Resend } from "resend";
import { emailLayout, escapeHtml } from "@/lib/email/layout";

const FROM_EMAIL =
  process.env.EMAIL_FROM || "OKRunit <noreply@okrunit.com>";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailNotificationParams {
  to: string;
  subject: string;
  requestId: string;
  title: string;
  description?: string;
  priority: string;
  approveToken: string;
  rejectToken: string;
}

export interface DecisionEmailParams {
  to: string;
  subject: string;
  requestTitle: string;
  decision: string;
  decidedBy?: string;
  comment?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Lazily initialised Resend client. Returns null if RESEND_API_KEY is not set. */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

/** Map a priority string to its display colour. */
function priorityConfig(priority: string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
} {
  const configs: Record<
    string,
    { bg: string; text: string; border: string; dot: string; label: string }
  > = {
    critical: {
      bg: "#fef2f2",
      text: "#991b1b",
      border: "#fecaca",
      dot: "#dc2626",
      label: "Critical",
    },
    high: {
      bg: "#fff7ed",
      text: "#9a3412",
      border: "#fed7aa",
      dot: "#ea580c",
      label: "High",
    },
    medium: {
      bg: "#fefce8",
      text: "#854d0e",
      border: "#fef08a",
      dot: "#ca8a04",
      label: "Medium",
    },
    low: {
      bg: "#f0fdf4",
      text: "#166534",
      border: "#bbf7d0",
      dot: "#16a34a",
      label: "Low",
    },
  };

  return configs[priority] ?? configs.medium!;
}

// ---------------------------------------------------------------------------
// Email Templates (exported for preview page)
// ---------------------------------------------------------------------------

export function buildApprovalEmailHtml(params: EmailNotificationParams): string {
  const approveUrl = `${APP_URL}/api/email-actions/${params.approveToken}`;
  const rejectUrl = `${APP_URL}/api/email-actions/${params.rejectToken}`;
  const dashboardUrl = `${APP_URL}/dashboard#request-${params.requestId}`;
  const p = priorityConfig(params.priority);

  const descriptionBlock = params.description
    ? `<p style="margin:8px 0 0;color:#64748b;font-size:14px;line-height:22px;">${escapeHtml(params.description)}</p>`
    : "";

  const body = `
    <!-- Icon + heading -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <div style="width:48px;height:48px;border-radius:12px;background:#eef2ff;text-align:center;line-height:48px;margin:0 auto 20px;">
            <span style="font-size:24px;">&#128276;</span>
          </div>
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;text-align:center;">Approval Required</h1>
          <p style="margin:0;font-size:15px;color:#64748b;line-height:22px;text-align:center;">A new request is waiting for your review.</p>
        </td>
      </tr>
    </table>

    <!-- Divider -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td style="border-top:1px solid #e2e8f0;"></td></tr>
    </table>

    <!-- Request details card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Request</p>
          <p style="margin:0;color:#0f172a;font-size:17px;font-weight:600;line-height:24px;">${escapeHtml(params.title)}</p>
          ${descriptionBlock}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;">
          <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Priority</p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:${p.bg};border:1px solid ${p.border};border-radius:20px;padding:4px 14px 4px 10px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:6px;">
                      <div style="width:8px;height:8px;border-radius:50%;background:${p.dot};"></div>
                    </td>
                    <td style="vertical-align:middle;">
                      <span style="font-size:13px;font-weight:600;color:${p.text};letter-spacing:0.2px;">${p.label}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Action buttons -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td align="center" width="50%" style="padding-right:6px;">
          <a href="${approveUrl}" style="display:block;padding:14px 24px;background:#16a34a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;text-align:center;box-shadow:0 1px 2px rgba(22,163,74,0.3);">Approve</a>
        </td>
        <td align="center" width="50%" style="padding-left:6px;">
          <a href="${rejectUrl}" style="display:block;padding:14px 24px;background:#ffffff;color:#dc2626;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;text-align:center;border:1.5px solid #fecaca;">Reject</a>
        </td>
      </tr>
    </table>

    <!-- Dashboard link -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
      <tr>
        <td align="center">
          <a href="${dashboardUrl}" style="color:#6366f1;font-size:13px;font-weight:500;text-decoration:none;">View in Dashboard &rarr;</a>
        </td>
      </tr>
    </table>
  `;

  return emailLayout({
    body,
    preheader: `New approval request: ${params.title}`,
    footerText:
      "This action link expires in 72 hours. If you did not expect this email, you can safely ignore it.",
  });
}

export function buildDecisionEmailHtml(params: DecisionEmailParams): string {
  const dashboardUrl = `${APP_URL}/dashboard`;

  const isApproved = params.decision === "approved";
  const statusColor = isApproved ? "#16a34a" : "#dc2626";
  const statusBg = isApproved ? "#f0fdf4" : "#fef2f2";
  const statusBorder = isApproved ? "#bbf7d0" : "#fecaca";
  const statusLabel = isApproved ? "Approved" : "Rejected";
  const statusEmoji = isApproved ? "&#9989;" : "&#10060;";

  const decidedByBlock = params.decidedBy
    ? `<tr>
        <td style="padding:14px 24px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Decided By</p>
          <p style="margin:0;color:#0f172a;font-size:14px;font-weight:500;">${escapeHtml(params.decidedBy)}</p>
        </td>
      </tr>`
    : "";

  const commentBlock = params.comment
    ? `<tr>
        <td style="padding:14px 24px;">
          <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Comment</p>
          <p style="margin:0;color:#334155;font-size:14px;line-height:22px;font-style:italic;">&ldquo;${escapeHtml(params.comment)}&rdquo;</p>
        </td>
      </tr>`
    : "";

  const body = `
    <!-- Icon + heading -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <div style="width:48px;height:48px;border-radius:12px;background:${statusBg};border:1px solid ${statusBorder};text-align:center;line-height:48px;margin:0 auto 20px;">
            <span style="font-size:22px;">${statusEmoji}</span>
          </div>
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;text-align:center;">Request ${statusLabel}</h1>
          <p style="margin:0;font-size:15px;color:#64748b;line-height:22px;text-align:center;">A decision has been made on your approval request.</p>
        </td>
      </tr>
    </table>

    <!-- Divider -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td style="border-top:1px solid #e2e8f0;"></td></tr>
    </table>

    <!-- Request details card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:14px 24px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Request</p>
          <p style="margin:0;color:#0f172a;font-size:16px;font-weight:600;">${escapeHtml(params.requestTitle)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 24px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Decision</p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:${statusBg};border:1px solid ${statusBorder};border-radius:20px;padding:4px 14px 4px 10px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:6px;">
                      <div style="width:8px;height:8px;border-radius:50%;background:${statusColor};"></div>
                    </td>
                    <td style="vertical-align:middle;">
                      <span style="font-size:13px;font-weight:600;color:${statusColor};">${statusLabel}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${decidedByBlock}
      ${commentBlock}
    </table>

    <!-- Dashboard button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td align="center">
          <a href="${dashboardUrl}" style="display:inline-block;padding:14px 36px;background:#0f172a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.2);">View in Dashboard</a>
        </td>
      </tr>
    </table>
  `;

  return emailLayout({
    body,
    preheader: `${params.requestTitle} has been ${params.decision}`,
    footerText:
      "You received this email because you are a member of this OKRunit organization.",
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send an approval notification email with one-click approve/reject links.
 *
 * Handles missing `RESEND_API_KEY` gracefully by logging a warning and
 * skipping the send -- this allows local development without email
 * infrastructure.
 */
export async function sendApprovalEmail(
  params: EmailNotificationParams,
): Promise<void> {
  const resend = getResendClient();

  if (!resend) {
    console.warn(
      "[Email] RESEND_API_KEY is not set -- skipping approval email to",
      params.to,
    );
    return;
  }

  try {
    const html = buildApprovalEmailHtml(params);

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html,
    });

    if (error) {
      console.error("[Email] Resend API error:", error);
      return;
    }

    console.log(
      `[Email] Approval email sent to ${params.to} for request ${params.requestId}`,
    );
  } catch (err) {
    console.error("[Email] Failed to send approval email:", err);
  }
}

/**
 * Send a notification about a decision (approved/rejected/cancelled).
 *
 * Like `sendApprovalEmail`, gracefully degrades when Resend is not configured.
 */
export async function sendDecisionEmail(
  params: DecisionEmailParams,
): Promise<void> {
  const resend = getResendClient();

  if (!resend) {
    console.warn(
      "[Email] RESEND_API_KEY is not set -- skipping decision email to",
      params.to,
    );
    return;
  }

  try {
    const html = buildDecisionEmailHtml(params);

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html,
    });

    if (error) {
      console.error("[Email] Resend API error:", error);
      return;
    }

    console.log(
      `[Email] Decision email sent to ${params.to} for "${params.requestTitle}"`,
    );
  } catch (err) {
    console.error("[Email] Failed to send decision email:", err);
  }
}

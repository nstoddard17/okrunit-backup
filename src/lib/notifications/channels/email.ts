// ---------------------------------------------------------------------------
// Gatekeeper -- Email Notification Channel (Resend)
// ---------------------------------------------------------------------------

import { Resend } from "resend";

const FROM_EMAIL =
  process.env.EMAIL_FROM || "Gatekeeper <noreply@gatekeeper.app>";
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

/** Map a priority string to a human-readable coloured badge (inline CSS). */
function priorityBadge(priority: string): string {
  const colors: Record<string, { bg: string; text: string }> = {
    critical: { bg: "#dc2626", text: "#ffffff" },
    high: { bg: "#ea580c", text: "#ffffff" },
    medium: { bg: "#ca8a04", text: "#ffffff" },
    low: { bg: "#16a34a", text: "#ffffff" },
  };

  const c = colors[priority] ?? colors.medium!;
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;background:${c.bg};color:${c.text};text-transform:uppercase;">${priority}</span>`;
}

/** Escape basic HTML entities to prevent XSS in user-supplied strings. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Email Templates
// ---------------------------------------------------------------------------

function buildApprovalEmailHtml(params: EmailNotificationParams): string {
  const approveUrl = `${APP_URL}/api/email-actions/${params.approveToken}`;
  const rejectUrl = `${APP_URL}/api/email-actions/${params.rejectToken}`;
  const dashboardUrl = `${APP_URL}/dashboard#request-${params.requestId}`;

  const descriptionBlock = params.description
    ? `<p style="margin:12px 0 0;color:#4b5563;font-size:14px;">${escapeHtml(params.description)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:#1e293b;padding:24px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Gatekeeper</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">New Approval Request</h2>
            <p style="margin:0;color:#6b7280;font-size:14px;">A new request requires your attention.</p>

            <!-- Request details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
              <tr>
                <td style="padding:16px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Title</p>
                  <p style="margin:0;color:#111827;font-size:16px;font-weight:600;">${escapeHtml(params.title)}</p>
                  ${descriptionBlock}
                </td>
              </tr>
              <tr>
                <td style="padding:16px;">
                  <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Priority</p>
                  ${priorityBadge(params.priority)}
                </td>
              </tr>
            </table>

            <!-- Action buttons -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 4px 8px 0;">
                  <a href="${approveUrl}" style="display:inline-block;padding:12px 32px;background:#16a34a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;">Approve</a>
                </td>
                <td align="center" style="padding:8px 0 8px 4px;">
                  <a href="${rejectUrl}" style="display:inline-block;padding:12px 32px;background:#dc2626;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;">Reject</a>
                </td>
              </tr>
            </table>

            <!-- Dashboard link -->
            <p style="margin:24px 0 0;text-align:center;">
              <a href="${dashboardUrl}" style="color:#2563eb;font-size:13px;text-decoration:underline;">View in Dashboard</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
              This link expires in 72 hours. If you did not expect this email, you can safely ignore it.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildDecisionEmailHtml(params: DecisionEmailParams): string {
  const dashboardUrl = `${APP_URL}/dashboard`;

  const isApproved = params.decision === "approved";
  const statusColor = isApproved ? "#16a34a" : "#dc2626";
  const statusLabel = isApproved ? "Approved" : "Rejected";

  const decidedByBlock = params.decidedBy
    ? `<tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
         <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Decided By</p>
         <p style="margin:0;color:#111827;font-size:14px;">${escapeHtml(params.decidedBy)}</p>
       </td></tr>`
    : "";

  const commentBlock = params.comment
    ? `<tr><td style="padding:12px 16px;">
         <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Comment</p>
         <p style="margin:0;color:#111827;font-size:14px;">${escapeHtml(params.comment)}</p>
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:#1e293b;padding:24px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Gatekeeper</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">Approval Request ${statusLabel}</h2>
            <p style="margin:0;color:#6b7280;font-size:14px;">A decision has been made on the following request.</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Request</p>
                  <p style="margin:0;color:#111827;font-size:16px;font-weight:600;">${escapeHtml(params.requestTitle)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Decision</p>
                  <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;background:${statusColor};color:#ffffff;text-transform:uppercase;">${statusLabel}</span>
                </td>
              </tr>
              ${decidedByBlock}
              ${commentBlock}
            </table>

            <p style="margin:24px 0 0;text-align:center;">
              <a href="${dashboardUrl}" style="color:#2563eb;font-size:13px;text-decoration:underline;">View in Dashboard</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
              You received this email because you are a member of this Gatekeeper organization.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
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

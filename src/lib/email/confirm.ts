// ---------------------------------------------------------------------------
// Gatekeeper -- Email Confirmation Template
// ---------------------------------------------------------------------------

import { emailLayout, escapeHtml } from "@/lib/email/layout";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface ConfirmEmailParams {
  fullName: string;
  confirmLink: string;
}

export function buildConfirmEmailHtml(params: ConfirmEmailParams): string {
  const { fullName, confirmLink } = params;

  const body = `
    <!-- Icon + heading -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#eef2ff,#e0e7ff);border:1px solid #c7d2fe;text-align:center;line-height:56px;margin:0 auto 20px;">
            <span style="font-size:28px;">&#128737;</span>
          </div>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;text-align:center;">Welcome to Gatekeeper</h1>
          <p style="margin:0;font-size:15px;color:#64748b;line-height:24px;text-align:center;">
            Hey ${escapeHtml(fullName)}, thanks for signing up!<br>
            Please confirm your email to get started.
          </p>
        </td>
      </tr>
    </table>

    <!-- Divider -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr><td style="border-top:1px solid #e2e8f0;"></td></tr>
    </table>

    <!-- What you get -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;text-align:center;">What you&rsquo;ll get</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:top;padding-right:12px;font-size:16px;line-height:22px;">&#128737;&#65039;</td>
                    <td style="vertical-align:top;">
                      <p style="margin:0;color:#0f172a;font-size:14px;font-weight:600;line-height:22px;">Human Approval Gates</p>
                      <p style="margin:2px 0 0;color:#64748b;font-size:13px;line-height:20px;">Require sign-off before any destructive action executes.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:top;padding-right:12px;font-size:16px;line-height:22px;">&#9889;</td>
                    <td style="vertical-align:top;">
                      <p style="margin:0;color:#0f172a;font-size:14px;font-weight:600;line-height:22px;">Universal API</p>
                      <p style="margin:2px 0 0;color:#64748b;font-size:13px;line-height:20px;">Works with Zapier, Make, n8n, AI agents, and any custom automation.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:top;padding-right:12px;font-size:16px;line-height:22px;">&#128276;</td>
                    <td style="vertical-align:top;">
                      <p style="margin:0;color:#0f172a;font-size:14px;font-weight:600;line-height:22px;">Multi-Channel Alerts</p>
                      <p style="margin:2px 0 0;color:#64748b;font-size:13px;line-height:20px;">Get notified via email, push, or Slack. Approve from anywhere.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Confirm button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td align="center">
          <a href="${confirmLink}" style="display:inline-block;padding:14px 48px;background:#0f172a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.2);">Confirm Email Address</a>
        </td>
      </tr>
    </table>

    <!-- Alternative link -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
      <tr>
        <td align="center">
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:18px;">
            Or copy and paste this link:<br>
            <a href="${confirmLink}" style="color:#6366f1;font-size:12px;word-break:break-all;text-decoration:none;">${confirmLink}</a>
          </p>
        </td>
      </tr>
    </table>
  `;

  return emailLayout({
    body,
    preheader: "Confirm your email to start using Gatekeeper",
    footerText:
      "If you did not create a Gatekeeper account, you can safely ignore this email.",
  });
}

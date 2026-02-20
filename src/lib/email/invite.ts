// ---------------------------------------------------------------------------
// Gatekeeper -- Team Invite Email Template
// ---------------------------------------------------------------------------

import { emailLayout, escapeHtml } from "@/lib/email/layout";
import { INVITE_EXPIRY_DAYS } from "@/lib/constants";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface InviteEmailParams {
  orgName: string;
  role: string;
  inviteLink: string;
}

export function buildInviteEmailHtml(params: InviteEmailParams): string {
  const { orgName, role, inviteLink } = params;
  const roleArticle = role === "admin" ? "an" : "a";

  const body = `
    <!-- Icon + heading -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <div style="width:48px;height:48px;border-radius:12px;background:#eef2ff;border:1px solid #c7d2fe;text-align:center;line-height:48px;margin:0 auto 20px;">
            <span style="font-size:24px;">&#128075;</span>
          </div>
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;text-align:center;">You&rsquo;re Invited!</h1>
          <p style="margin:0;font-size:15px;color:#64748b;line-height:24px;text-align:center;">
            You&rsquo;ve been invited to join <strong style="color:#0f172a;">${escapeHtml(orgName)}</strong> on Gatekeeper as ${roleArticle} <strong style="color:#0f172a;">${escapeHtml(role)}</strong>.
          </p>
        </td>
      </tr>
    </table>

    <!-- Divider -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td style="border-top:1px solid #e2e8f0;"></td></tr>
    </table>

    <!-- What is Gatekeeper -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;text-align:center;">Your Role</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px auto 0;">
            <tr>
              <td style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:20px;padding:4px 14px 4px 10px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:6px;">
                      <div style="width:8px;height:8px;border-radius:50%;background:#6366f1;"></div>
                    </td>
                    <td style="vertical-align:middle;">
                      <span style="font-size:13px;font-weight:600;color:#4338ca;text-transform:capitalize;">${escapeHtml(role)}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0;color:#64748b;font-size:13px;line-height:20px;text-align:center;">
            As ${roleArticle} ${escapeHtml(role)}, you&rsquo;ll be able to review and act on approval requests from your team&rsquo;s automations and AI agents.
          </p>
        </td>
      </tr>
    </table>

    <!-- Accept button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td align="center">
          <a href="${inviteLink}" style="display:inline-block;padding:14px 48px;background:#0f172a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.2);">Accept Invitation</a>
        </td>
      </tr>
    </table>

    <!-- Alternative link -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
      <tr>
        <td align="center">
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:18px;">
            Or copy and paste this link:<br>
            <a href="${inviteLink}" style="color:#6366f1;font-size:12px;word-break:break-all;text-decoration:none;">${inviteLink}</a>
          </p>
        </td>
      </tr>
    </table>
  `;

  return emailLayout({
    body,
    preheader: `You've been invited to join ${orgName} on Gatekeeper`,
    footerText: `This invitation expires in ${INVITE_EXPIRY_DAYS} days. If you did not expect this email, you can safely ignore it.`,
  });
}

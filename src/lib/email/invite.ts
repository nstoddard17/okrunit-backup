// ---------------------------------------------------------------------------
// OKrunit -- Team Invite Email Template
// ---------------------------------------------------------------------------

import {
  emailButton,
  emailCard,
  emailHeroBanner,
  emailIconCircle,
  emailLayout,
  emailMetadataRows,
  emailTheme,
  escapeHtml,
} from "@/lib/email/layout";
import { INVITE_EXPIRY_DAYS } from "@/lib/constants";

export interface InviteEmailParams {
  orgName: string;
  role: string;
  inviteLink: string;
}

export function buildInviteEmailHtml(params: InviteEmailParams): string {
  const { orgName, role, inviteLink } = params;
  const roleArticle = role === "admin" ? "an" : "a";

  const hero = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        <td align="center">
          <h1 style="margin:0 0 10px;color:${emailTheme.ink};font-size:28px;font-weight:700;line-height:36px;letter-spacing:-0.5px;text-align:center;">
            You\u2019ve been invited!
          </h1>
          <p style="margin:0;color:${emailTheme.text};font-size:15px;line-height:26px;text-align:center;">
            <strong style="color:${emailTheme.ink};">${escapeHtml(orgName)}</strong> has invited you to join their team on OKrunit as ${roleArticle} <strong style="color:${emailTheme.ink};text-transform:capitalize;">${escapeHtml(role)}</strong>.
          </p>
        </td>
      </tr>
    </table>
  `;

  const body = [
    hero,

    emailCard(
      emailMetadataRows([
        {
          label: "Organization",
          valueHtml: `<span style="font-weight:700;color:${emailTheme.ink};">${escapeHtml(orgName)}</span>`,
        },
        {
          label: "Access Level",
          valueHtml: `<span style="text-transform:capitalize;font-weight:700;color:${emailTheme.ink};">${escapeHtml(role)}</span>`,
        },
        {
          label: "What you can do",
          valueHtml:
            "Review approval requests, monitor automation activity, and keep risky actions gated behind a human decision.",
          borderless: true,
        },
      ]),
      { tone: "neutral" },
    ),

    emailCard(
      `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:58px;vertical-align:top;padding-right:16px;">
              ${emailIconCircle("feature-approval.svg", { tone: "brand", size: 44 })}
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;color:${emailTheme.ink};font-size:14px;font-weight:700;line-height:22px;">
                Accept the invite to get started
              </p>
              <p style="margin:6px 0 0;color:${emailTheme.text};font-size:13px;line-height:21px;">
                If you already have an OKrunit account, this link will attach the organization to your existing profile.
              </p>
            </td>
          </tr>
        </table>
      `,
      { tone: "brand", marginTop: 20 },
    ),

    `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
        <tr>
          <td align="center">
            ${emailButton({ label: "Accept Invitation", href: inviteLink })}
          </td>
        </tr>
      </table>
    `,

    `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
        <tr>
          <td align="center">
            <p style="margin:0;color:${emailTheme.muted};font-size:12px;line-height:19px;text-align:center;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="margin:8px 0 0;text-align:center;">
              <a href="${inviteLink}" style="color:${emailTheme.brandDark};font-size:12px;font-weight:700;line-height:19px;word-break:break-all;text-decoration:none;">${inviteLink}</a>
            </p>
            <p style="margin:12px 0 0;color:${emailTheme.subtle};font-size:12px;line-height:19px;text-align:center;">
              This invitation expires in ${INVITE_EXPIRY_DAYS} days.
            </p>
          </td>
        </tr>
      </table>
    `,
  ].join("");

  return emailLayout({
    heroBanner: emailHeroBanner({ image: "team-invite.svg", imageWidth: 160, imageHeight: 120, alt: "Team invitation", compact: true }),
    body,
    preheader: `You've been invited to join ${orgName} on OKrunit`,
    footerText: `This invitation expires in ${INVITE_EXPIRY_DAYS} days. If you did not expect this email, you can safely ignore it.`,
  });
}

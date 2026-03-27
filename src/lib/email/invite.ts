// ---------------------------------------------------------------------------
// OKRunit -- Team Invite Email Template
// ---------------------------------------------------------------------------

import {
  emailButton,
  emailButtonRow,
  emailCard,
  emailHero,
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

  const body = [
    emailHero({
      eyebrow: "Team Invitation",
      title: "You've been invited",
      descriptionHtml: `Join <strong style="color:${emailTheme.ink};">${escapeHtml(orgName)}</strong> on OKRunit as ${roleArticle} <strong style="color:${emailTheme.ink};text-transform:capitalize;">${escapeHtml(role)}</strong>.`,
      supportingHtml: `This invitation expires in ${INVITE_EXPIRY_DAYS} days.`,
    }),
    emailCard(
      `
        ${emailMetadataRows([
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
        ])}
      `,
      { tone: "neutral" },
    ),
    emailCard(
      `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px;vertical-align:top;padding-right:14px;">
              <div style="width:40px;height:40px;border-radius:14px;background:#f0fdf4;border:1px solid #bbf7d0;text-align:center;line-height:40px;">
                <span style="color:${emailTheme.brandDark};font-size:18px;font-weight:700;">&#9733;</span>
              </div>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;color:${emailTheme.ink};font-size:14px;font-weight:700;line-height:22px;">
                Accept the invite to activate your seat
              </p>
              <p style="margin:4px 0 0;color:${emailTheme.text};font-size:13px;line-height:21px;">
                If you already have an OKRunit account, this link will attach the organization to your existing profile.
              </p>
            </td>
          </tr>
        </table>
      `,
      { tone: "brand", marginTop: 20 },
    ),
    emailButtonRow([
      emailButton({
        label: "Accept Invitation",
        href: inviteLink,
      }),
    ]),
    `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
        <tr>
          <td>
            <p style="margin:0;color:${emailTheme.muted};font-size:12px;line-height:19px;">
              If the button is blocked by your email client, open this secure invite link:
            </p>
            <p style="margin:8px 0 0;">
              <a href="${inviteLink}" style="color:${emailTheme.brand};font-size:12px;font-weight:700;line-height:19px;word-break:break-all;text-decoration:none;">${inviteLink}</a>
            </p>
          </td>
        </tr>
      </table>
    `,
  ].join("");

  return emailLayout({
    body,
    preheader: `You've been invited to join ${orgName} on OKRunit`,
    footerText: `This invitation expires in ${INVITE_EXPIRY_DAYS} days. If you did not expect this email, you can safely ignore it.`,
  });
}

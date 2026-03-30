// ---------------------------------------------------------------------------
// OKrunit -- Team Invite Email Template
// ---------------------------------------------------------------------------

import {
  PROD_URL,
  emailButton,
  emailButtonRow,
  emailCard,
  emailHero,
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

  const body = [
    emailHero({
      title: "You\u2019ve been invited!",
      descriptionHtml: `<strong style="color:${emailTheme.ink};">${escapeHtml(orgName)}</strong> has invited you to join their team on OKrunit as ${roleArticle} <strong style="color:${emailTheme.ink};text-transform:capitalize;">${escapeHtml(role)}</strong>.`,
    }),

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

    emailButtonRow([
      emailButton({
        label: "Accept Invitation",
        href: inviteLink,
      }),
    ]),

    `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
        <tr>
          <td>
            <p style="margin:0;color:${emailTheme.muted};font-size:12px;line-height:19px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="margin:8px 0 0;">
              <a href="${inviteLink}" style="color:${emailTheme.brandDark};font-size:12px;font-weight:700;line-height:19px;word-break:break-all;text-decoration:none;">${inviteLink}</a>
            </p>
            <p style="margin:12px 0 0;color:${emailTheme.subtle};font-size:12px;line-height:19px;">
              This invitation expires in ${INVITE_EXPIRY_DAYS} days.
            </p>
          </td>
        </tr>
      </table>
    `,
  ].join("");

  return emailLayout({
    heroBanner: emailHeroBanner({ image: "team-invite.svg", imageWidth: 200, imageHeight: 150, alt: "Team invitation" }),
    body,
    preheader: `You've been invited to join ${orgName} on OKrunit`,
    footerText: `This invitation expires in ${INVITE_EXPIRY_DAYS} days. If you did not expect this email, you can safely ignore it.`,
  });
}

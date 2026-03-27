// ---------------------------------------------------------------------------
// OKRunit -- Email Confirmation Template
// ---------------------------------------------------------------------------

import {
  emailButton,
  emailButtonRow,
  emailCard,
  emailHero,
  emailLayout,
  emailTheme,
  escapeHtml,
} from "@/lib/email/layout";

export interface ConfirmEmailParams {
  fullName: string;
  confirmLink: string;
}

export function buildConfirmEmailHtml(params: ConfirmEmailParams): string {
  const { fullName, confirmLink } = params;

  const features = [
    {
      icon: "&#10003;",
      tone: "brand" as const,
      title: "Human approval gates",
      description:
        "Require a sign-off before destructive actions or high-risk automations execute.",
    },
    {
      icon: "&#8644;",
      tone: "info" as const,
      title: "Universal API",
      description:
        "Connect Zapier, Make, n8n, internal agents, or any custom workflow over HTTP.",
    },
    {
      icon: "&#9889;",
      tone: "warning" as const,
      title: "Multi-channel alerts",
      description:
        "Approve or reject from email, Slack, Teams, Discord, or the dashboard.",
    },
  ];

  const featureRows = features
    .map((feature, index) => {
      const isLast = index === features.length - 1;
      const toneColors = {
        brand: {
          background: "#f0fdf4",
          border: "#bbf7d0",
          text: "#166534",
        },
        info: {
          background: "#eff6ff",
          border: "#bfdbfe",
          text: "#1d4ed8",
        },
        warning: {
          background: "#fff7ed",
          border: "#fed7aa",
          text: "#9a3412",
        },
      }[feature.tone];

      return `
        <tr>
          <td style="padding:0 0 ${isLast ? 0 : 18}px;${isLast ? "" : `border-bottom:1px solid ${emailTheme.divider};`}">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:52px;vertical-align:top;padding-right:14px;">
                  <div style="width:40px;height:40px;border-radius:14px;background:${toneColors.background};border:1px solid ${toneColors.border};text-align:center;line-height:40px;">
                    <span style="color:${toneColors.text};font-size:18px;font-weight:700;">${feature.icon}</span>
                  </div>
                </td>
                <td style="vertical-align:top;">
                  <p style="margin:0;color:${emailTheme.ink};font-size:14px;font-weight:700;line-height:22px;">
                    ${feature.title}
                  </p>
                  <p style="margin:4px 0 0;color:${emailTheme.text};font-size:13px;line-height:21px;">
                    ${feature.description}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${isLast ? "" : `<tr><td style="height:18px;font-size:0;line-height:0;">&nbsp;</td></tr>`}
      `;
    })
    .join("");

  const body = [
    emailHero({
      eyebrow: "Account Setup",
      title: "Confirm your email",
      descriptionHtml: `Hey ${escapeHtml(fullName)}, verify your email address to unlock your workspace and start routing approval flows through OKRunit.`,
    }),
    emailCard(
      `
        <p style="margin:0;color:${emailTheme.ink};font-size:14px;font-weight:700;line-height:22px;">
          Your account is almost ready
        </p>
        <p style="margin:6px 0 0;color:${emailTheme.text};font-size:13px;line-height:21px;">
          Once confirmed, you can connect tools, submit approval requests, and review actions from one place.
        </p>
      `,
      { tone: "brand" },
    ),
    emailButtonRow([
      emailButton({
        label: "Verify Email Address",
        href: confirmLink,
      }),
    ]),
    emailCard(
      `
        <p style="margin:0 0 18px;color:${emailTheme.subtle};font-size:11px;font-weight:700;line-height:16px;letter-spacing:1.2px;text-transform:uppercase;">
          What you unlock
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${featureRows}
        </table>
      `,
      { tone: "neutral", marginTop: 24 },
    ),
    `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
        <tr>
          <td>
            <p style="margin:0;color:${emailTheme.muted};font-size:12px;line-height:19px;">
              Button not working? Use this secure link:
            </p>
            <p style="margin:8px 0 0;">
              <a href="${confirmLink}" style="color:${emailTheme.brand};font-size:12px;font-weight:700;line-height:19px;word-break:break-all;text-decoration:none;">${confirmLink}</a>
            </p>
          </td>
        </tr>
      </table>
    `,
  ].join("");

  return emailLayout({
    body,
    preheader: "Confirm your email to start using OKRunit",
    footerText: "If you did not create an OKRunit account, you can safely ignore this email.",
  });
}

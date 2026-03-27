// ---------------------------------------------------------------------------
// OKRunit -- Welcome Email Template
// ---------------------------------------------------------------------------

import {
  emailButton,
  emailButtonRow,
  emailCard,
  emailHero,
  emailLayout,
  emailTheme,
} from "@/lib/email/layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface WelcomeEmailParams {
  fullName: string;
}

export function buildWelcomeEmailHtml(params: WelcomeEmailParams): string {
  const { fullName } = params;

  const steps = [
    {
      num: "1",
      title: "Create a connection",
      desc: "Generate an API key and wire in the app, agent, or workflow you want to control.",
    },
    {
      num: "2",
      title: "Send your first request",
      desc: "Use the API or playground to submit an approval request with the right context.",
    },
    {
      num: "3",
      title: "Review from anywhere",
      desc: "Approve or reject from the dashboard, email, Slack, Teams, or Discord.",
    },
  ];

  const stepRows = steps
    .map((step, index) => {
      const isLast = index === steps.length - 1;

      return `
        <tr>
          <td style="padding:0 0 ${isLast ? 0 : 18}px;${isLast ? "" : `border-bottom:1px solid ${emailTheme.divider};`}">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:56px;vertical-align:top;padding-right:16px;">
                  <div style="width:42px;height:42px;border-radius:14px;background:${emailTheme.ink};color:#ffffff;text-align:center;line-height:42px;font-size:15px;font-weight:700;">
                    ${step.num}
                  </div>
                </td>
                <td style="vertical-align:top;">
                  <p style="margin:0;color:${emailTheme.ink};font-size:14px;font-weight:700;line-height:22px;">
                    ${step.title}
                  </p>
                  <p style="margin:4px 0 0;color:${emailTheme.text};font-size:13px;line-height:21px;">
                    ${step.desc}
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
      eyebrow: "Welcome",
      title: `You're all set, ${fullName}`,
      descriptionHtml:
        "Your OKRunit account is ready. Here's the fastest way to get from signup to a production-ready approval flow.",
    }),
    emailCard(
      `
        <p style="margin:0 0 18px;color:${emailTheme.subtle};font-size:11px;font-weight:700;line-height:16px;letter-spacing:1.2px;text-transform:uppercase;">
          Launch checklist
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${stepRows}
        </table>
      `,
      { tone: "neutral" },
    ),
    emailCard(
      `
        <p style="margin:0;color:${emailTheme.ink};font-size:14px;font-weight:700;line-height:22px;">
          Recommended first milestone
        </p>
        <p style="margin:6px 0 0;color:${emailTheme.text};font-size:13px;line-height:21px;">
          Connect one workflow, submit one approval request, and review it end-to-end from the dashboard to validate your routing and notification setup.
        </p>
      `,
      { tone: "brand", marginTop: 20 },
    ),
    emailButtonRow([
      emailButton({
        label: "Open Dashboard",
        href: `${APP_URL}/org/overview`,
      }),
      emailButton({
        label: "Read Docs",
        href: `${APP_URL}/docs`,
        variant: "secondary",
        block: true,
      }),
    ]),
  ].join("");

  return emailLayout({
    body,
    preheader: "Your OKRunit account is ready - here's how to get started",
  });
}

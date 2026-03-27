// ---------------------------------------------------------------------------
// OKRunit -- Usage Alert Email Template
// ---------------------------------------------------------------------------

import {
  emailButton,
  emailButtonRow,
  emailCard,
  emailHero,
  emailLayout,
  emailMetadataRows,
  emailPill,
  emailTheme,
  escapeHtml,
} from "@/lib/email/layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface UsageAlertEmailParams {
  orgName: string;
  alerts: { type: string; current: number; limit: number }[];
  plan: string;
}

function formatType(type: string): string {
  switch (type) {
    case "requests": return "Approval Requests";
    case "connections": return "Connections";
    case "team_members": return "Team Members";
    default: return type;
  }
}

export function buildUsageAlertEmailHtml(params: UsageAlertEmailParams): string {
  const { orgName, alerts, plan } = params;

  const alertRows = alerts.map((a) => {
    const pct = Math.round((a.current / a.limit) * 100);
    const tone = a.current >= a.limit ? "danger" : pct >= 90 ? "warning" : "brand";
    const barColor =
      tone === "danger"
        ? emailTheme.danger
        : tone === "warning"
          ? emailTheme.warning
          : emailTheme.brand;
    const statusLabel =
      tone === "danger"
        ? "Limit reached"
        : pct >= 95
          ? "Nearly full"
          : "Approaching limit";

    return `
      <tr>
        <td style="padding:0 0 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:0 0 10px;color:${emailTheme.ink};font-size:14px;font-weight:700;line-height:22px;">
                ${formatType(a.type)}
              </td>
              <td align="right" style="padding:0 0 10px;">
                ${emailPill({ label: `${statusLabel} - ${pct}%`, tone })}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding:0 0 8px;">
                <div style="height:8px;border-radius:999px;background:#e2e8f0;overflow:hidden;">
                  <div style="height:8px;border-radius:999px;background:${barColor};width:${Math.min(pct, 100)}%;"></div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="color:${emailTheme.text};font-size:13px;line-height:20px;">
                ${a.current} of ${a.limit} used
              </td>
              <td align="right" style="color:${emailTheme.text};font-size:13px;line-height:20px;">
                ${Math.max(a.limit - a.current, 0)} remaining
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height:18px;font-size:0;line-height:0;">&nbsp;</td></tr>
    `;
  }).join("");

  const body = [
    emailHero({
      eyebrow: "Billing",
      title: "Usage alert",
      descriptionHtml: `<strong style="color:${emailTheme.ink};">${escapeHtml(orgName)}</strong> is approaching the limits of your <strong style="color:${emailTheme.ink};">${escapeHtml(plan)}</strong> plan.`,
    }),
    emailCard(
      `
        ${emailMetadataRows([
          {
            label: "Organization",
            valueHtml: `<span style="font-weight:700;color:${emailTheme.ink};">${escapeHtml(orgName)}</span>`,
          },
          {
            label: "Current Plan",
            valueHtml: `<span style="font-weight:700;color:${emailTheme.ink};">${escapeHtml(plan)}</span>`,
          },
          {
            label: "Recommended Action",
            valueHtml:
              "Review usage now to avoid hitting limits during active approval windows.",
            borderless: true,
          },
        ])}
      `,
      { tone: "neutral" },
    ),
    emailCard(
      `
        <p style="margin:0 0 18px;color:${emailTheme.subtle};font-size:11px;font-weight:700;line-height:16px;letter-spacing:1.2px;text-transform:uppercase;">
          Capacity at a glance
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${alertRows}
        </table>
      `,
      { tone: "neutral", marginTop: 20 },
    ),
    emailButtonRow([
      emailButton({
        label: "Review Billing",
        href: `${APP_URL}/org/billing`,
      }),
    ]),
  ].join("");

  return emailLayout({
    body,
    preheader: `${orgName} is approaching plan limits`,
    footerText: "You received this email because you are an owner or admin of this organization.",
  });
}

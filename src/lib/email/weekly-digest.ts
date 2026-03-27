// ---------------------------------------------------------------------------
// OKRunit -- Weekly Digest Email Template
// ---------------------------------------------------------------------------

import {
  emailButton,
  emailButtonRow,
  emailCard,
  emailHero,
  emailLayout,
  emailPill,
  emailTheme,
  escapeHtml,
} from "@/lib/email/layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface WeeklyDigestEmailParams {
  fullName: string;
  orgName: string;
  periodStart: string;
  periodEnd: string;
  stats: {
    totalRequests: number;
    approved: number;
    rejected: number;
    pending: number;
    avgResponseTimeHours: number | null;
  };
  topConnections: { name: string; count: number }[];
}

export function buildWeeklyDigestEmailHtml(params: WeeklyDigestEmailParams): string {
  const { fullName, orgName, periodStart, periodEnd, stats, topConnections } = params;

  const approvalRate = stats.totalRequests > 0
    ? Math.round((stats.approved / stats.totalRequests) * 100)
    : 0;

  const statItems = [
    { label: "Total Requests", value: stats.totalRequests, tone: "neutral" as const },
    { label: "Approved", value: stats.approved, tone: "brand" as const },
    { label: "Rejected", value: stats.rejected, tone: "danger" as const },
    { label: "Pending", value: stats.pending, tone: "warning" as const },
  ];

  const statCells = statItems.map((item, index) => {
    const config = {
      neutral: {
        background: "#ffffff",
        border: "#e2e8f0",
        text: emailTheme.ink,
      },
      brand: {
        background: "#f0fdf4",
        border: "#bbf7d0",
        text: emailTheme.brandDark,
      },
      danger: {
        background: "#fef2f2",
        border: "#fecaca",
        text: "#991b1b",
      },
      warning: {
        background: "#fff7ed",
        border: "#fed7aa",
        text: "#9a3412",
      },
    }[item.tone];

    const rightPad = index % 2 === 0 ? "8px" : "0";
    const leftPad = index % 2 === 1 ? "8px" : "0";
    const topPad = index >= 2 ? "8px" : "0";

    return `
      <td width="50%" style="padding:${topPad} ${rightPad} 0 ${leftPad};vertical-align:top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${config.background};border:1px solid ${config.border};border-radius:16px;">
          <tr>
            <td style="padding:18px 18px 16px;">
              <p style="margin:0;color:${config.text};font-size:28px;font-weight:700;line-height:30px;letter-spacing:-0.8px;">
                ${item.value}
              </p>
              <p style="margin:8px 0 0;color:${emailTheme.muted};font-size:11px;font-weight:700;line-height:16px;letter-spacing:1.2px;text-transform:uppercase;">
                ${item.label}
              </p>
            </td>
          </tr>
        </table>
      </td>
    `;
  });

  const statRows = [0, 2]
    .map((start) => `<tr>${statCells.slice(start, start + 2).join("")}</tr>`)
    .join("");

  const connectionRows = topConnections.length > 0
    ? topConnections.map((c) => `
        <tr>
          <td style="padding:0 0 14px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:${emailTheme.ink};font-size:13px;font-weight:700;line-height:20px;">${escapeHtml(c.name)}</td>
                <td align="right" style="color:${emailTheme.text};font-size:13px;line-height:20px;">${c.count}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:14px;font-size:0;line-height:0;">&nbsp;</td></tr>
      `).join("")
    : `<tr><td style="padding:14px 0;color:${emailTheme.muted};font-size:13px;text-align:center;">No activity this week</td></tr>`;

  const responseTimeLabel = stats.avgResponseTimeHours === null
    ? "Not enough data yet"
    : stats.avgResponseTimeHours < 1
      ? `${Math.round(stats.avgResponseTimeHours * 60)} min`
      : `${stats.avgResponseTimeHours.toFixed(1)} hrs`;

  const body = [
    emailHero({
      eyebrow: "Weekly Digest",
      title: `Your week at ${orgName}`,
      descriptionHtml: `Hi ${escapeHtml(fullName)}, here's the latest activity snapshot for <strong style="color:${emailTheme.ink};">${escapeHtml(orgName)}</strong>.`,
      supportingHtml: `${escapeHtml(periodStart)} &ndash; ${escapeHtml(periodEnd)}`,
    }),
    emailCard(
      `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${statRows}
        </table>
      `,
      { tone: "neutral" },
    ),
    emailCard(
      `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 0 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 0 10px;color:${emailTheme.ink};font-size:14px;font-weight:700;line-height:22px;">
                    Approval rate
                  </td>
                  <td align="right" style="padding:0 0 10px;">
                    ${emailPill({
                      label: `${approvalRate}% approved`,
                      tone: approvalRate >= 80 ? "brand" : approvalRate >= 60 ? "warning" : "danger",
                    })}
                  </td>
                </tr>
                <tr>
                  <td colspan="2">
                    <div style="height:8px;border-radius:999px;background:#e2e8f0;overflow:hidden;">
                      <div style="height:8px;border-radius:999px;background:${emailTheme.brand};width:${approvalRate}%;"></div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:16px;border-top:1px solid ${emailTheme.divider};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:${emailTheme.ink};font-size:14px;font-weight:700;line-height:22px;">
                    Average response time
                  </td>
                  <td align="right" style="color:${emailTheme.text};font-size:14px;font-weight:700;line-height:22px;">
                    ${responseTimeLabel}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `,
      { tone: "neutral", marginTop: 20 },
    ),
    emailCard(
      `
        <p style="margin:0 0 18px;color:${emailTheme.subtle};font-size:11px;font-weight:700;line-height:16px;letter-spacing:1.2px;text-transform:uppercase;">
          Top Sources
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${connectionRows}
        </table>
      `,
      { tone: "neutral", marginTop: 20 },
    ),
    emailButtonRow([
      emailButton({
        label: "View Dashboard",
        href: `${APP_URL}/org/overview`,
        variant: "dark",
      }),
    ]),
  ].join("");

  return emailLayout({
    body,
    preheader: `${orgName}: ${stats.totalRequests} requests this week, ${approvalRate}% approval rate`,
    footerText: "You received this weekly digest because you are a member of this organization. Manage preferences in your settings.",
  });
}

// ---------------------------------------------------------------------------
// OKRunit -- Shared Email Layout
// ---------------------------------------------------------------------------
// Premium transactional email shell aligned to the app's V2 design language:
// crisp white surfaces, dark-ink typography, refined borders, and green brand
// actions with a darker control surface.
// ---------------------------------------------------------------------------

/** Escape basic HTML entities to prevent XSS in user-supplied strings. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const emailTheme = {
  pageBackground: "#f4f7f6",
  cardBackground: "#ffffff",
  cardBorder: "#dbe4e0",
  headerBackground: "#0f172a",
  headerText: "#e2e8f0",
  ink: "#0f172a",
  text: "#475569",
  muted: "#64748b",
  subtle: "#94a3b8",
  divider: "#e2e8f0",
  brand: "#16a34a",
  brandBright: "#22c55e",
  brandDark: "#166534",
  success: "#15803d",
  warning: "#ea580c",
  danger: "#dc2626",
  info: "#2563eb",
} as const;

export type EmailTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

type EmailButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "danger-secondary"
  | "dark";

interface EmailHeroOptions {
  eyebrow?: string;
  title: string;
  descriptionHtml: string;
  supportingHtml?: string;
  align?: "left" | "center";
}

interface EmailCardOptions {
  tone?: EmailTone;
  padding?: string;
  marginTop?: number;
}

interface EmailButtonOptions {
  label: string;
  href: string;
  variant?: EmailButtonVariant;
  block?: boolean;
}

interface EmailPillOptions {
  label: string;
  tone?: EmailTone;
  dotColor?: string;
}

interface EmailMetadataRow {
  label: string;
  valueHtml: string;
  borderless?: boolean;
}

function tonePalette(tone: EmailTone) {
  const palettes: Record<
    EmailTone,
    { background: string; border: string; text: string; dot: string }
  > = {
    neutral: {
      background: "#f8fafc",
      border: "#e2e8f0",
      text: "#334155",
      dot: "#64748b",
    },
    brand: {
      background: "#f0fdf4",
      border: "#bbf7d0",
      text: "#166534",
      dot: emailTheme.brand,
    },
    success: {
      background: "#ecfdf3",
      border: "#bbf7d0",
      text: "#166534",
      dot: emailTheme.success,
    },
    warning: {
      background: "#fff7ed",
      border: "#fed7aa",
      text: "#9a3412",
      dot: emailTheme.warning,
    },
    danger: {
      background: "#fef2f2",
      border: "#fecaca",
      text: "#991b1b",
      dot: emailTheme.danger,
    },
    info: {
      background: "#eff6ff",
      border: "#bfdbfe",
      text: "#1d4ed8",
      dot: emailTheme.info,
    },
  };

  return palettes[tone];
}

export function emailHero(options: EmailHeroOptions): string {
  const {
    eyebrow,
    title,
    descriptionHtml,
    supportingHtml,
    align = "left",
  } = options;
  const textAlign = `text-align:${align};`;
  const alignAttr = align === "center" ? ' align="center"' : "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td${alignAttr}>
          ${
            eyebrow
              ? `<p style="margin:0 0 10px;color:${emailTheme.brand};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;${textAlign}">${escapeHtml(eyebrow)}</p>`
              : ""
          }
          <h1 style="margin:0 0 12px;color:${emailTheme.ink};font-size:30px;font-weight:700;line-height:34px;letter-spacing:-0.8px;${textAlign}">
            ${escapeHtml(title)}
          </h1>
          <p style="margin:0;color:${emailTheme.text};font-size:15px;line-height:24px;${textAlign}">
            ${descriptionHtml}
          </p>
          ${
            supportingHtml
              ? `<div style="margin:12px 0 0;color:${emailTheme.muted};font-size:13px;line-height:20px;${textAlign}">${supportingHtml}</div>`
              : ""
          }
        </td>
      </tr>
    </table>
  `;
}

export function emailCard(content: string, options: EmailCardOptions = {}): string {
  const {
    tone = "neutral",
    padding = "22px 24px",
    marginTop = 0,
  } = options;
  const palette = tonePalette(tone);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:${marginTop}px 0 0;background:${palette.background};border:1px solid ${palette.border};border-radius:20px;overflow:hidden;">
      <tr>
        <td style="padding:${padding};">
          ${content}
        </td>
      </tr>
    </table>
  `;
}

export function emailButton(options: EmailButtonOptions): string {
  const { label, href, variant = "primary", block = false } = options;
  const variants: Record<
    EmailButtonVariant,
    { background: string; border: string; color: string; shadow: string }
  > = {
    primary: {
      background: emailTheme.brand,
      border: emailTheme.brand,
      color: "#ffffff",
      shadow: "0 10px 24px rgba(22,163,74,0.18)",
    },
    secondary: {
      background: "#ffffff",
      border: "#cbd5e1",
      color: emailTheme.ink,
      shadow: "none",
    },
    danger: {
      background: emailTheme.danger,
      border: emailTheme.danger,
      color: "#ffffff",
      shadow: "0 10px 24px rgba(220,38,38,0.18)",
    },
    "danger-secondary": {
      background: "#ffffff",
      border: "#fecaca",
      color: emailTheme.danger,
      shadow: "none",
    },
    dark: {
      background: emailTheme.ink,
      border: emailTheme.ink,
      color: "#ffffff",
      shadow: "0 10px 24px rgba(15,23,42,0.16)",
    },
  };

  const c = variants[variant];

  return `<a href="${href}" style="display:${block ? "block" : "inline-block"};padding:14px 22px;background:${c.background};border:1px solid ${c.border};border-radius:14px;color:${c.color};font-size:14px;font-weight:700;line-height:20px;letter-spacing:0.1px;text-decoration:none;text-align:center;box-shadow:${c.shadow};">${escapeHtml(label)}</a>`;
}

export function emailButtonRow(buttons: string[]): string {
  if (buttons.length === 0) return "";

  if (buttons.length === 1) {
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
        <tr>
          <td>
            ${buttons[0]}
          </td>
        </tr>
      </table>
    `;
  }

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td width="50%" style="padding-right:6px;vertical-align:top;">${buttons[0]}</td>
        <td width="50%" style="padding-left:6px;vertical-align:top;">${buttons[1]}</td>
      </tr>
    </table>
  `;
}

export function emailPill(options: EmailPillOptions): string {
  const {
    label,
    tone = "neutral",
    dotColor,
  } = options;
  const palette = tonePalette(tone);
  const dot = dotColor ?? palette.dot;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:${palette.background};border:1px solid ${palette.border};border-radius:999px;padding:6px 12px 6px 10px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;padding-right:8px;">
                <div style="width:8px;height:8px;border-radius:50%;background:${dot};"></div>
              </td>
              <td style="vertical-align:middle;">
                <span style="display:inline-block;color:${palette.text};font-size:12px;font-weight:700;line-height:16px;letter-spacing:0.2px;">${escapeHtml(label)}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export function emailMetadataRows(rows: EmailMetadataRow[]): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows
        .map(
          (row) => `
            <tr>
              <td style="padding:0 0 ${row.borderless ? 0 : 18}px;${
                row.borderless
                  ? ""
                  : `border-bottom:1px solid ${emailTheme.divider};`
              }">
                <p style="margin:0 0 6px;color:${emailTheme.subtle};font-size:11px;font-weight:700;line-height:16px;letter-spacing:1.2px;text-transform:uppercase;">
                  ${escapeHtml(row.label)}
                </p>
                <div style="color:${emailTheme.ink};font-size:14px;font-weight:500;line-height:22px;">
                  ${row.valueHtml}
                </div>
              </td>
            </tr>
            ${row.borderless ? "" : `<tr><td style="height:18px;font-size:0;line-height:0;">&nbsp;</td></tr>`}
          `,
        )
        .join("")}
    </table>
  `;
}

export function emailDivider(marginTop = 24, marginBottom = 24): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:${marginTop}px 0 ${marginBottom}px;">
      <tr>
        <td style="border-top:1px solid ${emailTheme.divider};font-size:0;line-height:0;">&nbsp;</td>
      </tr>
    </table>
  `;
}

export function emailLayout(options: {
  body: string;
  footerText?: string;
  preheader?: string;
}): string {
  const { body, footerText, preheader } = options;

  const preheaderBlock = preheader
    ? `<div style="display:none;font-size:1px;color:${emailTheme.pageBackground};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : "";

  const footerContent =
    footerText ??
    "You received this email because you have an OKRunit account.";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <title>OKRunit</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background-color:${emailTheme.pageBackground};font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  ${preheaderBlock}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background-color:${emailTheme.pageBackground};">
    <tr>
      <td align="center" style="padding:32px 16px 40px;">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">
          <tr>
            <td style="padding:0 0 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <div style="width:40px;height:40px;border-radius:14px;background:${emailTheme.brand};box-shadow:0 12px 24px rgba(22,163,74,0.24);text-align:center;line-height:40px;">
                      <span style="color:#ffffff;font-size:18px;font-weight:700;">&#10003;</span>
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;color:${emailTheme.ink};font-size:22px;font-weight:700;line-height:24px;letter-spacing:-0.6px;">OKRunit</p>
                    <p style="margin:3px 0 0;color:${emailTheme.muted};font-size:12px;line-height:18px;">Human approval for every automation</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${emailTheme.cardBackground};border:1px solid ${emailTheme.cardBorder};border-radius:28px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
                <tr>
                  <td style="padding:0;background:${emailTheme.headerBackground};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="height:6px;background:linear-gradient(90deg, ${emailTheme.brand} 0%, ${emailTheme.brandBright} 42%, ${emailTheme.headerBackground} 100%);font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                      <tr>
                        <td style="padding:18px 32px 20px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align:middle;">
                                <p style="margin:0;color:#86efac;font-size:11px;font-weight:700;line-height:16px;letter-spacing:1.4px;text-transform:uppercase;">Transactional Email</p>
                                <p style="margin:8px 0 0;color:${emailTheme.headerText};font-size:14px;line-height:22px;">Secure updates from your OKRunit workspace.</p>
                              </td>
                              <td align="right" style="vertical-align:middle;padding-left:16px;">
                                <span style="display:inline-block;padding:7px 12px;border-radius:999px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);color:#f8fafc;font-size:11px;font-weight:700;line-height:16px;letter-spacing:0.4px;white-space:nowrap;">Human-in-the-loop</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 32px 30px;">
                    ${body}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 20px 0;">
              <p style="margin:0 0 8px;color:${emailTheme.muted};font-size:12px;line-height:18px;">
                ${escapeHtml(footerContent)}
              </p>
              <p style="margin:0;color:${emailTheme.subtle};font-size:11px;line-height:18px;">
                <a href="${APP_URL}" style="color:${emailTheme.subtle};text-decoration:none;">Dashboard</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/docs" style="color:${emailTheme.subtle};text-decoration:none;">Docs</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}" style="color:${emailTheme.subtle};text-decoration:none;">okrunit.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

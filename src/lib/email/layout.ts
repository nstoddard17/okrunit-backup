// ---------------------------------------------------------------------------
// Gatekeeper -- Shared Email Layout
// ---------------------------------------------------------------------------
// Reusable HTML email shell with consistent branding across all emails.
// Uses table-based layout for maximum email client compatibility.
// ---------------------------------------------------------------------------

/** Escape basic HTML entities to prevent XSS in user-supplied strings. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** Hosted logo URL for email use. */
const LOGO_URL = `${APP_URL}/logo.png`;

/**
 * Wraps email body content in the standard Gatekeeper email layout.
 *
 * Includes:
 * - Branded header with shield icon and app name
 * - Content area with proper padding
 * - Footer with unsubscribe-friendly messaging
 */
export function emailLayout(options: {
  body: string;
  footerText?: string;
  preheader?: string;
}): string {
  const { body, footerText, preheader } = options;

  const preheaderBlock = preheader
    ? `<div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>`
    : "";

  const footerContent =
    footerText ??
    "You received this email because you have a Gatekeeper account.";

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
  <title>Gatekeeper</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  ${preheaderBlock}

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Header -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="${LOGO_URL}" alt="Gatekeeper" width="28" height="28" style="display:block;border:0;outline:none;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:22px;font-weight:700;color:#f1f5f9;letter-spacing:-0.5px;">Gatekeeper</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Content card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.3),0 2px 4px -2px rgba(0,0,0,0.2);">
          <tr>
            <td style="padding:40px 40px 36px;">
              ${body}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:28px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 8px;color:#64748b;font-size:12px;line-height:18px;">
                      ${footerContent}
                    </p>
                    <p style="margin:0;color:#475569;font-size:11px;line-height:16px;">
                      &copy; ${new Date().getFullYear()} Gatekeeper &middot; Human-in-the-loop approval for every automation.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

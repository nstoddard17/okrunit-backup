"use client";

import { useState } from "react";

type EmailTemplate =
  | "confirm"
  | "approval"
  | "decision-approved"
  | "decision-rejected"
  | "invite";

const TEMPLATE_LABELS: Record<EmailTemplate, string> = {
  confirm: "Confirm Email",
  approval: "Approval Request",
  "decision-approved": "Decision: Approved",
  "decision-rejected": "Decision: Rejected",
  invite: "Team Invite",
};

export default function EmailPreviewPage() {
  const [active, setActive] = useState<EmailTemplate>("confirm");

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-[#111] px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#818cf8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-white">
              Email Template Preview
            </h1>
          </div>
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
            Dev Only
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Template tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {(Object.keys(TEMPLATE_LABELS) as EmailTemplate[]).map((key) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                active === key
                  ? "bg-white text-black shadow-md"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {TEMPLATE_LABELS[key]}
            </button>
          ))}
        </div>

        {/* Preview iframe */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl">
          {/* Faux browser chrome */}
          <div className="flex items-center gap-2 border-b border-white/10 bg-[#111] px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
            </div>
            <div className="ml-3 flex-1 rounded-md bg-white/5 px-3 py-1 text-xs text-white/40">
              Email Preview &mdash; {TEMPLATE_LABELS[active]}
            </div>
          </div>

          <iframe
            key={active}
            srcDoc={generatePreviewHtml(active)}
            className="w-full border-0"
            style={{ height: "900px" }}
            title={`Email preview: ${TEMPLATE_LABELS[active]}`}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline email HTML generators (mirrors the server-side templates exactly)
// ---------------------------------------------------------------------------

const SHIELD_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`;

function emailLayout(body: string, footerText: string, preheader: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Gatekeeper</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>

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
                    ${SHIELD_ICON_SVG}
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
                      ${footerText}
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

function generatePreviewHtml(template: EmailTemplate): string {
  switch (template) {
    case "confirm":
      return generateConfirmPreview();
    case "approval":
      return generateApprovalPreview();
    case "decision-approved":
      return generateDecisionPreview(true);
    case "decision-rejected":
      return generateDecisionPreview(false);
    case "invite":
      return generateInvitePreview();
  }
}

function generateConfirmPreview(): string {
  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#eef2ff,#e0e7ff);border:1px solid #c7d2fe;text-align:center;line-height:56px;margin:0 auto 20px;">
            <span style="font-size:28px;">&#128737;</span>
          </div>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;text-align:center;">Welcome to Gatekeeper</h1>
          <p style="margin:0;font-size:15px;color:#64748b;line-height:24px;text-align:center;">
            Hey Jane, thanks for signing up!<br>
            Please confirm your email to get started.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr><td style="border-top:1px solid #e2e8f0;"></td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;text-align:center;">What you&rsquo;ll get</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:top;padding-right:12px;font-size:16px;line-height:22px;">&#128737;&#65039;</td>
                    <td style="vertical-align:top;">
                      <p style="margin:0;color:#0f172a;font-size:14px;font-weight:600;line-height:22px;">Human Approval Gates</p>
                      <p style="margin:2px 0 0;color:#64748b;font-size:13px;line-height:20px;">Require sign-off before any destructive action executes.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:top;padding-right:12px;font-size:16px;line-height:22px;">&#9889;</td>
                    <td style="vertical-align:top;">
                      <p style="margin:0;color:#0f172a;font-size:14px;font-weight:600;line-height:22px;">Universal API</p>
                      <p style="margin:2px 0 0;color:#64748b;font-size:13px;line-height:20px;">Works with Zapier, Make, n8n, AI agents, and any custom automation.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:top;padding-right:12px;font-size:16px;line-height:22px;">&#128276;</td>
                    <td style="vertical-align:top;">
                      <p style="margin:0;color:#0f172a;font-size:14px;font-weight:600;line-height:22px;">Multi-Channel Alerts</p>
                      <p style="margin:2px 0 0;color:#64748b;font-size:13px;line-height:20px;">Get notified via email, push, or Slack. Approve from anywhere.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td align="center">
          <a href="#" style="display:inline-block;padding:14px 48px;background:#0f172a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.2);">Confirm Email Address</a>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
      <tr>
        <td align="center">
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:18px;">
            Or copy and paste this link:<br>
            <a href="#" style="color:#6366f1;font-size:12px;word-break:break-all;text-decoration:none;">https://gatekeeper.app/callback?code=abc123def456...</a>
          </p>
        </td>
      </tr>
    </table>
  `;

  return emailLayout(
    body,
    "If you did not create a Gatekeeper account, you can safely ignore this email.",
    "Confirm your email to start using Gatekeeper",
  );
}

function generateApprovalPreview(): string {
  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <div style="width:48px;height:48px;border-radius:12px;background:#eef2ff;text-align:center;line-height:48px;margin:0 auto 20px;">
            <span style="font-size:24px;">&#128276;</span>
          </div>
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;text-align:center;">Approval Required</h1>
          <p style="margin:0;font-size:15px;color:#64748b;line-height:22px;text-align:center;">A new request is waiting for your review.</p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td style="border-top:1px solid #e2e8f0;"></td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Request</p>
          <p style="margin:0;color:#0f172a;font-size:17px;font-weight:600;line-height:24px;">Delete production database backup</p>
          <p style="margin:8px 0 0;color:#64748b;font-size:14px;line-height:22px;">This action will permanently remove the 2024-02-15 database snapshot from the AWS S3 archive.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;">
          <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Priority</p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#fef2f2;border:1px solid #fecaca;border-radius:20px;padding:4px 14px 4px 10px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:6px;">
                      <div style="width:8px;height:8px;border-radius:50%;background:#dc2626;"></div>
                    </td>
                    <td style="vertical-align:middle;">
                      <span style="font-size:13px;font-weight:600;color:#991b1b;letter-spacing:0.2px;">Critical</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td align="center" width="50%" style="padding-right:6px;">
          <a href="#" style="display:block;padding:14px 24px;background:#16a34a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;text-align:center;box-shadow:0 1px 2px rgba(22,163,74,0.3);">Approve</a>
        </td>
        <td align="center" width="50%" style="padding-left:6px;">
          <a href="#" style="display:block;padding:14px 24px;background:#ffffff;color:#dc2626;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;text-align:center;border:1.5px solid #fecaca;">Reject</a>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
      <tr>
        <td align="center">
          <a href="#" style="color:#6366f1;font-size:13px;font-weight:500;text-decoration:none;">View in Dashboard &rarr;</a>
        </td>
      </tr>
    </table>
  `;

  return emailLayout(
    body,
    "This action link expires in 72 hours. If you did not expect this email, you can safely ignore it.",
    "New approval request: Delete production database backup",
  );
}

function generateDecisionPreview(approved: boolean): string {
  const statusColor = approved ? "#16a34a" : "#dc2626";
  const statusBg = approved ? "#f0fdf4" : "#fef2f2";
  const statusBorder = approved ? "#bbf7d0" : "#fecaca";
  const statusLabel = approved ? "Approved" : "Rejected";
  const statusEmoji = approved ? "&#9989;" : "&#10060;";

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <div style="width:48px;height:48px;border-radius:12px;background:${statusBg};border:1px solid ${statusBorder};text-align:center;line-height:48px;margin:0 auto 20px;">
            <span style="font-size:22px;">${statusEmoji}</span>
          </div>
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;text-align:center;">Request ${statusLabel}</h1>
          <p style="margin:0;font-size:15px;color:#64748b;line-height:22px;text-align:center;">A decision has been made on your approval request.</p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td style="border-top:1px solid #e2e8f0;"></td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:14px 24px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Request</p>
          <p style="margin:0;color:#0f172a;font-size:16px;font-weight:600;">Delete production database backup</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 24px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Decision</p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:${statusBg};border:1px solid ${statusBorder};border-radius:20px;padding:4px 14px 4px 10px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:6px;">
                      <div style="width:8px;height:8px;border-radius:50%;background:${statusColor};"></div>
                    </td>
                    <td style="vertical-align:middle;">
                      <span style="font-size:13px;font-weight:600;color:${statusColor};">${statusLabel}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 24px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Decided By</p>
          <p style="margin:0;color:#0f172a;font-size:14px;font-weight:500;">Sarah Chen</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 24px;">
          <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Comment</p>
          <p style="margin:0;color:#334155;font-size:14px;line-height:22px;font-style:italic;">&ldquo;${approved ? "Verified this is a stale backup. Safe to proceed." : "We need to retain this backup for compliance. Keeping for at least 90 more days."}&rdquo;</p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td align="center">
          <a href="#" style="display:inline-block;padding:14px 36px;background:#0f172a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.2);">View in Dashboard</a>
        </td>
      </tr>
    </table>
  `;

  return emailLayout(
    body,
    "You received this email because you are a member of this Gatekeeper organization.",
    `Delete production database backup has been ${approved ? "approved" : "rejected"}`,
  );
}

function generateInvitePreview(): string {
  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <div style="width:48px;height:48px;border-radius:12px;background:#eef2ff;border:1px solid #c7d2fe;text-align:center;line-height:48px;margin:0 auto 20px;">
            <span style="font-size:24px;">&#128075;</span>
          </div>
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;text-align:center;">You&rsquo;re Invited!</h1>
          <p style="margin:0;font-size:15px;color:#64748b;line-height:24px;text-align:center;">
            You&rsquo;ve been invited to join <strong style="color:#0f172a;">Acme Engineering</strong> on Gatekeeper as an <strong style="color:#0f172a;">admin</strong>.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td style="border-top:1px solid #e2e8f0;"></td></tr>
    </table>

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
                      <span style="font-size:13px;font-weight:600;color:#4338ca;text-transform:capitalize;">Admin</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0;color:#64748b;font-size:13px;line-height:20px;text-align:center;">
            As an admin, you&rsquo;ll be able to review and act on approval requests from your team&rsquo;s automations and AI agents.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td align="center">
          <a href="#" style="display:inline-block;padding:14px 48px;background:#0f172a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.2);">Accept Invitation</a>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
      <tr>
        <td align="center">
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:18px;">
            Or copy and paste this link:<br>
            <a href="#" style="color:#6366f1;font-size:12px;word-break:break-all;text-decoration:none;">https://gatekeeper.app/invite/abc123def456...</a>
          </p>
        </td>
      </tr>
    </table>
  `;

  return emailLayout(
    body,
    "This invitation expires in 7 days. If you did not expect this email, you can safely ignore it.",
    "You've been invited to join Acme Engineering on Gatekeeper",
  );
}

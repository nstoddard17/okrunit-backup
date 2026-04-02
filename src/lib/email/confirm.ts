// ---------------------------------------------------------------------------
// OKrunit -- Email Confirmation Template (v3)
// ---------------------------------------------------------------------------
// Warm, Vend-inspired design with hero banner, illustration sections,
// and personal sign-off using the shared layout helpers.
// ---------------------------------------------------------------------------

import {
  PROD_URL,
  emailButton,
  emailCard,
  emailDivider,
  emailHeroBanner,
  emailIllustrationSection,
  emailLayout,
  emailSignoff,
  emailTheme,
  escapeHtml,
} from "@/lib/email/layout";

export interface ConfirmEmailParams {
  fullName: string;
  confirmLink: string;
}

export function buildConfirmEmailHtml(params: ConfirmEmailParams): string {
  const { fullName, confirmLink } = params;

  // --- Hero banner (envelope emoji) ---
  const heroBanner = emailHeroBanner({ image: "verify-email.svg", imageWidth: 160, imageHeight: 120, alt: "Verify your email", compact: true });

  // --- Hero (compact margins so the CTA is visible without scrolling) ---
  const hero = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        <td align="center">
          <h1 style="margin:0 0 10px;color:${emailTheme.ink};font-size:28px;font-weight:700;line-height:36px;letter-spacing:-0.5px;text-align:center;">
            Welcome to OKrunit! Let&rsquo;s get started.
          </h1>
          <p style="margin:0;color:${emailTheme.text};font-size:15px;line-height:26px;text-align:center;">
            Hi ${escapeHtml(fullName)}! We&rsquo;re thrilled you&rsquo;re here. To activate your account and start routing approval flows, please verify your email address.
          </p>
        </td>
      </tr>
    </table>
  `;

  // --- Account info card ---
  const accountCard = emailCard(
    `
      <p style="margin:0;color:${emailTheme.ink};font-size:15px;font-weight:700;line-height:24px;">
        Your account is almost ready
      </p>
      <p style="margin:8px 0 0;color:${emailTheme.text};font-size:14px;line-height:24px;">
        Once confirmed you&rsquo;ll be able to connect tools, submit approval requests, and
        review pending actions &mdash; all from a single dashboard.
      </p>
    `,
    { tone: "brand" },
  );

  // --- Verify button (reduced top margin to keep it above the fold) ---
  const verifyButton = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
      <tr>
        <td align="center">
          ${emailButton({ label: "Verify Email Address", href: confirmLink })}
        </td>
      </tr>
    </table>
  `;

  // --- "What you unlock" section header ---
  const sectionHeader = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:36px 0 0;">
      <tr>
        <td align="center">
          <p style="margin:0;color:${emailTheme.ink};font-size:20px;font-weight:700;line-height:28px;text-align:center;">
            What you unlock
          </p>
        </td>
      </tr>
    </table>
  `;

  // --- Feature illustration sections ---
  const feature1 = emailIllustrationSection({
    image: "feature-approval.svg",
    imageWidth: 140,
    imageHeight: 120,
    title: "Human approval gates",
    descriptionHtml:
      "Require sign-offs before destructive actions or high-risk automations execute.",
  });

  const feature2 = emailIllustrationSection({
    image: "feature-api.svg",
    imageWidth: 140,
    imageHeight: 120,
    title: "Universal API",
    descriptionHtml:
      "Connect Zapier, Make, n8n, internal agents, or any custom workflow over HTTP.",
    linkText: "View integrations",
    linkHref: `${PROD_URL}/docs/integrations`,
  });

  const feature3 = emailIllustrationSection({
    image: "feature-channels.svg",
    imageWidth: 140,
    imageHeight: 120,
    title: "Multi-channel alerts",
    descriptionHtml:
      "Approve or reject from email, Slack, Teams, Discord, or the dashboard.",
  });

  // --- Sign-off ---
  const signoff = emailSignoff({
    message: "Welcome aboard!",
    name: "The OKrunit Team",
    title: "Human-in-the-loop, always",
    align: "center",
  });

  // --- Fallback link ---
  const fallbackLink = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
      <tr>
        <td align="center">
          <p style="margin:0;color:${emailTheme.muted};font-size:12px;line-height:20px;text-align:center;">
            Button not working? Copy and paste this link into your browser:
          </p>
          <p style="margin:8px 0 0;text-align:center;">
            <a href="${confirmLink}" style="color:${emailTheme.brand};font-size:12px;font-weight:600;line-height:20px;word-break:break-all;text-decoration:none;">${confirmLink}</a>
          </p>
        </td>
      </tr>
    </table>
  `;

  const body = [
    hero,
    accountCard,
    verifyButton,
    sectionHeader,
    feature1,
    emailDivider(0, 0),
    feature2,
    emailDivider(0, 0),
    feature3,
    signoff,
    fallbackLink,
  ].join("");

  return emailLayout({
    body,
    heroBanner,
    preheader: "Confirm your email to start using OKrunit",
    footerText:
      "If you did not create an OKrunit account, you can safely ignore this email.",
  });
}

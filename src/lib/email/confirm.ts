// ---------------------------------------------------------------------------
// OKRunit -- Email Confirmation Template (v3)
// ---------------------------------------------------------------------------
// Warm, Vend-inspired design with hero banner, illustration sections,
// and personal sign-off using the shared layout helpers.
// ---------------------------------------------------------------------------

import {
  PROD_URL,
  emailButton,
  emailButtonRow,
  emailCard,
  emailDivider,
  emailHero,
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
  const heroBanner = emailHeroBanner({ image: "verify-email.svg", imageWidth: 200, imageHeight: 150, alt: "Verify your email" });

  // --- Hero ---
  const hero = emailHero({
    title: "Welcome to OKRunit! Let&rsquo;s get started.",
    descriptionHtml: `Hi ${escapeHtml(fullName)}! We&rsquo;re thrilled you&rsquo;re here. To activate your account and start routing approval flows, please verify your email address.`,
  });

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

  // --- Verify button ---
  const verifyButton = emailButtonRow([
    emailButton({
      label: "Verify Email Address",
      href: confirmLink,
    }),
  ]);

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
    name: "The OKRunit Team",
    title: "Human-in-the-loop, always",
  });

  // --- Fallback link ---
  const fallbackLink = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td>
          <p style="margin:0;color:${emailTheme.muted};font-size:12px;line-height:20px;">
            Button not working? Copy and paste this link into your browser:
          </p>
          <p style="margin:8px 0 0;">
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
    preheader: "Confirm your email to start using OKRunit",
    footerText:
      "If you did not create an OKRunit account, you can safely ignore this email.",
  });
}

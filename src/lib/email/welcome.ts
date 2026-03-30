// ---------------------------------------------------------------------------
// OKrunit -- Welcome Email Template (v3)
// ---------------------------------------------------------------------------
// Celebratory onboarding email with hero banner, illustration steps,
// milestone card, and personal sign-off using the shared layout helpers.
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
} from "@/lib/email/layout";

export interface WelcomeEmailParams {
  fullName: string;
}

export function buildWelcomeEmailHtml(params: WelcomeEmailParams): string {
  const { fullName } = params;

  // --- Hero banner (rocket emoji) ---
  const heroBanner = emailHeroBanner({ image: "welcome-rocket.svg", imageWidth: 200, imageHeight: 170, alt: "Welcome to OKrunit" });

  // --- Hero ---
  const hero = emailHero({
    title: `You&rsquo;re all set, ${fullName}!`,
    descriptionHtml:
      "Your account is live and ready to go. Here&rsquo;s a quick guide to get your first approval flow up and running.",
  });

  // --- "Your OKrunit to-do list" section header ---
  const todoHeader = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;">
      <tr>
        <td>
          <p style="margin:0 0 4px;color:${emailTheme.ink};font-size:18px;font-weight:700;line-height:26px;">
            Your OKrunit to-do list
          </p>
        </td>
      </tr>
    </table>
  `;

  // --- Step illustration sections inside a neutral card ---
  const step1 = emailIllustrationSection({
    image: "step-connection.svg",
    imageWidth: 140,
    imageHeight: 120,
    title: "Create a connection",
    descriptionHtml:
      "Generate an API key and wire in the app, agent, or workflow you want to control.",
    linkText: "Connections",
    linkHref: `${PROD_URL}/requests/connections`,
  });

  const step2 = emailIllustrationSection({
    image: "step-request.svg",
    imageWidth: 140,
    imageHeight: 120,
    title: "Send your first request",
    descriptionHtml:
      "Use the API or playground to submit an approval request with the right context.",
    linkText: "Playground",
    linkHref: `${PROD_URL}/playground`,
  });

  const step3 = emailIllustrationSection({
    image: "step-review.svg",
    imageWidth: 140,
    imageHeight: 120,
    title: "Review from anywhere",
    descriptionHtml:
      "Approve or reject from the dashboard, email, Slack, Teams, or Discord.",
    linkText: "Dashboard",
    linkHref: `${PROD_URL}/requests`,
  });

  const stepsContent = [
    step1,
    emailDivider(0, 0),
    step2,
    emailDivider(0, 0),
    step3,
  ].join("");

  const stepsCard = emailCard(stepsContent, { tone: "neutral" });

  // --- Recommended first milestone ---
  const milestoneCard = emailCard(
    `
      <p style="margin:0 0 4px;color:${emailTheme.ink};font-size:16px;font-weight:700;line-height:24px;">
        Recommended first milestone
      </p>
      <p style="margin:8px 0 0;color:${emailTheme.text};font-size:14px;line-height:24px;">
        Connect one workflow, submit one approval request, and review it end-to-end.
        This validates your routing and notification setup in under five minutes.
      </p>
    `,
    { tone: "brand", marginTop: 20 },
  );

  // --- Two buttons ---
  const buttons = emailButtonRow([
    emailButton({
      label: "Open Dashboard",
      href: `${PROD_URL}/org/overview`,
    }),
    emailButton({
      label: "Read Docs",
      href: `${PROD_URL}/docs`,
      variant: "secondary",
      block: true,
    }),
  ]);

  // --- Sign-off ---
  const signoff = emailSignoff({
    message: "Here&rsquo;s to your automation success,",
    name: "The OKrunit Team",
    title: "Human-in-the-loop, always",
  });

  const body = [
    hero,
    todoHeader,
    stepsCard,
    milestoneCard,
    buttons,
    signoff,
  ].join("");

  return emailLayout({
    body,
    heroBanner,
    preheader: "Your OKrunit account is ready — here's how to get started",
  });
}

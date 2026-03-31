import { test, type Page } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_EMAIL ?? "";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "";
const DIR = "public/screenshots/docs";

/**
 * Take a clean screenshot with dev overlays removed and personal info anonymized.
 */
async function shot(page: Page, name: string, opts?: { fullPage?: boolean }) {
  // Wait for page to be stable (no more navigations)
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  // Remove Next.js dev overlays
  await page.evaluate(() => {
    document
      .querySelectorAll(
        "nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast]"
      )
      .forEach((el) => el.remove());
    const style = document.createElement("style");
    style.textContent = `
      nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay] { display: none !important; }
      body > div[style*="position: fixed"][style*="bottom"] { display: none !important; }
      body > aside { display: none !important; }
      #__next-build-indicator { display: none !important; }
    `;
    document.head.appendChild(style);
    document.querySelectorAll("body > *").forEach((el) => {
      const cs = window.getComputedStyle(el);
      if (cs.position === "fixed") {
        (el as HTMLElement).style.display = "none";
      }
    });
    document
      .querySelectorAll("body > :not(#__next):not(div[id])")
      .forEach((el) => {
        if (
          el.tagName !== "SCRIPT" &&
          el.tagName !== "STYLE" &&
          el.tagName !== "LINK"
        ) {
          const cs = window.getComputedStyle(el);
          if (cs.position === "fixed" || el.shadowRoot) {
            (el as HTMLElement).style.display = "none";
          }
        }
      });
  });

  // Anonymize personal data
  await page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent) {
        node.textContent = node.textContent
          .replace(/Nathaniel Stoddard's Organization/g, "OKRunit")
          .replace(/Nathaniel Stoddard/g, "Alex Johnson")
          .replace(/Test Admin/g, "Jamie Lee")
          .replace(/test@okrunit\.com/g, "jamie@acme.com")
          .replace(
            /stoddard\.nathaniel@yahoo\.com/g,
            "alex@acme.com"
          );
      }
    }
  });

  // Hide avatar buttons
  await page.evaluate(() => {
    document
      .querySelectorAll('[data-slot="avatar"], button:has([data-slot="avatar"])')
      .forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });
  });

  await page.waitForTimeout(200);
  await page.screenshot({
    path: `${DIR}/${name}.png`,
    fullPage: opts?.fullPage ?? false,
  });
}

/* ------------------------------------------------------------------ */
/*  Public docs pages (no auth needed)                                 */
/* ------------------------------------------------------------------ */

test.describe("Docs page screenshots", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.describe.configure({ timeout: 60000 });

  test("getting-started page", async ({ page }) => {
    await page.goto("/docs", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await shot(page, "getting-started", { fullPage: true });
  });

  test("api-reference page", async ({ page }) => {
    await page.goto("/docs/api", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await shot(page, "api-reference", { fullPage: true });
  });

  test("integrations page", async ({ page }) => {
    await page.goto("/docs/integrations", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await shot(page, "integrations", { fullPage: true });
  });

  test("webhooks page", async ({ page }) => {
    await page.goto("/docs/webhooks", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await shot(page, "webhooks", { fullPage: true });
  });

  test("sso page", async ({ page }) => {
    await page.goto("/docs/sso", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await shot(page, "sso", { fullPage: true });
  });

  test("billing page", async ({ page }) => {
    await page.goto("/docs/billing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await shot(page, "billing", { fullPage: true });
  });

  test("changelog page", async ({ page }) => {
    await page.goto("/docs/changelog", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await shot(page, "changelog", { fullPage: true });
  });
});

/* ------------------------------------------------------------------ */
/*  Auth pages (login/signup)                                          */
/* ------------------------------------------------------------------ */

test.describe("Auth page screenshots", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.describe.configure({ timeout: 60000 });

  test("signup page", async ({ page }) => {
    await page.goto("/signup", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await shot(page, "signup");
  });

  test("login page", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await shot(page, "login");
  });
});

/* ------------------------------------------------------------------ */
/*  Dashboard screenshots (auth required)                              */
/* ------------------------------------------------------------------ */

test.describe("Dashboard screenshots for docs", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.describe.configure({ timeout: 60000 });
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, "Need E2E credentials");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', E2E_EMAIL);
    await page.fill('input[type="password"]', E2E_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(org|dashboard)/, { timeout: 30000 });

    await page.addStyleTag({
      content: `
        [data-slot="avatar"] { display: none !important; }
        button:has([data-slot="avatar"]) { display: none !important; }
        nextjs-portal, [data-nextjs-toast] { display: none !important; }
      `,
    });
  });

  // --- Overview ---
  test("dashboard overview", async ({ page }) => {
    await page.goto("/org/overview", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "dashboard-overview");
  });

  // --- Requests ---
  test("requests list", async ({ page }) => {
    await page.goto("/requests", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "requests-list");
  });

  // --- Connections ---
  test("connections page", async ({ page }) => {
    await page.goto("/requests/connections", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "connections-list");
  });

  // --- Routes ---
  test("routes page", async ({ page }) => {
    await page.goto("/requests/routes", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "routes-list");
  });

  // --- Messaging ---
  test("messaging page", async ({ page }) => {
    await page.goto("/requests/messaging", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "messaging-channels");
  });

  // --- Analytics ---
  test("analytics page", async ({ page }) => {
    await page.goto("/requests/analytics", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "analytics-dashboard");
  });

  // --- Audit log ---
  test("audit log page", async ({ page }) => {
    await page.goto("/requests/audit-log", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "audit-log");
  });

  // --- Team members ---
  test("members page", async ({ page }) => {
    await page.goto("/org/members", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "team-members");
  });

  // --- Invites ---
  test("invites page", async ({ page }) => {
    await page.goto("/org/invites", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "team-invites");
  });

  // --- Billing ---
  test("billing page", async ({ page }) => {
    await page.goto("/org/subscription", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "billing-dashboard");
  });

  // --- Settings ---
  test("settings page", async ({ page }) => {
    await page.goto("/settings/account", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "account-settings");
  });

  // --- SSO settings ---
  test("sso settings", async ({ page }) => {
    await page.goto("/settings/account", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "sso-settings");
  });

  // --- Playground ---
  test("api playground", async ({ page }) => {
    await page.goto("/playground/request-builder", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "api-playground");
  });

  // --- Setup wizard ---
  test("setup wizard", async ({ page }) => {
    await page.goto("/setup", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "setup-wizard");
  });

  // --- Rules ---
  test("rules page", async ({ page }) => {
    await page.goto("/requests/rules", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "rules-list");
  });

  // --- SLA Compliance ---
  test("sla compliance", async ({ page }) => {
    await page.goto("/requests/sla?demo=true", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "sla-compliance");
  });

  // --- Custom Roles ---
  test("custom roles", async ({ page }) => {
    await page.goto("/org/roles", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "custom-roles");
  });

  // --- Org Settings ---
  test("org settings", async ({ page }) => {
    await page.goto("/org/settings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "org-settings", { fullPage: true });
  });

  // --- Subscription ---
  test("subscription page", async ({ page }) => {
    await page.goto("/org/subscription", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "subscription");
  });

  // --- Notification History ---
  test("notification history", async ({ page }) => {
    await page.goto("/settings/notifications", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "notification-history");
  });
});

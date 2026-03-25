import { test, type Page } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_EMAIL ?? "";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "";
const DIR = "public/screenshots";

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: false });
}

test.describe("Product screenshots for landing page", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.skip(!E2E_EMAIL || !E2E_PASSWORD, "Need E2E credentials");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', E2E_EMAIL);
    await page.fill('input[type="password"]', E2E_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(org|dashboard)/, { timeout: 15000 });
  });

  test("requests page", async ({ page }) => {
    await page.goto("/requests");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await shot(page, "hero-requests");
  });

  test("org overview", async ({ page }) => {
    await page.goto("/org/overview");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await shot(page, "hero-overview");
  });

  test("connections page", async ({ page }) => {
    await page.goto("/connections");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await shot(page, "hero-connections");
  });

  test("routes page", async ({ page }) => {
    await page.goto("/routes");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await shot(page, "hero-routes");
  });

  test("analytics page", async ({ page }) => {
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await shot(page, "hero-analytics");
  });
});

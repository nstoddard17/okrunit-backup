import { test } from "@playwright/test";

test("desktop landing page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: "e2e/screenshots/desktop-landing.png",
    fullPage: true,
  });
});

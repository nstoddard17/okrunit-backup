import { test } from "@playwright/test";

const DIR = "e2e/screenshots/make-reference";

test.describe("Make.com landing page reference", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("capture hero and sections at intervals", async ({ page }) => {
    await page.goto("https://www.make.com/en");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Hero - initial state
    await page.screenshot({ path: `${DIR}/01-hero-initial.png`, fullPage: false });

    // Wait for animation frames
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/02-hero-2s.png`, fullPage: false });

    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/03-hero-4s.png`, fullPage: false });

    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/04-hero-6s.png`, fullPage: false });

    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/05-hero-8s.png`, fullPage: false });

    // Scroll down slowly capturing each section
    const sections = [
      { y: 900, name: "06-below-hero" },
      { y: 1800, name: "07-section-2" },
      { y: 2700, name: "08-section-3" },
      { y: 3600, name: "09-section-4" },
      { y: 4500, name: "10-section-5" },
      { y: 5400, name: "11-section-6" },
      { y: 6300, name: "12-section-7" },
      { y: 7200, name: "13-section-8" },
    ];

    for (const s of sections) {
      await page.evaluate((scrollY) => window.scrollTo({ top: scrollY, behavior: "smooth" }), s.y);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${DIR}/${s.name}.png`, fullPage: false });
    }

    // Full page capture
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 300) {
      await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
      await page.waitForTimeout(50);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${DIR}/14-full-page.png`, fullPage: true });
  });
});

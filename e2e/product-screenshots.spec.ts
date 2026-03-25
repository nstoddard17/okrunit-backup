import { test, type Page } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_EMAIL ?? "";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "";
const DIR = "public/screenshots";

async function shot(page: Page, name: string) {
  // Hide the Next.js dev overlay and any avatar initials
  await page.evaluate(() => {
    // Remove Next.js error/dev overlay
    document.querySelectorAll("nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast]").forEach((el) => el.remove());
    const style = document.createElement("style");
    style.textContent = `
      nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay] { display: none !important; }
      body > div[style*="position: fixed"][style*="bottom"] { display: none !important; }
      body > aside { display: none !important; }
      #__next-build-indicator { display: none !important; }
    `;
    document.head.appendChild(style);
    // Remove ALL fixed-position elements at bottom of page (Next.js dev indicator, error overlay, etc.)
    document.querySelectorAll("body > *").forEach((el) => {
      const cs = window.getComputedStyle(el);
      if (cs.position === "fixed") {
        (el as HTMLElement).style.display = "none";
      }
    });
    // Also nuke any shadow DOM containers that Next.js uses
    document.querySelectorAll("body > :not(#__next):not(div[id])").forEach((el) => {
      if (el.tagName !== "SCRIPT" && el.tagName !== "STYLE" && el.tagName !== "LINK") {
        const cs = window.getComputedStyle(el);
        if (cs.position === "fixed" || el.shadowRoot) {
          (el as HTMLElement).style.display = "none";
        }
      }
    });
  });
  // Replace personal names with generic ones
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent) {
        node.textContent = node.textContent
          .replace(/Nathaniel Stoddard's Organization/g, "Acme Corp")
          .replace(/Nathaniel Stoddard/g, "Alex Johnson")
          .replace(/Test Admin/g, "Jamie Lee")
          .replace(/test@okrunit\.com/g, "jamie@acme.com")
          .replace(/stoddard\.nathaniel@yahoo\.com/g, "alex@acme.com");
      }
    }
  });
  // Hide the header avatar by locating all "TA" and "NS" text elements and their parent buttons
  const avatarTexts = await page.locator("text=TA").all();
  for (const el of avatarTexts) {
    try {
      const box = await el.boundingBox();
      // Only hide small ones (avatars are < 40px)
      if (box && box.width < 50 && box.height < 50) {
        // Hide the closest clickable parent (the dropdown trigger button)
        await el.evaluate((node) => {
          let target: HTMLElement | null = node as HTMLElement;
          // Walk up to find the button wrapper
          for (let i = 0; i < 6; i++) {
            if (!target?.parentElement) break;
            target = target.parentElement;
            if (target.tagName === "BUTTON" || target.getAttribute("role") === "button") {
              target.style.opacity = "0";
              break;
            }
          }
        });
      }
    } catch { /* ignore */ }
  }
  await page.waitForTimeout(100);
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

    // Replace avatars, org name, and hide dev indicators
    await page.addStyleTag({
      content: `
        [data-slot="avatar-fallback"] {
          font-size: 0 !important;
          background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
          color: white !important;
        }
        [data-slot="avatar-fallback"]::after {
          content: "";
          font-size: 12px;
        }
        nextjs-portal, [data-nextjs-toast] { display: none !important; }
        /* Hide ALL avatar elements */
        [data-slot="avatar"] { display: none !important; }
        [data-slot="avatar-fallback"] { display: none !important; }
        /* Hide the entire avatar trigger button wrapper */
        button:has([data-slot="avatar"]) { display: none !important; }
        /* Fallback: hide any circular button with ring in the header area */
        header .ring-2, header [class*="ring-primary"] { display: none !important; }
        /* Nuclear option: hide the last interactive element in the header right section */
        .top-bar > div:last-child > *:last-child { display: none !important; }
      `,
    });
  });

  test("requests page", async ({ page }) => {
    await page.goto("/requests");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
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

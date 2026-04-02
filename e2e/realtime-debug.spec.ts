import { test, expect } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_EMAIL ?? "test@okrunit.com";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "E2eScreenshot2026!";

test.describe("Realtime subscription debug", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.describe.configure({ timeout: 90_000 });
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, "Need E2E credentials");

  test("check realtime events on requests page", async ({ page }) => {
    // Patch WebSocket BEFORE any page loads to intercept all connections
    await page.addInitScript(() => {
      const origWS = window.WebSocket;
      (window as Record<string, unknown>).__WS_LOG = [];
      (window as Record<string, unknown>).__WS_MSG_LOG = [];
      let msgCount = 0;

      // @ts-expect-error patching
      window.WebSocket = function (url: string, protocols?: string | string[]) {
        ((window as Record<string, unknown>).__WS_LOG as string[]).push(`WS created: ${url.substring(0, 80)}...`);
        const ws = protocols ? new origWS(url, protocols) : new origWS(url);

        ws.addEventListener("open", () => {
          ((window as Record<string, unknown>).__WS_LOG as string[]).push("WS opened");
        });
        ws.addEventListener("error", () => {
          ((window as Record<string, unknown>).__WS_LOG as string[]).push("WS error");
        });
        ws.addEventListener("close", (e) => {
          ((window as Record<string, unknown>).__WS_LOG as string[]).push(
            `WS closed code=${(e as CloseEvent).code}`
          );
        });
        ws.addEventListener("message", (e) => {
          msgCount++;
          const data = typeof (e as MessageEvent).data === "string" ? (e as MessageEvent).data : "";
          // Log postgres_changes events (they contain the table change data)
          if (data.includes("postgres_changes") || data.includes("INSERT") || data.includes("UPDATE")) {
            ((window as Record<string, unknown>).__WS_MSG_LOG as string[]).push(
              `MSG #${msgCount}: ${data.substring(0, 300)}`
            );
          }
          (window as Record<string, unknown>).__WS_MSG_COUNT = msgCount;
        });

        return ws;
      } as unknown as typeof WebSocket;
      Object.assign(window.WebSocket, {
        prototype: origWS.prototype,
        CONNECTING: origWS.CONNECTING,
        OPEN: origWS.OPEN,
        CLOSING: origWS.CLOSING,
        CLOSED: origWS.CLOSED,
      });
    });

    // Login
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', E2E_EMAIL);
    await page.fill('input[type="password"]', E2E_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(org|dashboard|setup)/, { timeout: 30000 });

    // Dismiss onboarding tour
    await page.evaluate(() => {
      localStorage.setItem(
        "okrunit-onboarding-tour",
        JSON.stringify({ completed: true, dismissed: true, step: 999 })
      );
    });

    // Navigate to requests page and wait for it to settle
    await page.goto("/requests", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);

    // Record baseline WS message count
    const msgCountBefore = await page.evaluate(
      () => (window as Record<string, unknown>).__WS_MSG_COUNT as number || 0
    );
    console.log("WS messages before:", msgCountBefore);

    // Delete existing onboarding test request first so we can create a fresh one
    await page.evaluate(async () => {
      try { await fetch("/api/v1/onboarding", { method: "DELETE" }); } catch {}
    });
    await page.waitForTimeout(2000);

    // Check if DELETE triggered a realtime event
    const msgCountAfterDelete = await page.evaluate(
      () => (window as Record<string, unknown>).__WS_MSG_COUNT as number || 0
    );
    const deleteMessages = await page.evaluate(
      () => (window as Record<string, unknown>).__WS_MSG_LOG as string[]
    );
    console.log("WS messages after delete:", msgCountAfterDelete, `(+${msgCountAfterDelete - msgCountBefore})`);
    console.log("Postgres change messages so far:", deleteMessages);

    // Now create a FRESH test request
    const createResult = await page.evaluate(async () => {
      try {
        const res = await fetch("/api/v1/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        return { status: res.status, body: await res.json() };
      } catch (e) {
        return { error: String(e) };
      }
    });
    console.log("Create result:", JSON.stringify(createResult));

    // Wait for realtime event
    console.log("Waiting 10s for realtime event...");
    await page.waitForTimeout(10000);

    const msgCountAfterCreate = await page.evaluate(
      () => (window as Record<string, unknown>).__WS_MSG_COUNT as number || 0
    );
    const allChangeMessages = await page.evaluate(
      () => (window as Record<string, unknown>).__WS_MSG_LOG as string[]
    );
    console.log("WS messages after create:", msgCountAfterCreate, `(+${msgCountAfterCreate - msgCountAfterDelete})`);
    console.log("=== POSTGRES CHANGE MESSAGES ===");
    allChangeMessages.forEach((m) => console.log("  ", m));

    // Check for toast
    const toastVisible = await page
      .locator("text=New approval request received")
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    console.log("Toast appeared:", toastVisible);

    // Check sidebar badge
    const sidebarBadge = page.locator('a[href="/requests"] span.rounded-full').first();
    const badge = (await sidebarBadge.isVisible({ timeout: 1000 }).catch(() => false))
      ? await sidebarBadge.textContent()
      : "not visible";
    console.log("Sidebar badge:", badge);

    // Check actual pending count via direct query
    const directCount = await page.evaluate(async () => {
      const res = await fetch("/api/v1/approvals?page_size=100&status=pending");
      if (!res.ok) return { error: res.status };
      return await res.json();
    });
    console.log("Direct API pending count:", JSON.stringify(directCount).substring(0, 200));

    // Also check via client-side Supabase to test RLS
    const rlsCount = await page.evaluate(async () => {
      // Can't easily import supabase here, but we can check what the page shows
      const rows = document.querySelectorAll('[class*="group/"]');
      const pendingTexts = Array.from(document.querySelectorAll('*')).filter(
        (el) => el.textContent?.trim() === 'Pending' && el.closest('[class*="group"]')
      );
      return { rows: rows.length, pendingLabels: pendingTexts.length };
    });
    console.log("Visible pending items:", JSON.stringify(rlsCount));

    // Clean up
    await page.evaluate(async () => {
      try { await fetch("/api/v1/onboarding", { method: "DELETE" }); } catch {}
    });

    console.log("=== VERDICT ===");
    if (allChangeMessages.length > 0) {
      console.log("REALTIME EVENTS RECEIVED — check if callbacks are processing them");
    } else if (msgCountAfterCreate > msgCountAfterDelete) {
      console.log("NEW WS MESSAGES RECEIVED but not postgres_changes — possible heartbeats only");
    } else {
      console.log("NO NEW WS MESSAGES — Supabase Realtime not delivering events for this table/filter");
    }

    expect(true).toBe(true);
  });
});

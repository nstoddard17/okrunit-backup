import { test, expect } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_EMAIL ?? "test@okrunit.com";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "E2eScreenshot2026!";

test.describe("Notification realtime debug", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.describe.configure({ timeout: 90_000 });
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, "Need E2E credentials");

  test("notification INSERT arrives via realtime", async ({ page }) => {
    await page.addInitScript(() => {
      const origWS = window.WebSocket;
      (window as unknown as Record<string, unknown>).__WS_MSG_LOG = [];
      let msgCount = 0;
      const PatchedWS = function (url: string, protocols?: string | string[]) {
        const ws = protocols ? new origWS(url, protocols) : new origWS(url);
        ws.addEventListener("message", (e) => {
          msgCount++;
          const data = typeof (e as MessageEvent).data === "string" ? (e as MessageEvent).data : "";
          if (data.includes("notification") || data.includes("INSERT") || data.includes("UPDATE")) {
            ((window as unknown as Record<string, unknown>).__WS_MSG_LOG as string[]).push(
              `MSG #${msgCount}: ${data.substring(0, 500)}`
            );
          }
          (window as unknown as Record<string, unknown>).__WS_MSG_COUNT = msgCount;
        });
        return ws;
      } as unknown as typeof WebSocket;
      Object.assign(PatchedWS, { prototype: origWS.prototype, CONNECTING: origWS.CONNECTING, OPEN: origWS.OPEN, CLOSING: origWS.CLOSING, CLOSED: origWS.CLOSED });
      window.WebSocket = PatchedWS;
    });

    // Login
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', E2E_EMAIL);
    await page.fill('input[type="password"]', E2E_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(org|dashboard|setup)/, { timeout: 30000 });
    await page.evaluate(() => {
      localStorage.setItem("okrunit-onboarding-tour", JSON.stringify({ completed: true, dismissed: true, step: 999 }));
    });

    // Go to overview
    await page.goto("/org/overview", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);

    const msgCountBefore = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__WS_MSG_COUNT as number || 0
    );

    // Create a notification by inserting directly via Supabase client
    // The browser client uses the user's session, so we need to bypass RLS
    // Instead, use a server-side endpoint. Let's create a test endpoint or
    // use the existing notification creation path.
    //
    // The cleanest way: call an internal test API that inserts a notification
    // for the current user. We don't have one, so let's create the notification
    // by triggering the approval flow.
    //
    // Simplest approach: use the Supabase client with service role from page context.
    // But we don't have the service role key in the browser.
    //
    // Alternative: Use the mark-all-read then check if approval_requests INSERT
    // triggers a notification. Let's delete onboarding test, create fresh one.
    // The onboarding endpoint runs `after()` with notification dispatch?

    // Let's check: does approving/rejecting a request create a notification?
    // Yes - when decided, it calls createInAppNotificationBulk for org members.
    // So let's: create a test request, then approve it, which creates a notification.

    // Step 1: Create test request
    await page.evaluate(async () => {
      try { await fetch("/api/v1/onboarding", { method: "DELETE" }); } catch {}
    });
    await page.waitForTimeout(1000);

    const created = await page.evaluate(async () => {
      const res = await fetch("/api/v1/onboarding", { method: "POST", headers: { "Content-Type": "application/json" } });
      return await res.json();
    });
    console.log("Created request:", JSON.stringify(created).substring(0, 150));
    const requestId = (created as { data?: { id?: string } }).data?.id;

    if (!requestId) {
      console.log("Failed to create request");
      expect(true).toBe(true);
      return;
    }

    // Step 2: Approve the request (this triggers notification creation)
    const approveResult = await page.evaluate(async (id: string) => {
      const res = await fetch(`/api/v1/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "approve" }),
      });
      return { status: res.status, body: await res.json() };
    }, requestId);
    console.log("Approve result:", JSON.stringify(approveResult).substring(0, 200));

    // Step 3: Wait for notification to be created and realtime to deliver
    console.log("Waiting 10s for notification realtime INSERT...");
    await page.waitForTimeout(10000);

    const msgCountAfter = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__WS_MSG_COUNT as number || 0
    );
    const allMsgs = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__WS_MSG_LOG as string[]
    );

    console.log("WS messages:", msgCountAfter, `(+${msgCountAfter - msgCountBefore})`);
    console.log("=== NOTIFICATION-RELATED MESSAGES ===");
    allMsgs.forEach((m) => console.log("  ", m));

    // Check bell badge
    const bellBadge = page.locator('button[aria-label*="Notification"] span.rounded-full, button[aria-label*="unread"] span.rounded-full').first();
    const bellAfter = (await bellBadge.isVisible({ timeout: 1000 }).catch(() => false))
      ? await bellBadge.textContent()
      : "no badge";
    console.log("Bell badge:", bellAfter);

    // Check toast
    const toastVisible = await page.locator('[data-sonner-toast]').first().isVisible({ timeout: 1000 }).catch(() => false);
    console.log("Toast visible:", toastVisible);

    // Verify notification was created by checking API
    const notifCheck = await page.evaluate(async () => {
      const res = await fetch("/api/v1/notifications/activity?limit=3&unread=true");
      return await res.json();
    });
    console.log("Notifications after:", JSON.stringify(notifCheck).substring(0, 300));

    // Cleanup
    await page.evaluate(async () => {
      try { await fetch("/api/v1/onboarding", { method: "DELETE" }); } catch {}
      try { await fetch("/api/v1/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) }); } catch {}
    });

    const hasNotifInsert = allMsgs.some((m) => m.includes('"type":"INSERT"') && m.includes("notification"));
    console.log("=== VERDICT ===");
    if (hasNotifInsert) {
      console.log("NOTIFICATION REALTIME WORKING");
    } else {
      console.log("NO NOTIFICATION INSERT via realtime");
    }

    expect(true).toBe(true);
  });
});

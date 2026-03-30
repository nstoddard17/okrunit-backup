// ---------------------------------------------------------------------------
// OKrunit -- Test Error Capture Endpoint (admin-only)
// ---------------------------------------------------------------------------
// Deliberately triggers an error to verify the monitoring pipeline works.
// Hit GET /api/v1/admin/errors/test to test.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { getAppAdminContext } from "@/lib/app-admin";
import { captureError } from "@/lib/monitoring/capture";

export async function GET(request: Request) {
  const profile = await getAppAdminContext();
  if (!profile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const testError = new Error("Test error from error monitoring system");
  testError.name = "TestError";

  await captureError({
    error: testError,
    severity: "warning",
    service: "Test",
    requestUrl: request.url,
    userId: profile.id,
    tags: { test: "true" },
    context: { triggered_by: profile.email },
    breadcrumbs: [
      {
        type: "user",
        category: "test",
        message: "Admin triggered test error",
        timestamp: new Date().toISOString(),
      },
    ],
  });

  return NextResponse.json({
    ok: true,
    message: "Test error captured. Check your Discord channel and /admin/errors.",
  });
}

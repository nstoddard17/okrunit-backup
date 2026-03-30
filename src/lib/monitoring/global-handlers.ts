// ---------------------------------------------------------------------------
// OKrunit -- Global Unhandled Error Handlers
// ---------------------------------------------------------------------------
// Registers process-level handlers for unhandled rejections and uncaught
// exceptions. Called once from src/instrumentation.ts on server startup.
// ---------------------------------------------------------------------------

import { captureError } from "./capture";

let registered = false;

export function setupGlobalErrorHandlers(): void {
  if (registered) return;
  registered = true;

  process.on("unhandledRejection", (reason) => {
    captureError({
      error: reason,
      severity: "fatal",
      service: "Runtime",
      tags: { handler: "unhandledRejection" },
    }).catch(() => {
      // Must never throw
    });
  });

  process.on("uncaughtException", (error) => {
    captureError({
      error,
      severity: "fatal",
      service: "Runtime",
      tags: { handler: "uncaughtException" },
    }).catch(() => {
      // Must never throw
    });
  });
}

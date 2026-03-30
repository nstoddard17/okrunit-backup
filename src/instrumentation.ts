// ---------------------------------------------------------------------------
// OKrunit -- Next.js Instrumentation Hook
// ---------------------------------------------------------------------------
// Runs once on server startup. Registers global error handlers for
// unhandled rejections and uncaught exceptions.
// ---------------------------------------------------------------------------

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { setupGlobalErrorHandlers } = await import(
      "@/lib/monitoring/global-handlers"
    );
    setupGlobalErrorHandlers();
  }
}

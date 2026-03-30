"use client";

import { useEffect } from "react";

/**
 * Registers global window error handlers to catch errors that escape
 * React's error boundary (e.g. "Too many re-renders", async errors,
 * unhandled promise rejections).
 *
 * Mount this once in the root layout.
 */
export function ClientErrorReporter() {
  useEffect(() => {
    function reportError(data: {
      message: string;
      stack?: string;
      url?: string;
      errorType?: string;
    }) {
      fetch("/api/v1/admin/errors/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(() => {});
    }

    function handleWindowError(event: ErrorEvent) {
      // Skip if already caught by React error boundary (they call preventDefault)
      if (event.defaultPrevented) return;

      reportError({
        message: event.message || "Unknown window error",
        stack: event.error?.stack,
        url: window.location.href,
        errorType: event.error?.name || "WindowError",
      });
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      reportError({
        message:
          reason instanceof Error
            ? reason.message
            : typeof reason === "string"
              ? reason
              : "Unhandled promise rejection",
        stack: reason instanceof Error ? reason.stack : undefined,
        url: window.location.href,
        errorType:
          reason instanceof Error
            ? reason.name
            : "UnhandledPromiseRejection",
      });
    }

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}

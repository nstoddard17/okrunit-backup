"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Next.js global error boundary. Catches errors that escape route-level
 * error boundaries. Reports to the error monitoring system.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to error monitoring system
    fetch("/api/v1/admin/errors/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        errorType: error.name,
      }),
    }).catch(() => {
      // Swallow
    });
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}>
          <div style={{
            background: "#fef2f2",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "16px",
          }}>
            <AlertTriangle style={{ width: 32, height: 32, color: "#ef4444" }} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "4px" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "16px", maxWidth: "400px" }}>
            An unexpected error occurred. The issue has been automatically reported.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#18181b",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

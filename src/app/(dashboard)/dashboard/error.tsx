"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <AlertTriangle className="text-destructive size-12" />
      <div className="text-center">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          An error occurred while loading the dashboard. Please try again.
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        Try Again
      </Button>
    </div>
  );
}

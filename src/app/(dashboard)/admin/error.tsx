"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle className="size-8 text-red-500 mb-3" />
      <h2 className="text-lg font-semibold mb-1">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}


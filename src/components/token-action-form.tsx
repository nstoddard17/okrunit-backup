"use client";

// ---------------------------------------------------------------------------
// OKRunit -- Token Action Form (Client Component)
// ---------------------------------------------------------------------------
//
// Shared form component used by both /approve/[token] and /reject/[token]
// pages. Submits to POST /api/v1/token-action with the token, action, and
// optional comment.
// ---------------------------------------------------------------------------

import { useState } from "react";

interface TokenActionFormProps {
  token: string;
  action: "approve" | "reject";
  requestTitle: string;
}

export function TokenActionForm({
  token,
  action,
  requestTitle,
}: TokenActionFormProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const isApprove = action === "approve";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/token-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const label = isApprove ? "approved" : "rejected";
        setResult({
          success: true,
          message: `You have successfully ${label} "${requestTitle}".`,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "An unexpected error occurred.",
        });
      }
    } catch {
      setResult({
        success: false,
        message: "Network error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show result state
  if (result) {
    return (
      <div>
        <div
          className={`rounded-lg border p-4 ${
            result.success
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <h3
            className={`text-base font-semibold ${
              result.success ? "text-green-800" : "text-red-800"
            }`}
          >
            {result.success ? "Done" : "Error"}
          </h3>
          <p
            className={`mt-1 text-sm ${
              result.success ? "text-green-700" : "text-red-700"
            }`}
          >
            {result.message}
          </p>
        </div>
        <div className="mt-6 text-center">
          <a
            href="/org/overview"
            className="inline-block rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Optional comment */}
      <div className="mb-4">
        <label
          htmlFor="comment"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Reason {isApprove ? "(optional)" : "(optional)"}
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={
            isApprove
              ? "Add an optional note..."
              : "Why are you rejecting this request?"
          }
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full rounded-lg px-5 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          isApprove
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {isSubmitting
          ? "Processing..."
          : isApprove
            ? "Confirm Approval"
            : "Confirm Rejection"}
      </button>

      <p className="mt-3 text-center text-xs text-gray-400">
        This action cannot be undone.
      </p>
    </form>
  );
}

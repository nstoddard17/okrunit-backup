// ---------------------------------------------------------------------------
// OKRunit -- Redirect Validation
// ---------------------------------------------------------------------------
// Validates redirect URLs to prevent open redirect attacks.
// Used after login to ensure the redirect_to parameter is safe.
// ---------------------------------------------------------------------------

/**
 * Validate a redirect URL to prevent open redirect attacks.
 * Only allows relative paths (starting with "/" but not "//").
 * Returns the safe redirect path, or the provided fallback.
 */
export function safeRedirectUrl(
  redirectTo: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!redirectTo) return fallback;
  if (typeof redirectTo !== "string") return fallback;

  // Must start with "/" to be a relative path
  if (!redirectTo.startsWith("/")) return fallback;

  // Block protocol-relative URLs like "//evil.com"
  if (redirectTo.startsWith("//")) return fallback;

  // Block backslash variants that some browsers normalize to "/"
  if (redirectTo.startsWith("/\\")) return fallback;

  return redirectTo;
}

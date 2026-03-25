// ---------------------------------------------------------------------------
// OKRunit -- SSRF Protection
// ---------------------------------------------------------------------------
// Pure function to validate callback URLs against private/internal networks.
// Extracted from callbacks.ts for testability and reusability.
// ---------------------------------------------------------------------------

/** Block SSRF: reject callback URLs pointing to private/internal networks. */
export function isPrivateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // Block obvious private hostnames
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]") return true;
    if (hostname === "0.0.0.0" || hostname.endsWith(".local")) return true;
    if (hostname === "metadata.google.internal") return true;

    // Block private IP ranges
    const parts = hostname.split(".");
    if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
      const [a, b] = parts.map(Number);
      if (a === 10) return true;                          // 10.0.0.0/8
      if (a === 172 && b >= 16 && b <= 31) return true;  // 172.16.0.0/12
      if (a === 192 && b === 168) return true;            // 192.168.0.0/16
      if (a === 169 && b === 254) return true;            // 169.254.0.0/16 (link-local / cloud metadata)
      if (a === 127) return true;                         // 127.0.0.0/8
      if (a === 0) return true;                           // 0.0.0.0/8
    }

    // Block non-https (allow http for development only)
    if (url.protocol !== "https:" && url.protocol !== "http:") return true;

    return false;
  } catch {
    return true; // Invalid URL = blocked
  }
}

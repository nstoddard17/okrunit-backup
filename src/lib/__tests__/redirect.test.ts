// ---------------------------------------------------------------------------
// OKRunit -- Tests for Open Redirect Protection
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { safeRedirectUrl } from "../redirect";

// ---- Valid relative paths (allowed) ---------------------------------------

describe("safeRedirectUrl - allowed redirects", () => {
  it("allows /dashboard", () => {
    expect(safeRedirectUrl("/dashboard")).toBe("/dashboard");
  });

  it("allows /settings/billing", () => {
    expect(safeRedirectUrl("/settings/billing")).toBe("/settings/billing");
  });

  it("allows /requests?status=pending", () => {
    expect(safeRedirectUrl("/requests?status=pending")).toBe("/requests?status=pending");
  });

  it("allows deep nested paths", () => {
    expect(safeRedirectUrl("/api/v1/approvals/123")).toBe("/api/v1/approvals/123");
  });

  it("allows root path", () => {
    expect(safeRedirectUrl("/")).toBe("/");
  });

  it("allows paths with hash fragments", () => {
    expect(safeRedirectUrl("/settings#notifications")).toBe("/settings#notifications");
  });

  it("allows OAuth authorize redirect", () => {
    const path = "/oauth/authorize?client_id=abc&redirect_uri=https://example.com";
    expect(safeRedirectUrl(path)).toBe(path);
  });
});

// ---- Blocked: protocol-relative URLs (open redirect) ----------------------

describe("safeRedirectUrl - blocked protocol-relative URLs", () => {
  it("blocks //evil.com", () => {
    expect(safeRedirectUrl("//evil.com")).toBe("/dashboard");
  });

  it("blocks //evil.com/path", () => {
    expect(safeRedirectUrl("//evil.com/path")).toBe("/dashboard");
  });

  it("blocks //evil.com:8080", () => {
    expect(safeRedirectUrl("//evil.com:8080")).toBe("/dashboard");
  });
});

// ---- Blocked: absolute URLs (open redirect) -------------------------------

describe("safeRedirectUrl - blocked absolute URLs", () => {
  it("blocks https://evil.com", () => {
    expect(safeRedirectUrl("https://evil.com")).toBe("/dashboard");
  });

  it("blocks http://evil.com/callback", () => {
    expect(safeRedirectUrl("http://evil.com/callback")).toBe("/dashboard");
  });

  it("blocks javascript: protocol", () => {
    expect(safeRedirectUrl("javascript:alert(1)")).toBe("/dashboard");
  });

  it("blocks data: protocol", () => {
    expect(safeRedirectUrl("data:text/html,<script>alert(1)</script>")).toBe("/dashboard");
  });

  it("blocks ftp:// protocol", () => {
    expect(safeRedirectUrl("ftp://evil.com/file")).toBe("/dashboard");
  });
});

// ---- Blocked: backslash variants ------------------------------------------

describe("safeRedirectUrl - blocked backslash variants", () => {
  it("blocks /\\evil.com (backslash after slash)", () => {
    expect(safeRedirectUrl("/\\evil.com")).toBe("/dashboard");
  });
});

// ---- Null/undefined/empty input -------------------------------------------

describe("safeRedirectUrl - null and empty input", () => {
  it("returns fallback for null", () => {
    expect(safeRedirectUrl(null)).toBe("/dashboard");
  });

  it("returns fallback for undefined", () => {
    expect(safeRedirectUrl(undefined)).toBe("/dashboard");
  });

  it("returns fallback for empty string", () => {
    expect(safeRedirectUrl("")).toBe("/dashboard");
  });

  it("returns fallback for plain text (no leading slash)", () => {
    expect(safeRedirectUrl("dashboard")).toBe("/dashboard");
  });

  it("returns fallback for relative path without leading slash", () => {
    expect(safeRedirectUrl("settings/billing")).toBe("/dashboard");
  });
});

// ---- Custom fallback ------------------------------------------------------

describe("safeRedirectUrl - custom fallback", () => {
  it("uses provided fallback for invalid input", () => {
    expect(safeRedirectUrl(null, "/home")).toBe("/home");
  });

  it("uses provided fallback for blocked URL", () => {
    expect(safeRedirectUrl("https://evil.com", "/home")).toBe("/home");
  });

  it("does not use fallback for valid path", () => {
    expect(safeRedirectUrl("/settings", "/home")).toBe("/settings");
  });
});

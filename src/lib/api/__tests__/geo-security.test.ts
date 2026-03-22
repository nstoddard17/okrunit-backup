// ---------------------------------------------------------------------------
// OKRunit -- Tests for Geo-fencing & IP Allowlist Security
// ---------------------------------------------------------------------------
// These tests validate pure functions and can run with any test runner (vitest, jest, etc.)

import { describe, it, expect } from "vitest";
import {
  checkIpAllowlist,
  checkGeoRestriction,
  validateSecurityContext,
  getGeoFromIp,
} from "../geo-security";

// ---- checkIpAllowlist -----------------------------------------------------

describe("checkIpAllowlist", () => {
  it("allows all IPs when allowlist is empty", () => {
    expect(checkIpAllowlist("1.2.3.4", [])).toBe(true);
  });

  it("allows an exact IP match", () => {
    expect(checkIpAllowlist("10.0.0.1", ["10.0.0.1", "10.0.0.2"])).toBe(true);
  });

  it("blocks an IP not in the list", () => {
    expect(checkIpAllowlist("10.0.0.3", ["10.0.0.1", "10.0.0.2"])).toBe(false);
  });

  it("allows an IP within a CIDR range", () => {
    expect(checkIpAllowlist("192.168.1.50", ["192.168.1.0/24"])).toBe(true);
  });

  it("blocks an IP outside a CIDR range", () => {
    expect(checkIpAllowlist("192.168.2.50", ["192.168.1.0/24"])).toBe(false);
  });

  it("handles /32 CIDR (single host)", () => {
    expect(checkIpAllowlist("10.0.0.1", ["10.0.0.1/32"])).toBe(true);
    expect(checkIpAllowlist("10.0.0.2", ["10.0.0.1/32"])).toBe(false);
  });

  it("handles /0 CIDR (all IPs)", () => {
    expect(checkIpAllowlist("1.2.3.4", ["0.0.0.0/0"])).toBe(true);
  });

  it("handles mixed exact IPs and CIDRs", () => {
    const allowlist = ["10.0.0.1", "192.168.0.0/16"];
    expect(checkIpAllowlist("10.0.0.1", allowlist)).toBe(true);
    expect(checkIpAllowlist("192.168.5.10", allowlist)).toBe(true);
    expect(checkIpAllowlist("172.16.0.1", allowlist)).toBe(false);
  });

  it("handles IPv6 gracefully (no match, falls through)", () => {
    expect(checkIpAllowlist("::1", ["10.0.0.0/8"])).toBe(false);
  });

  it("handles null/undefined allowlist defensively", () => {
    expect(checkIpAllowlist("1.2.3.4", null as unknown as string[])).toBe(true);
  });
});

// ---- checkGeoRestriction --------------------------------------------------

describe("checkGeoRestriction", () => {
  it("allows when geo restrictions are disabled", () => {
    expect(checkGeoRestriction("RU", { enabled: false, allowed_countries: ["US"] })).toBe(true);
  });

  it("allows when allowed_countries is empty (even if enabled)", () => {
    expect(checkGeoRestriction("US", { enabled: true, allowed_countries: [] })).toBe(true);
  });

  it("allows a country in the list", () => {
    expect(checkGeoRestriction("US", { enabled: true, allowed_countries: ["US", "CA", "GB"] })).toBe(true);
  });

  it("blocks a country not in the list", () => {
    expect(checkGeoRestriction("RU", { enabled: true, allowed_countries: ["US", "CA", "GB"] })).toBe(false);
  });

  it("blocks when country is null and restrictions are enabled", () => {
    expect(checkGeoRestriction(null, { enabled: true, allowed_countries: ["US"] })).toBe(false);
  });
});

// ---- getGeoFromIp ---------------------------------------------------------

describe("getGeoFromIp", () => {
  it("reads cf-ipcountry header", () => {
    const req = new Request("https://example.com", {
      headers: { "cf-ipcountry": "DE" },
    });
    expect(getGeoFromIp(req)).toBe("DE");
  });

  it("reads x-vercel-ip-country as fallback", () => {
    const req = new Request("https://example.com", {
      headers: { "x-vercel-ip-country": "FR" },
    });
    expect(getGeoFromIp(req)).toBe("FR");
  });

  it("returns null when no geo header is present", () => {
    const req = new Request("https://example.com");
    expect(getGeoFromIp(req)).toBeNull();
  });

  it("ignores XX country code", () => {
    const req = new Request("https://example.com", {
      headers: { "cf-ipcountry": "XX" },
    });
    expect(getGeoFromIp(req)).toBeNull();
  });

  it("ignores T1 (Tor) country code", () => {
    const req = new Request("https://example.com", {
      headers: { "cf-ipcountry": "T1" },
    });
    expect(getGeoFromIp(req)).toBeNull();
  });
});

// ---- validateSecurityContext -----------------------------------------------

describe("validateSecurityContext", () => {
  it("allows when no restrictions are configured", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    const org = {
      ip_allowlist: [] as string[],
      geo_restrictions: { enabled: false, allowed_countries: [] },
    };
    const result = validateSecurityContext(req, org);
    expect(result.allowed).toBe(true);
    expect(result.ip).toBe("1.2.3.4");
  });

  it("blocks when IP is not in allowlist", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    const org = {
      ip_allowlist: ["10.0.0.0/8"],
      geo_restrictions: { enabled: false, allowed_countries: [] },
    };
    const result = validateSecurityContext(req, org);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("allowlist");
  });

  it("blocks when country is not allowed", () => {
    const req = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "1.2.3.4",
        "cf-ipcountry": "RU",
      },
    });
    const org = {
      ip_allowlist: [] as string[],
      geo_restrictions: { enabled: true, allowed_countries: ["US", "CA"] },
    };
    const result = validateSecurityContext(req, org);
    expect(result.allowed).toBe(false);
    expect(result.country).toBe("RU");
  });

  it("allows when IP and country both pass", () => {
    const req = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "10.0.0.5",
        "cf-ipcountry": "US",
      },
    });
    const org = {
      ip_allowlist: ["10.0.0.0/8"],
      geo_restrictions: { enabled: true, allowed_countries: ["US"] },
    };
    const result = validateSecurityContext(req, org);
    expect(result.allowed).toBe(true);
  });
});

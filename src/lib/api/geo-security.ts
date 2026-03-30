// ---------------------------------------------------------------------------
// OKrunit -- Geo-fencing & IP Allowlist Security
// ---------------------------------------------------------------------------

import type { Organization } from "@/lib/types/database";

// ---- Types ----------------------------------------------------------------

export interface GeoRestrictions {
  enabled: boolean;
  allowed_countries: string[];
}

export interface SecurityContextResult {
  allowed: boolean;
  ip: string;
  country: string | null;
  reason?: string;
}

// ---- IP Allowlist ---------------------------------------------------------

/**
 * Check whether an IP address is in the allowlist.
 * Supports individual IPs and CIDR notation (e.g. "10.0.0.0/8").
 * An empty allowlist means all IPs are allowed.
 */
export function checkIpAllowlist(ip: string, allowlist: string[]): boolean {
  if (!allowlist || allowlist.length === 0) return true;

  for (const entry of allowlist) {
    if (entry.includes("/")) {
      // CIDR notation
      if (ipMatchesCidr(ip, entry)) return true;
    } else {
      // Exact match
      if (ip === entry) return true;
    }
  }

  return false;
}

/**
 * Check if an IP matches a CIDR range. Supports IPv4 only.
 * For IPv6 or invalid input, falls back to exact string match.
 */
function ipMatchesCidr(ip: string, cidr: string): boolean {
  const [range, prefixLenStr] = cidr.split("/");
  if (!range || !prefixLenStr) return false;

  const prefixLen = parseInt(prefixLenStr, 10);
  if (isNaN(prefixLen) || prefixLen < 0 || prefixLen > 32) return false;

  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);

  if (ipNum === null || rangeNum === null) return false;

  // Create a mask with the first `prefixLen` bits set
  const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;

  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * Convert a dotted-quad IPv4 string to a 32-bit unsigned integer.
 * Returns null for non-IPv4 addresses.
 */
function ipToNumber(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;

  let num = 0;
  for (const part of parts) {
    const octet = parseInt(part, 10);
    if (isNaN(octet) || octet < 0 || octet > 255) return null;
    num = (num * 256 + octet) >>> 0;
  }
  return num;
}

// ---- Geo Restriction ------------------------------------------------------

/**
 * Extract the country code from the request using Vercel/Cloudflare headers.
 * Returns null if the country cannot be determined.
 */
export function getGeoFromIp(request: Request): string | null {
  // Cloudflare header (most reliable when behind CF)
  const cfCountry = request.headers.get("cf-ipcountry");
  if (cfCountry && cfCountry !== "XX" && cfCountry !== "T1") return cfCountry.toUpperCase();

  // Vercel's own geo header
  const vercelCountry = request.headers.get("x-vercel-ip-country");
  if (vercelCountry && vercelCountry !== "XX") return vercelCountry.toUpperCase();

  return null;
}

/**
 * Check whether the request's country is allowed by the geo restrictions config.
 * Returns true if geo restrictions are disabled or the country is in the allowed list.
 */
export function checkGeoRestriction(country: string | null, geoConfig: GeoRestrictions): boolean {
  if (!geoConfig.enabled) return true;
  if (!geoConfig.allowed_countries || geoConfig.allowed_countries.length === 0) return true;

  // If we cannot determine the country and restrictions are enabled, block by default
  if (!country) return false;

  return geoConfig.allowed_countries.includes(country);
}

// ---- Orchestrator ---------------------------------------------------------

/**
 * Validate the full security context of a request against an organization's
 * IP allowlist and geo-restriction settings.
 */
export function validateSecurityContext(
  request: Request,
  org: Pick<Organization, "ip_allowlist" | "geo_restrictions">,
): SecurityContextResult {
  const ip = getIpFromRequest(request);
  const country = getGeoFromIp(request);

  const ipAllowlist = (org.ip_allowlist ?? []) as string[];
  const geoConfig = (org.geo_restrictions ?? { enabled: false, allowed_countries: [] }) as GeoRestrictions;

  // Check IP allowlist
  if (!checkIpAllowlist(ip, ipAllowlist)) {
    return {
      allowed: false,
      ip,
      country,
      reason: `IP address ${ip} is not in the organization's allowlist`,
    };
  }

  // Check geo restriction
  if (!checkGeoRestriction(country, geoConfig)) {
    return {
      allowed: false,
      ip,
      country,
      reason: country
        ? `Country ${country} is not in the organization's allowed countries`
        : "Unable to determine request country; geo-restriction is enabled",
    };
  }

  return { allowed: true, ip, country };
}

// ---- Helpers --------------------------------------------------------------

/**
 * Extract the client IP address from the request headers.
 */
function getIpFromRequest(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ---------------------------------------------------------------------------
// OKrunit -- Tests for In-Memory Rate Limiter
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkIpRateLimit,
  getClientIp,
  API_RATE_LIMIT,
  AUTH_RATE_LIMIT,
  WRITE_RATE_LIMIT,
  INVITE_RATE_LIMIT,
  REPLAY_RATE_LIMIT,
  ANALYTICS_RATE_LIMIT,
  type RateLimitConfig,
} from "../ip-rate-limiter";

// ---- Helpers --------------------------------------------------------------

const testConfig: RateLimitConfig = {
  limit: 3,
  windowSeconds: 10,
};

// ---- checkIpRateLimit -----------------------------------------------------

describe("checkIpRateLimit", () => {
  // Use unique keys per test to avoid cross-test contamination (in-memory store is shared)
  let keyCounter = 0;
  function uniqueKey() {
    return `test-key-${Date.now()}-${++keyCounter}`;
  }

  it("allows the first request", () => {
    const key = uniqueKey();
    const result = checkIpRateLimit(key, testConfig);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.limit).toBe(3);
  });

  it("allows requests under the limit", () => {
    const key = uniqueKey();
    const r1 = checkIpRateLimit(key, testConfig);
    const r2 = checkIpRateLimit(key, testConfig);
    const r3 = checkIpRateLimit(key, testConfig);

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests over the limit", () => {
    const key = uniqueKey();

    // Exhaust the limit
    for (let i = 0; i < 3; i++) {
      checkIpRateLimit(key, testConfig);
    }

    // Fourth request should be blocked
    const result = checkIpRateLimit(key, testConfig);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("returns correct remaining count when over limit", () => {
    const key = uniqueKey();

    for (let i = 0; i < 5; i++) {
      checkIpRateLimit(key, testConfig);
    }

    const result = checkIpRateLimit(key, testConfig);
    expect(result.allowed).toBe(false);
    // remaining should never go below 0
    expect(result.remaining).toBe(0);
  });

  it("resets counter after window expiry", () => {
    const key = uniqueKey();

    // Exhaust the limit
    for (let i = 0; i < 3; i++) {
      checkIpRateLimit(key, testConfig);
    }

    const blocked = checkIpRateLimit(key, testConfig);
    expect(blocked.allowed).toBe(false);

    // Advance time past the window (10 seconds)
    vi.useFakeTimers();
    vi.advanceTimersByTime(11_000);

    const afterReset = checkIpRateLimit(key, testConfig);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(2);

    vi.useRealTimers();
  });

  it("tracks different keys independently", () => {
    const keyA = uniqueKey();
    const keyB = uniqueKey();

    // Exhaust key A
    for (let i = 0; i < 3; i++) {
      checkIpRateLimit(keyA, testConfig);
    }
    const blockedA = checkIpRateLimit(keyA, testConfig);
    expect(blockedA.allowed).toBe(false);

    // Key B should still be allowed
    const resultB = checkIpRateLimit(keyB, testConfig);
    expect(resultB.allowed).toBe(true);
    expect(resultB.remaining).toBe(2);
  });

  it("returns a resetAt Date in the future", () => {
    const key = uniqueKey();
    const before = Date.now();
    const result = checkIpRateLimit(key, testConfig);
    const after = Date.now();

    expect(result.resetAt).toBeInstanceOf(Date);
    // resetAt should be approximately now + windowSeconds * 1000
    expect(result.resetAt.getTime()).toBeGreaterThanOrEqual(before + testConfig.windowSeconds * 1000);
    expect(result.resetAt.getTime()).toBeLessThanOrEqual(after + testConfig.windowSeconds * 1000);
  });

  it("uses a limit of 1 correctly", () => {
    const key = uniqueKey();
    const strictConfig: RateLimitConfig = { limit: 1, windowSeconds: 60 };

    const first = checkIpRateLimit(key, strictConfig);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(0);

    const second = checkIpRateLimit(key, strictConfig);
    expect(second.allowed).toBe(false);
    expect(second.remaining).toBe(0);
  });
});

// ---- getClientIp ----------------------------------------------------------

describe("getClientIp", () => {
  it("reads x-forwarded-for header (first IP in chain)", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("reads single x-forwarded-for IP", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it("falls back to x-real-ip when x-forwarded-for is missing", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "192.168.1.1" },
    });
    expect(getClientIp(req)).toBe("192.168.1.1");
  });

  it("returns 'unknown' when no IP headers are present", () => {
    const req = new Request("https://example.com");
    expect(getClientIp(req)).toBe("unknown");
  });

  it("prefers x-forwarded-for over x-real-ip", () => {
    const req = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "1.1.1.1",
        "x-real-ip": "2.2.2.2",
      },
    });
    expect(getClientIp(req)).toBe("1.1.1.1");
  });

  it("trims whitespace from forwarded IP", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "  3.3.3.3  , 4.4.4.4" },
    });
    expect(getClientIp(req)).toBe("3.3.3.3");
  });
});

// ---- Preset configurations ------------------------------------------------

describe("preset configurations", () => {
  it("API_RATE_LIMIT is 100 per 60s", () => {
    expect(API_RATE_LIMIT.limit).toBe(100);
    expect(API_RATE_LIMIT.windowSeconds).toBe(60);
  });

  it("AUTH_RATE_LIMIT is 10 per 60s", () => {
    expect(AUTH_RATE_LIMIT.limit).toBe(10);
    expect(AUTH_RATE_LIMIT.windowSeconds).toBe(60);
  });

  it("WRITE_RATE_LIMIT is 20 per 60s", () => {
    expect(WRITE_RATE_LIMIT.limit).toBe(20);
    expect(WRITE_RATE_LIMIT.windowSeconds).toBe(60);
  });

  it("INVITE_RATE_LIMIT is 10 per 3600s", () => {
    expect(INVITE_RATE_LIMIT.limit).toBe(10);
    expect(INVITE_RATE_LIMIT.windowSeconds).toBe(3600);
  });

  it("REPLAY_RATE_LIMIT is 5 per 60s", () => {
    expect(REPLAY_RATE_LIMIT.limit).toBe(5);
    expect(REPLAY_RATE_LIMIT.windowSeconds).toBe(60);
  });

  it("ANALYTICS_RATE_LIMIT is 10 per 60s", () => {
    expect(ANALYTICS_RATE_LIMIT.limit).toBe(10);
    expect(ANALYTICS_RATE_LIMIT.windowSeconds).toBe(60);
  });
});

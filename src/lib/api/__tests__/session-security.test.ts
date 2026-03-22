// ---------------------------------------------------------------------------
// OKRunit -- Tests for Session Security
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { checkReauthRequired, isSessionTimedOut } from "../session-security";

// ---- checkReauthRequired --------------------------------------------------

describe("checkReauthRequired", () => {
  it("does not require reauth when org setting is disabled", () => {
    const result = checkReauthRequired(
      { require_reauth_for_critical: false },
      { priority: "critical" },
      null,
    );
    expect(result.required).toBe(false);
  });

  it("does not require reauth for non-critical approvals", () => {
    const result = checkReauthRequired(
      { require_reauth_for_critical: true },
      { priority: "high" },
      null,
    );
    expect(result.required).toBe(false);
  });

  it("requires reauth for critical approval with no previous reauth", () => {
    const result = checkReauthRequired(
      { require_reauth_for_critical: true },
      { priority: "critical" },
      null,
    );
    expect(result.required).toBe(true);
    expect(result.reason).toContain("Re-authentication");
  });

  it("requires reauth when last reauth was more than 5 minutes ago", () => {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    const result = checkReauthRequired(
      { require_reauth_for_critical: true },
      { priority: "critical" },
      sixMinutesAgo,
    );
    expect(result.required).toBe(true);
  });

  it("does not require reauth when last reauth was within 5 minutes", () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const result = checkReauthRequired(
      { require_reauth_for_critical: true },
      { priority: "critical" },
      twoMinutesAgo,
    );
    expect(result.required).toBe(false);
  });

  it("does not require reauth when last reauth was just now", () => {
    const now = new Date().toISOString();
    const result = checkReauthRequired(
      { require_reauth_for_critical: true },
      { priority: "critical" },
      now,
    );
    expect(result.required).toBe(false);
  });
});

// ---- isSessionTimedOut ----------------------------------------------------

describe("isSessionTimedOut", () => {
  it("returns false when session is within timeout", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const result = isSessionTimedOut(
      { session_timeout_minutes: 480 },
      oneHourAgo,
    );
    expect(result).toBe(false);
  });

  it("returns true when session exceeds timeout", () => {
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString();
    const result = isSessionTimedOut(
      { session_timeout_minutes: 480 },
      tenHoursAgo,
    );
    expect(result).toBe(true);
  });

  it("handles Unix epoch seconds as session timestamp", () => {
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
    const result = isSessionTimedOut(
      { session_timeout_minutes: 480 },
      fiveMinutesAgo,
    );
    expect(result).toBe(false);
  });

  it("returns false when timeout is 0 (unlimited)", () => {
    const longAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const result = isSessionTimedOut(
      { session_timeout_minutes: 0 },
      longAgo,
    );
    expect(result).toBe(false);
  });

  it("uses default 480 minutes when session_timeout_minutes is null", () => {
    const nineHoursAgo = new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString();
    const result = isSessionTimedOut(
      { session_timeout_minutes: null as unknown as number },
      nineHoursAgo,
    );
    expect(result).toBe(true);
  });
});

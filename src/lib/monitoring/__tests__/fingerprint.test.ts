// ---------------------------------------------------------------------------
// OKrunit -- Tests for Error Fingerprinting
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { generateFingerprint } from "../fingerprint";

describe("generateFingerprint", () => {
  it("returns a deterministic hash for the same error", () => {
    const err = new TypeError("Cannot read properties of undefined");
    const fp1 = generateFingerprint(err);
    const fp2 = generateFingerprint(err);
    expect(fp1).toBe(fp2);
    expect(fp1).toHaveLength(64); // SHA-256 hex
  });

  it("groups errors with different UUIDs in the message", () => {
    const err1 = new Error("User abc12345-1234-1234-1234-123456789012 not found");
    const err2 = new Error("User def67890-5678-5678-5678-567890123456 not found");
    expect(generateFingerprint(err1)).toBe(generateFingerprint(err2));
  });

  it("groups errors with different numeric IDs in the message", () => {
    const err1 = new Error("Row 12345 failed to insert");
    const err2 = new Error("Row 67890 failed to insert");
    expect(generateFingerprint(err1)).toBe(generateFingerprint(err2));
  });

  it("groups errors with different timestamps in the message", () => {
    const err1 = new Error("Timeout at 2026-03-30T12:00:00.000Z");
    const err2 = new Error("Timeout at 2026-03-31T15:30:00.000Z");
    expect(generateFingerprint(err1)).toBe(generateFingerprint(err2));
  });

  it("differentiates errors with different types", () => {
    const err1 = new TypeError("foo");
    const err2 = new RangeError("foo");
    expect(generateFingerprint(err1)).not.toBe(generateFingerprint(err2));
  });

  it("differentiates errors with different messages", () => {
    const err1 = new Error("Connection refused");
    const err2 = new Error("Connection timeout");
    expect(generateFingerprint(err1)).not.toBe(generateFingerprint(err2));
  });

  it("handles string errors", () => {
    const fp = generateFingerprint("something went wrong");
    expect(fp).toHaveLength(64);
  });

  it("handles non-error objects", () => {
    const fp = generateFingerprint({ code: 500, msg: "fail" });
    expect(fp).toHaveLength(64);
  });

  it("handles null/undefined", () => {
    const fp1 = generateFingerprint(null);
    const fp2 = generateFingerprint(undefined);
    expect(fp1).toHaveLength(64);
    expect(fp2).toHaveLength(64);
  });
});

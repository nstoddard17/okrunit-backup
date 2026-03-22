// ---------------------------------------------------------------------------
// OKRunit -- Tests for Four-Eyes Principle
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { checkFourEyes, enforceFourEyesOnCreation } from "../four-eyes";

// ---- Helpers --------------------------------------------------------------

const disabledConfig = { enabled: false, action_types: [], min_priority: null };
const enabledByAction = { enabled: true, action_types: ["deploy", "delete"], min_priority: null };
const enabledByPriority = { enabled: true, action_types: [], min_priority: "high" as const };
const enabledByBoth = { enabled: true, action_types: ["deploy"], min_priority: "critical" as const };

// ---- checkFourEyes --------------------------------------------------------

describe("checkFourEyes", () => {
  it("allows when four-eyes is disabled", () => {
    const result = checkFourEyes(
      { four_eyes_config: disabledConfig },
      { action_type: "deploy", priority: "critical", required_approvals: 1, created_by: { type: "oauth", user_id: "user-1" } },
      "user-1",
    );
    expect(result.allowed).toBe(true);
    expect(result.enforced).toBe(false);
  });

  it("blocks self-approval when action_type matches", () => {
    const result = checkFourEyes(
      { four_eyes_config: enabledByAction },
      { action_type: "deploy", priority: "low", required_approvals: 2, created_by: { type: "oauth", user_id: "user-1" } },
      "user-1",
    );
    expect(result.allowed).toBe(false);
    expect(result.enforced).toBe(true);
    expect(result.reason).toContain("Four-eyes");
  });

  it("allows different user even when action_type matches", () => {
    const result = checkFourEyes(
      { four_eyes_config: enabledByAction },
      { action_type: "deploy", priority: "low", required_approvals: 2, created_by: { type: "oauth", user_id: "user-1" } },
      "user-2",
    );
    expect(result.allowed).toBe(true);
    expect(result.enforced).toBe(true);
  });

  it("does not enforce when action_type does not match and no priority threshold", () => {
    const result = checkFourEyes(
      { four_eyes_config: enabledByAction },
      { action_type: "read", priority: "low", required_approvals: 1, created_by: { type: "oauth", user_id: "user-1" } },
      "user-1",
    );
    expect(result.allowed).toBe(true);
    expect(result.enforced).toBe(false);
  });

  it("blocks self-approval when priority exceeds threshold", () => {
    const result = checkFourEyes(
      { four_eyes_config: enabledByPriority },
      { action_type: "read", priority: "critical", required_approvals: 1, created_by: { type: "api_key", user_id: "user-1" } },
      "user-1",
    );
    expect(result.allowed).toBe(false);
    expect(result.enforced).toBe(true);
  });

  it("does not block when priority is below threshold", () => {
    const result = checkFourEyes(
      { four_eyes_config: enabledByPriority },
      { action_type: "read", priority: "medium", required_approvals: 1, created_by: { type: "api_key", user_id: "user-1" } },
      "user-1",
    );
    expect(result.allowed).toBe(true);
    expect(result.enforced).toBe(false);
  });

  it("handles null created_by gracefully", () => {
    const result = checkFourEyes(
      { four_eyes_config: enabledByAction },
      { action_type: "deploy", priority: "low", required_approvals: 2, created_by: null },
      "user-1",
    );
    expect(result.allowed).toBe(true);
    expect(result.enforced).toBe(true);
  });

  it("handles created_by without user_id (API key without user)", () => {
    const result = checkFourEyes(
      { four_eyes_config: enabledByAction },
      { action_type: "deploy", priority: "low", required_approvals: 2, created_by: { type: "api_key" as const } },
      "user-1",
    );
    expect(result.allowed).toBe(true);
    expect(result.enforced).toBe(true);
  });
});

// ---- enforceFourEyesOnCreation --------------------------------------------

describe("enforceFourEyesOnCreation", () => {
  it("does not bump when four-eyes is disabled", () => {
    const result = enforceFourEyesOnCreation(
      { four_eyes_config: disabledConfig },
      { action_type: "deploy", priority: "critical", required_approvals: 1 },
    );
    expect(result).toBe(1);
  });

  it("bumps required_approvals to 2 when four-eyes applies and required is 1", () => {
    const result = enforceFourEyesOnCreation(
      { four_eyes_config: enabledByAction },
      { action_type: "deploy", priority: "low", required_approvals: 1 },
    );
    expect(result).toBe(2);
  });

  it("keeps required_approvals when already >= 2", () => {
    const result = enforceFourEyesOnCreation(
      { four_eyes_config: enabledByAction },
      { action_type: "deploy", priority: "low", required_approvals: 3 },
    );
    expect(result).toBe(3);
  });

  it("bumps by priority threshold", () => {
    const result = enforceFourEyesOnCreation(
      { four_eyes_config: enabledByPriority },
      { action_type: "read", priority: "high", required_approvals: 1 },
    );
    expect(result).toBe(2);
  });

  it("does not bump when neither action nor priority matches", () => {
    const result = enforceFourEyesOnCreation(
      { four_eyes_config: enabledByBoth },
      { action_type: "read", priority: "low", required_approvals: 1 },
    );
    expect(result).toBe(1);
  });
});

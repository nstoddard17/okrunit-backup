// ---------------------------------------------------------------------------
// OKrunit -- Tests for Escalation Logic
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { calculateNextEscalation } from "../escalation";
import type { EscalationConfig } from "@/lib/types/database";

const baseConfig: EscalationConfig = {
  enabled: true,
  levels: [
    { level: 1, delay_minutes: 30, target: { type: "same_approvers" } },
    { level: 2, delay_minutes: 60, target: { type: "org_admins" } },
    { level: 3, delay_minutes: 120, target: { type: "org_admins" } },
  ],
};

describe("calculateNextEscalation", () => {
  it("returns level 1 when starting from 0", () => {
    const createdAt = new Date("2026-03-30T12:00:00Z");
    const result = calculateNextEscalation(baseConfig, 0, createdAt);

    expect(result).not.toBeNull();
    expect(result!.nextLevel).toBe(1);
    // 30 minutes after creation
    expect(result!.nextEscalationAt).toBe(
      new Date("2026-03-30T12:30:00Z").toISOString(),
    );
  });

  it("returns level 2 after level 1 fires", () => {
    const createdAt = new Date("2026-03-30T12:00:00Z");
    const result = calculateNextEscalation(baseConfig, 1, createdAt);

    expect(result).not.toBeNull();
    expect(result!.nextLevel).toBe(2);
    // 60 minutes after creation (not 60 after level 1)
    expect(result!.nextEscalationAt).toBe(
      new Date("2026-03-30T13:00:00Z").toISOString(),
    );
  });

  it("returns level 3 after level 2 fires", () => {
    const createdAt = new Date("2026-03-30T12:00:00Z");
    const result = calculateNextEscalation(baseConfig, 2, createdAt);

    expect(result).not.toBeNull();
    expect(result!.nextLevel).toBe(3);
    expect(result!.nextEscalationAt).toBe(
      new Date("2026-03-30T14:00:00Z").toISOString(),
    );
  });

  it("returns null when all levels exhausted", () => {
    const result = calculateNextEscalation(baseConfig, 3, new Date());
    expect(result).toBeNull();
  });

  it("returns null when config is disabled", () => {
    const disabled = { ...baseConfig, enabled: false };
    const result = calculateNextEscalation(disabled, 0, new Date());
    expect(result).toBeNull();
  });

  it("returns null when config has no levels", () => {
    const empty = { enabled: true, levels: [] };
    const result = calculateNextEscalation(empty, 0, new Date());
    expect(result).toBeNull();
  });

  it("handles out-of-order levels correctly", () => {
    const unordered: EscalationConfig = {
      enabled: true,
      levels: [
        { level: 3, delay_minutes: 120, target: { type: "org_admins" } },
        { level: 1, delay_minutes: 30, target: { type: "same_approvers" } },
        { level: 2, delay_minutes: 60, target: { type: "org_admins" } },
      ],
    };
    const result = calculateNextEscalation(unordered, 0, new Date());
    expect(result!.nextLevel).toBe(1);
  });
});

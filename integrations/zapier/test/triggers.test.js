// ---------------------------------------------------------------------------
// Gatekeeper Zapier -- Triggers Tests
// ---------------------------------------------------------------------------

const zapier = require("zapier-platform-core");
const App = require("../index");

const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

const AUTH_DATA = {
  apiKey: process.env.API_KEY || "gk_test_1234567890abcdef",
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
};

describe("Approval Decided Trigger", () => {
  it("fetches decided approvals without filters", async () => {
    const bundle = {
      authData: AUTH_DATA,
      inputData: {
        status_filter: "",
        priority_filter: "",
      },
    };

    const results = await appTester(
      App.triggers.approval_decided.operation.perform,
      bundle,
    );

    expect(Array.isArray(results)).toBe(true);
    // All returned items should have a decided_at timestamp
    for (const item of results) {
      expect(item.decided_at).toBeDefined();
    }
  });

  it("fetches only approved decisions", async () => {
    const bundle = {
      authData: AUTH_DATA,
      inputData: {
        status_filter: "approved",
        priority_filter: "",
      },
    };

    const results = await appTester(
      App.triggers.approval_decided.operation.perform,
      bundle,
    );

    expect(Array.isArray(results)).toBe(true);
    for (const item of results) {
      expect(item.status).toBe("approved");
    }
  });

  it("fetches only rejected decisions", async () => {
    const bundle = {
      authData: AUTH_DATA,
      inputData: {
        status_filter: "rejected",
        priority_filter: "",
      },
    };

    const results = await appTester(
      App.triggers.approval_decided.operation.perform,
      bundle,
    );

    expect(Array.isArray(results)).toBe(true);
    for (const item of results) {
      expect(item.status).toBe("rejected");
    }
  });

  it("filters by priority", async () => {
    const bundle = {
      authData: AUTH_DATA,
      inputData: {
        status_filter: "",
        priority_filter: "critical",
      },
    };

    const results = await appTester(
      App.triggers.approval_decided.operation.perform,
      bundle,
    );

    expect(Array.isArray(results)).toBe(true);
    for (const item of results) {
      expect(item.priority).toBe("critical");
    }
  });

  it("returns results sorted by decided_at descending", async () => {
    const bundle = {
      authData: AUTH_DATA,
      inputData: {
        status_filter: "",
        priority_filter: "",
      },
    };

    const results = await appTester(
      App.triggers.approval_decided.operation.perform,
      bundle,
    );

    for (let i = 1; i < results.length; i++) {
      const prev = new Date(results[i - 1].decided_at).getTime();
      const curr = new Date(results[i].decided_at).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  it("has correct sample data", () => {
    const sample = App.triggers.approval_decided.operation.sample;
    expect(sample.id).toBeDefined();
    expect(sample.status).toBe("approved");
    expect(sample.decided_by).toBeDefined();
    expect(sample.decided_at).toBeDefined();
    expect(sample.decision_comment).toBeDefined();
  });
});

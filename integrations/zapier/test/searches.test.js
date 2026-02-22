// ---------------------------------------------------------------------------
// Gatekeeper Zapier -- Searches Tests
// ---------------------------------------------------------------------------

const zapier = require("zapier-platform-core");
const App = require("../index");

const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

const AUTH_DATA = {
  apiKey: process.env.API_KEY || "gk_test_1234567890abcdef",
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
};

describe("Get Approval", () => {
  it("fetches a single approval by ID", async () => {
    // First create an approval to fetch
    const createBundle = {
      authData: AUTH_DATA,
      inputData: {
        title: "Approval for get test",
        priority: "medium",
      },
    };

    const created = await appTester(
      App.creates.create_approval.operation.perform,
      createBundle,
    );

    const bundle = {
      authData: AUTH_DATA,
      inputData: {
        approval_id: created.id,
      },
    };

    const results = await appTester(
      App.searches.get_approval.operation.perform,
      bundle,
    );

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(created.id);
    expect(results[0].title).toBe("Approval for get test");
  });

  it("has correct sample data", () => {
    const sample = App.searches.get_approval.operation.sample;
    expect(sample.id).toBeDefined();
    expect(sample.title).toBeDefined();
    expect(sample.status).toBe("pending");
  });
});

describe("List Approvals", () => {
  it("lists approvals without filters", async () => {
    const bundle = {
      authData: AUTH_DATA,
      inputData: {},
    };

    const results = await appTester(
      App.searches.list_approvals.operation.perform,
      bundle,
    );

    expect(Array.isArray(results)).toBe(true);
  });

  it("filters by status", async () => {
    const bundle = {
      authData: AUTH_DATA,
      inputData: {
        status: "pending",
      },
    };

    const results = await appTester(
      App.searches.list_approvals.operation.perform,
      bundle,
    );

    expect(Array.isArray(results)).toBe(true);
    for (const item of results) {
      expect(item.status).toBe("pending");
    }
  });

  it("filters by priority", async () => {
    const bundle = {
      authData: AUTH_DATA,
      inputData: {
        priority: "high",
      },
    };

    const results = await appTester(
      App.searches.list_approvals.operation.perform,
      bundle,
    );

    expect(Array.isArray(results)).toBe(true);
    for (const item of results) {
      expect(item.priority).toBe("high");
    }
  });

  it("supports full-text search", async () => {
    // Create an approval with a unique title
    const createBundle = {
      authData: AUTH_DATA,
      inputData: {
        title: "UniqueSearchTermXYZ deployment",
        priority: "low",
      },
    };

    await appTester(
      App.creates.create_approval.operation.perform,
      createBundle,
    );

    const bundle = {
      authData: AUTH_DATA,
      inputData: {
        search: "UniqueSearchTermXYZ",
      },
    };

    const results = await appTester(
      App.searches.list_approvals.operation.perform,
      bundle,
    );

    expect(Array.isArray(results)).toBe(true);
    // Should find at least the one we just created
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("respects page_size limit", async () => {
    const bundle = {
      authData: AUTH_DATA,
      inputData: {
        page_size: 2,
      },
    };

    const results = await appTester(
      App.searches.list_approvals.operation.perform,
      bundle,
    );

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("has correct sample data", () => {
    const sample = App.searches.list_approvals.operation.sample;
    expect(sample.id).toBeDefined();
    expect(sample.title).toBeDefined();
    expect(sample.status).toBe("pending");
    expect(sample.priority).toBeDefined();
  });
});

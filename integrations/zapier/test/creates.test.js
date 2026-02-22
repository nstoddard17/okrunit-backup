// ---------------------------------------------------------------------------
// Gatekeeper Zapier -- Creates Tests
// ---------------------------------------------------------------------------

const zapier = require("zapier-platform-core");
const App = require("../index");

const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

const AUTH_DATA = {
  apiKey: process.env.API_KEY || "gk_test_1234567890abcdef",
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
};

describe("Create Approval", () => {
  it("creates an approval request with required fields", async () => {
    const bundle = {
      authData: AUTH_DATA,
      inputData: {
        title: "Test deployment approval",
        priority: "medium",
      },
    };

    const result = await appTester(
      App.creates.create_approval.operation.perform,
      bundle,
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.title).toBe("Test deployment approval");
    expect(result.priority).toBe("medium");
    expect(result.status).toBe("pending");
  });

  it("creates an approval request with all optional fields", async () => {
    const bundle = {
      authData: AUTH_DATA,
      inputData: {
        title: "Full test approval",
        priority: "high",
        description: "A detailed description for testing",
        action_type: "deploy",
        metadata: '{"env": "staging", "version": "1.0.0"}',
        required_approvals: "2",
      },
    };

    const result = await appTester(
      App.creates.create_approval.operation.perform,
      bundle,
    );

    expect(result).toBeDefined();
    expect(result.title).toBe("Full test approval");
    expect(result.priority).toBe("high");
    expect(result.description).toBe("A detailed description for testing");
    expect(result.action_type).toBe("deploy");
    expect(result.required_approvals).toBe(2);
  });

  it("rejects invalid metadata JSON", async () => {
    const bundle = {
      authData: AUTH_DATA,
      inputData: {
        title: "Bad metadata test",
        priority: "low",
        metadata: "not valid json{",
      },
    };

    await expect(
      appTester(App.creates.create_approval.operation.perform, bundle),
    ).rejects.toThrow("Metadata must be valid JSON");
  });

  it("has correct sample data", () => {
    const sample = App.creates.create_approval.operation.sample;
    expect(sample.id).toBeDefined();
    expect(sample.title).toBeDefined();
    expect(sample.status).toBe("pending");
    expect(sample.priority).toBeDefined();
  });
});

describe("Add Comment", () => {
  it("adds a comment to an approval", async () => {
    // First create an approval to comment on
    const createBundle = {
      authData: AUTH_DATA,
      inputData: {
        title: "Approval for comment test",
        priority: "low",
      },
    };

    const approval = await appTester(
      App.creates.create_approval.operation.perform,
      createBundle,
    );

    const bundle = {
      authData: AUTH_DATA,
      inputData: {
        approval_id: approval.id,
        body: "This is a test comment from Zapier.",
      },
    };

    const result = await appTester(
      App.creates.add_comment.operation.perform,
      bundle,
    );

    expect(result).toBeDefined();
    expect(result.body).toBe("This is a test comment from Zapier.");
  });

  it("has correct sample data", () => {
    const sample = App.creates.add_comment.operation.sample;
    expect(sample.id).toBeDefined();
    expect(sample.request_id).toBeDefined();
    expect(sample.body).toBeDefined();
  });
});

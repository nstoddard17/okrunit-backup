// ---------------------------------------------------------------------------
// OKRunit Zapier -- Creates Tests
// ---------------------------------------------------------------------------

const zapier = require("zapier-platform-core");
const App = require("../index");

const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe("Request Approval (Send & Wait)", () => {
  it("has correct sample data", () => {
    const sample = App.creates.request_approval.operation.sample;
    expect(sample.id).toBeDefined();
    expect(sample.title).toBeDefined();
    expect(sample.status).toBe("approved");
    expect(sample.decision).toBe("approved");
    expect(sample.decided_by).toBeDefined();
    expect(sample.decided_by_name).toBeDefined();
  });

  it("has output fields defined", () => {
    const fields = App.creates.request_approval.operation.outputFields;
    expect(fields).toBeDefined();
    expect(fields.length).toBeGreaterThan(0);
    const keys = fields.map((f) => f.key);
    expect(keys).toContain("id");
    expect(keys).toContain("title");
    expect(keys).toContain("decision");
    expect(keys).toContain("decided_by_name");
    expect(keys).toContain("decided_at");
  });

  it("has performResume defined for callback", () => {
    expect(App.creates.request_approval.operation.performResume).toBeDefined();
    expect(typeof App.creates.request_approval.operation.performResume).toBe(
      "function",
    );
  });

  it("performResume extracts callback data correctly", async () => {
    const mockZ = {
      errors: { HaltedError: class extends Error { constructor(msg) { super(msg); } } },
    };
    const bundle = {
      outputData: {
        id: "abc-123",
        title: "Test approval",
        priority: "high",
        created_at: "2026-01-01T00:00:00Z",
        metadata: { env: "prod" },
      },
      cleanedRequest: {
        id: "abc-123",
        title: "Test approval",
        status: "approved",
        priority: "high",
        decided_by: "user-456",
        decided_by_name: "Jane Smith",
        decision_comment: "Looks good",
        decided_at: "2026-01-01T01:00:00Z",
        metadata: { env: "prod" },
      },
    };

    const result =
      await App.creates.request_approval.operation.performResume(
        mockZ,
        bundle,
      );
    expect(result.id).toBe("abc-123");
    expect(result.status).toBe("approved");
    expect(result.decision).toBe("approved");
    expect(result.decided_by).toBe("user-456");
    expect(result.decided_by_name).toBe("Jane Smith");
    expect(result.decision_comment).toBe("Looks good");
  });

  it("performResume halts the Zap on rejection", async () => {
    class HaltedError extends Error {
      constructor(msg) { super(msg); this.name = "HaltedError"; }
    }
    const mockZ = {
      errors: { HaltedError },
    };
    const bundle = {
      outputData: { id: "abc-123", title: "Test approval" },
      cleanedRequest: {
        id: "abc-123",
        status: "rejected",
        decision_comment: "Not ready",
      },
    };

    await expect(
      App.creates.request_approval.operation.performResume(mockZ, bundle),
    ).rejects.toThrow("Request rejected: Not ready");
  });

  it("performResume halts with default message when no comment", async () => {
    class HaltedError extends Error {
      constructor(msg) { super(msg); this.name = "HaltedError"; }
    }
    const mockZ = {
      errors: { HaltedError },
    };
    const bundle = {
      outputData: { id: "abc-123", title: "Test approval" },
      cleanedRequest: { id: "abc-123", status: "rejected" },
    };

    await expect(
      App.creates.request_approval.operation.performResume(mockZ, bundle),
    ).rejects.toThrow("Request was rejected");
  });

  it("returns sample data during isLoadingSample", async () => {
    const mockZ = {
      generateCallbackUrl: () => "https://hooks.zapier.com/test",
      request: jest.fn(),
      errors: { Error: Error },
    };
    const bundle = {
      inputData: { title: "My test" },
      meta: { isLoadingSample: true, zap: { id: 123 } },
      authData: {},
    };

    const result = await App.creates.request_approval.operation.perform(
      mockZ,
      bundle,
    );
    expect(result.status).toBe("approved");
    expect(result.title).toBe("My test");
    // Should NOT have called the API
    expect(mockZ.request).not.toHaveBeenCalled();
  });
});

describe("Create Approval", () => {
  it("has correct sample data", () => {
    const sample = App.creates.create_approval.operation.sample;
    expect(sample.id).toBeDefined();
    expect(sample.title).toBeDefined();
    expect(sample.status).toBe("pending");
    expect(sample.priority).toBeDefined();
  });

  it("rejects invalid metadata JSON", async () => {
    const mockZ = {
      request: jest.fn(),
      errors: {
        Error: class extends Error {
          constructor(msg, code, status) {
            super(msg);
            this.code = code;
            this.status = status;
          }
        },
      },
    };
    const bundle = {
      inputData: {
        title: "Bad metadata test",
        metadata: "not valid json{",
      },
      meta: { zap: { id: 1 } },
    };

    await expect(
      App.creates.create_approval.operation.perform(mockZ, bundle),
    ).rejects.toThrow("Metadata must be valid JSON");
  });
});

describe("Add Comment", () => {
  it("has correct sample data", () => {
    const sample = App.creates.add_comment.operation.sample;
    expect(sample.id).toBeDefined();
    expect(sample.request_id).toBeDefined();
    expect(sample.body).toBeDefined();
  });

  it("has required input fields", () => {
    const fields = App.creates.add_comment.operation.inputFields;
    expect(fields.length).toBe(2);
    expect(fields[0].key).toBe("approval_id");
    expect(fields[0].required).toBe(true);
    expect(fields[1].key).toBe("body");
    expect(fields[1].required).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// OKRunit Zapier -- Creates Tests
// ---------------------------------------------------------------------------

const zapier = require("zapier-platform-core");
const App = require("../index");

const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

// ---------------------------------------------------------------------------
// requestApproval action (Send & Wait)
// ---------------------------------------------------------------------------

describe("Request Approval (Send & Wait)", () => {
  const op = App.creates.request_approval.operation;

  it("has correct sample data matching spec exactly", () => {
    const sample = op.sample;
    expect(sample.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(sample.title).toBe("Deploy v2.3.1 to production");
    expect(sample.description).toBe("Release includes new payment flow");
    expect(sample.status).toBe("pending");
    expect(sample.priority).toBe("medium");
    expect(sample.source).toBe("make");
    expect(sample.decided_by).toBeNull();
    expect(sample.decided_by_name).toBeNull();
    expect(sample.decision_comment).toBeNull();
    expect(sample.created_at).toBe("2026-02-21T10:00:00.000Z");
    expect(sample.decided_at).toBeNull();
    // Verify exact number of sample fields (11 per spec)
    expect(Object.keys(sample).length).toBe(11);
  });

  it("has exactly 11 output fields matching spec", () => {
    const fields = op.outputFields;
    expect(fields.length).toBe(11);
    const keys = fields.map((f) => f.key);
    expect(keys).toEqual([
      "id",
      "title",
      "description",
      "status",
      "priority",
      "source",
      "decided_by",
      "decided_by_name",
      "decision_comment",
      "created_at",
      "decided_at",
    ]);
  });

  it("has source field in outputFields", () => {
    const keys = op.outputFields.map((f) => f.key);
    expect(keys).toContain("source");
  });

  it("does not have decision field in outputFields (use status instead)", () => {
    const keys = op.outputFields.map((f) => f.key);
    expect(keys).not.toContain("decision");
  });

  it("has correct output field labels", () => {
    const fieldMap = {};
    op.outputFields.forEach((f) => { fieldMap[f.key] = f.label; });
    expect(fieldMap.id).toBe("Approval ID");
    expect(fieldMap.title).toBe("Title");
    expect(fieldMap.description).toBe("Description");
    expect(fieldMap.status).toBe("Status");
    expect(fieldMap.priority).toBe("Priority");
    expect(fieldMap.source).toBe("Source");
    expect(fieldMap.decided_by).toBe("Decided By (User ID)");
    expect(fieldMap.decided_by_name).toBe("Decided By (Name)");
    expect(fieldMap.decision_comment).toBe("Comment");
    expect(fieldMap.created_at).toBe("Created At");
    expect(fieldMap.decided_at).toBe("Decided At");
  });

  it("has correct output field types", () => {
    const typeMap = {};
    op.outputFields.forEach((f) => { typeMap[f.key] = f.type || "text"; });
    expect(typeMap.created_at).toBe("datetime");
    expect(typeMap.decided_at).toBe("datetime");
  });

  it("has performResume defined for callback", () => {
    expect(op.performResume).toBeDefined();
    expect(typeof op.performResume).toBe("function");
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

    const result = await op.performResume(mockZ, bundle);
    expect(result.id).toBe("abc-123");
    expect(result.status).toBe("approved");
    expect(result.decided_by).toBe("user-456");
    expect(result.decided_by_name).toBe("Jane Smith");
    expect(result.decision_comment).toBe("Looks good");
    expect(result.decided_at).toBe("2026-01-01T01:00:00Z");
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
      op.performResume(mockZ, bundle),
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
      op.performResume(mockZ, bundle),
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

    const result = await op.perform(mockZ, bundle);
    expect(result.status).toBe("approved");
    expect(result.title).toBe("My test");
    // Should NOT have called the API
    expect(mockZ.request).not.toHaveBeenCalled();
  });

  it("has input fields matching spec", () => {
    const fields = op.inputFields;
    const keys = fields.map((f) => f.key);
    expect(keys).toContain("title");
    expect(keys).toContain("description");
    expect(keys).toContain("metadata");
    // title is optional per spec
    const titleField = fields.find((f) => f.key === "title");
    expect(titleField.required).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createApproval action
// ---------------------------------------------------------------------------

describe("Create Approval", () => {
  const op = App.creates.create_approval.operation;

  it("has correct sample data matching spec", () => {
    const sample = op.sample;
    expect(sample.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(sample.title).toBe("Deploy v2.3.1 to production");
    expect(sample.description).toBe("Release includes new payment flow");
    expect(sample.status).toBe("pending");
    expect(sample.priority).toBe("medium");
    expect(sample.source).toBe("make");
    expect(sample.decided_by).toBeNull();
    expect(sample.decided_by_name).toBeNull();
    expect(sample.decided_at).toBeNull();
    expect(sample.decision_comment).toBeNull();
    expect(sample.created_at).toBe("2026-02-21T10:00:00.000Z");
  });

  it("has exactly 12 output fields", () => {
    const fields = op.outputFields;
    expect(fields.length).toBe(12);
    const keys = fields.map((f) => f.key);
    expect(keys).toEqual([
      "id",
      "title",
      "description",
      "status",
      "priority",
      "source",
      "decided_by",
      "decided_by_name",
      "decision_comment",
      "requested_by_name",
      "created_at",
      "decided_at",
    ]);
  });

  it("has source field in outputFields", () => {
    const keys = op.outputFields.map((f) => f.key);
    expect(keys).toContain("source");
  });

  it("has requested_by_name field in outputFields", () => {
    const keys = op.outputFields.map((f) => f.key);
    expect(keys).toContain("requested_by_name");
  });

  it("has correct output field labels", () => {
    const fieldMap = {};
    op.outputFields.forEach((f) => { fieldMap[f.key] = f.label; });
    expect(fieldMap.id).toBe("Approval ID");
    expect(fieldMap.title).toBe("Title");
    expect(fieldMap.description).toBe("Description");
    expect(fieldMap.status).toBe("Status");
    expect(fieldMap.priority).toBe("Priority");
    expect(fieldMap.source).toBe("Source");
    expect(fieldMap.decided_by).toBe("Decided By (User ID)");
    expect(fieldMap.decided_by_name).toBe("Decided By (Name)");
    expect(fieldMap.decision_comment).toBe("Comment");
    expect(fieldMap.requested_by_name).toBe("Requested By");
    expect(fieldMap.created_at).toBe("Created At");
    expect(fieldMap.decided_at).toBe("Decided At");
  });

  it("has correct output field types", () => {
    const typeMap = {};
    op.outputFields.forEach((f) => { typeMap[f.key] = f.type || "text"; });
    expect(typeMap.created_at).toBe("datetime");
    expect(typeMap.decided_at).toBe("datetime");
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
      op.perform(mockZ, bundle),
    ).rejects.toThrow("Metadata must be valid JSON");
  });

  it("has input fields matching spec", () => {
    const fields = op.inputFields;
    const keys = fields.map((f) => f.key);
    expect(keys).toContain("title");
    expect(keys).toContain("description");
    expect(keys).toContain("metadata");
    // title is required for createApproval
    const titleField = fields.find((f) => f.key === "title");
    expect(titleField.required).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// addComment action
// ---------------------------------------------------------------------------

describe("Add Comment", () => {
  const op = App.creates.add_comment.operation;

  it("has correct sample data matching spec exactly", () => {
    const sample = op.sample;
    expect(sample.id).toBe("660e8400-e29b-41d4-a716-446655440001");
    expect(sample.approval_id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(sample.body).toBe("Looks good, proceeding with approval.");
    expect(sample.created_by).toBe("770e8400-e29b-41d4-a716-446655440002");
    expect(sample.created_at).toBe("2026-02-21T10:05:00.000Z");
    // Verify exact number of sample fields (5 per spec)
    expect(Object.keys(sample).length).toBe(5);
  });

  it("has exactly 5 output fields matching spec", () => {
    const fields = op.outputFields;
    expect(fields.length).toBe(5);
    const keys = fields.map((f) => f.key);
    expect(keys).toEqual([
      "id",
      "approval_id",
      "body",
      "created_by",
      "created_at",
    ]);
  });

  it("has correct output field labels", () => {
    const fieldMap = {};
    op.outputFields.forEach((f) => { fieldMap[f.key] = f.label; });
    expect(fieldMap.id).toBe("Comment ID");
    expect(fieldMap.approval_id).toBe("Approval ID");
    expect(fieldMap.body).toBe("Comment");
    expect(fieldMap.created_by).toBe("Created By");
    expect(fieldMap.created_at).toBe("Created At");
  });

  it("has correct output field types", () => {
    const typeMap = {};
    op.outputFields.forEach((f) => { typeMap[f.key] = f.type || "text"; });
    expect(typeMap.created_at).toBe("datetime");
  });

  it("has required input fields", () => {
    const fields = op.inputFields;
    expect(fields.length).toBe(2);
    expect(fields[0].key).toBe("approval_id");
    expect(fields[0].required).toBe(true);
    expect(fields[1].key).toBe("body");
    expect(fields[1].required).toBe(true);
  });
});

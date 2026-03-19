// ---------------------------------------------------------------------------
// Gatekeeper Zapier -- Searches Tests
// ---------------------------------------------------------------------------

const zapier = require("zapier-platform-core");
const App = require("../index");

const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe("Get Approval", () => {
  it("has correct sample data", () => {
    const sample = App.searches.get_approval.operation.sample;
    expect(sample.id).toBeDefined();
    expect(sample.title).toBeDefined();
    expect(sample.status).toBe("pending");
  });

  it("has required input fields", () => {
    const fields = App.searches.get_approval.operation.inputFields;
    expect(fields.length).toBe(1);
    expect(fields[0].key).toBe("approval_id");
    expect(fields[0].required).toBe(true);
  });

  it("has output fields defined", () => {
    const fields = App.searches.get_approval.operation.outputFields;
    expect(fields).toBeDefined();
    expect(fields.length).toBeGreaterThan(0);
    const keys = fields.map((f) => f.key);
    expect(keys).toContain("id");
    expect(keys).toContain("title");
    expect(keys).toContain("status");
    expect(keys).toContain("decided_by");
    expect(keys).toContain("decided_by_name");
  });
});

describe("List Approvals", () => {
  it("has correct sample data", () => {
    const sample = App.searches.list_approvals.operation.sample;
    expect(sample.id).toBeDefined();
    expect(sample.title).toBeDefined();
    expect(sample.status).toBe("pending");
    expect(sample.priority).toBeDefined();
  });

  it("has filter input fields", () => {
    const fields = App.searches.list_approvals.operation.inputFields;
    const keys = fields.map((f) => f.key);
    expect(keys).toContain("status");
    expect(keys).toContain("priority");
    expect(keys).toContain("search");
  });

  it("has output fields defined", () => {
    const fields = App.searches.list_approvals.operation.outputFields;
    expect(fields).toBeDefined();
    expect(fields.length).toBeGreaterThan(0);
    const keys = fields.map((f) => f.key);
    expect(keys).toContain("id");
    expect(keys).toContain("title");
    expect(keys).toContain("status");
    expect(keys).toContain("decided_by");
    expect(keys).toContain("decided_by_name");
  });

  it("has priority filter with correct choices", () => {
    const fields = App.searches.list_approvals.operation.inputFields;
    const priorityField = fields.find((f) => f.key === "priority");
    expect(priorityField).toBeDefined();
    expect(priorityField.choices).toHaveProperty("low");
    expect(priorityField.choices).toHaveProperty("medium");
    expect(priorityField.choices).toHaveProperty("high");
    expect(priorityField.choices).toHaveProperty("critical");
  });
});

// ---------------------------------------------------------------------------
// Gatekeeper Zapier -- Triggers Tests
// ---------------------------------------------------------------------------

const zapier = require("zapier-platform-core");
const App = require("../index");

const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

const AUTH_DATA = {
  access_token: process.env.ACCESS_TOKEN || "test_token",
};

describe("New Approval Trigger", () => {
  it("has correct sample data", () => {
    const sample = App.triggers.new_approval.operation.sample;
    expect(sample.id).toBeDefined();
    expect(sample.title).toBeDefined();
    expect(sample.status).toBe("pending");
    expect(sample.priority).toBeDefined();
    expect(sample.created_at).toBeDefined();
  });

  it("has output fields defined", () => {
    const fields = App.triggers.new_approval.operation.outputFields;
    expect(fields).toBeDefined();
    expect(fields.length).toBeGreaterThan(0);
    const keys = fields.map((f) => f.key);
    expect(keys).toContain("id");
    expect(keys).toContain("title");
    expect(keys).toContain("status");
    expect(keys).toContain("priority");
  });

  it("has filter input fields", () => {
    const fields = App.triggers.new_approval.operation.inputFields;
    expect(fields.length).toBe(2);
    expect(fields[0].key).toBe("status_filter");
    expect(fields[1].key).toBe("priority_filter");
  });
});

describe("Approval Decided Trigger", () => {
  it("has correct sample data", () => {
    const sample = App.triggers.approval_decided.operation.sample;
    expect(sample.id).toBeDefined();
    expect(sample.status).toBe("approved");
    expect(sample.decided_by).toBeDefined();
    expect(sample.decided_by_name).toBeDefined();
    expect(sample.decided_at).toBeDefined();
    expect(sample.decision_comment).toBeDefined();
  });

  it("has output fields defined", () => {
    const fields = App.triggers.approval_decided.operation.outputFields;
    expect(fields).toBeDefined();
    expect(fields.length).toBeGreaterThan(0);
    const keys = fields.map((f) => f.key);
    expect(keys).toContain("id");
    expect(keys).toContain("status");
    expect(keys).toContain("decided_by");
    expect(keys).toContain("decided_by_name");
    expect(keys).toContain("decided_at");
  });

  it("has filter input fields", () => {
    const fields = App.triggers.approval_decided.operation.inputFields;
    expect(fields.length).toBe(2);
    expect(fields[0].key).toBe("status_filter");
    expect(fields[1].key).toBe("priority_filter");
  });
});

describe("Hidden Triggers (Dynamic Dropdowns)", () => {
  it("action_types trigger is hidden", () => {
    expect(App.triggers.action_types.display.hidden).toBe(true);
  });

  it("team_members trigger is hidden", () => {
    expect(App.triggers.team_members.display.hidden).toBe(true);
  });

  it("teams trigger is hidden", () => {
    expect(App.triggers.teams.display.hidden).toBe(true);
  });
});

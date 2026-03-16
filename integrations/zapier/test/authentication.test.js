// ---------------------------------------------------------------------------
// Gatekeeper Zapier -- Authentication Tests
// ---------------------------------------------------------------------------

const zapier = require("zapier-platform-core");
const App = require("../index");

const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe("Authentication", () => {
  it("adds Authorization header via beforeRequest middleware", () => {
    const bundle = {
      authData: {
        access_token: "test_access_token_abc123",
      },
    };

    const request = { headers: {} };
    const result = App.beforeRequest[0](request, null, bundle);
    expect(result.headers["Authorization"]).toBe(
      "Bearer test_access_token_abc123",
    );
    expect(result.headers["Content-Type"]).toBe("application/json");
  });

  it("does not add auth header when no access_token", () => {
    const bundle = { authData: {} };
    const request = { headers: {} };
    const result = App.beforeRequest[0](request, null, bundle);
    expect(result.headers["Authorization"]).toBeUndefined();
  });

  it("throws RefreshAuthError on 401", () => {
    const mockZ = {
      errors: {
        RefreshAuthError: class extends Error {
          constructor(msg) {
            super(msg);
            this.name = "RefreshAuthError";
          }
        },
      },
    };

    const response = { status: 401, json: {} };
    expect(() => App.afterResponse[0](response, mockZ)).toThrow(
      "Token expired or invalid",
    );
  });

  it("throws ThrottledError on 429", () => {
    const mockZ = {
      errors: {
        ThrottledError: class extends Error {
          constructor(msg, retryAfter) {
            super(msg);
            this.name = "ThrottledError";
            this.retryAfter = retryAfter;
          }
        },
      },
    };

    const response = { status: 429, json: {} };
    expect(() => App.afterResponse[0](response, mockZ)).toThrow(
      "Rate limit exceeded",
    );
  });

  it("throws on 4xx/5xx with error message from body", () => {
    const mockZ = {
      errors: {
        Error: class extends Error {
          constructor(msg, code, status) {
            super(msg);
            this.name = "Error";
            this.code = code;
            this.status = status;
          }
        },
      },
    };

    const response = {
      status: 403,
      json: { error: "Forbidden", code: "FORBIDDEN" },
    };
    expect(() => App.afterResponse[0](response, mockZ)).toThrow("Forbidden");
  });

  it("passes through successful responses", () => {
    const response = { status: 200, json: { data: [] } };
    const result = App.afterResponse[0](response, {});
    expect(result).toBe(response);
  });
});

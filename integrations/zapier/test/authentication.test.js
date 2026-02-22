// ---------------------------------------------------------------------------
// Gatekeeper Zapier -- Authentication Tests
// ---------------------------------------------------------------------------

const zapier = require("zapier-platform-core");
const App = require("../index");

const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe("Authentication", () => {
  it("passes authentication with valid API key", async () => {
    const bundle = {
      authData: {
        apiKey: process.env.API_KEY || "gk_test_1234567890abcdef",
        baseUrl: process.env.BASE_URL || "http://localhost:3000",
      },
    };

    const result = await appTester(App.authentication.test, bundle);
    expect(result).toBeDefined();
    expect(result.id).toContain("gk_");
  });

  it("generates correct connection label", async () => {
    const bundle = {
      authData: {
        apiKey: "gk_test_1234567890abcdef",
        baseUrl: "http://localhost:3000",
      },
    };

    const result = await appTester(
      App.authentication.connectionLabel,
      bundle,
    );
    expect(result).toContain("Gatekeeper");
    expect(result).toContain("gk_test_123");
  });

  it("adds Authorization header via beforeRequest middleware", async () => {
    const bundle = {
      authData: {
        apiKey: "gk_test_1234567890abcdef",
        baseUrl: "http://localhost:3000",
      },
    };

    const request = { headers: {} };
    const result = App.beforeRequest[0](request, null, bundle);
    expect(result.headers["Authorization"]).toBe(
      "Bearer gk_test_1234567890abcdef",
    );
    expect(result.headers["Content-Type"]).toBe("application/json");
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
      "Invalid API key",
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

  it("passes through successful responses", () => {
    const response = { status: 200, json: { data: [] } };
    const result = App.afterResponse[0](response, {});
    expect(result).toBe(response);
  });
});

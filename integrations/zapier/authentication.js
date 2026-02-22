// ---------------------------------------------------------------------------
// Gatekeeper Zapier Integration -- Authentication
// ---------------------------------------------------------------------------

const authentication = {
  type: "custom",

  fields: [
    {
      key: "apiKey",
      label: "API Key",
      type: "string",
      required: true,
      helpText:
        "Your Gatekeeper API key (starts with gk_). Find it in your Gatekeeper dashboard under Connections.",
    },
    {
      key: "baseUrl",
      label: "Gatekeeper URL",
      type: "string",
      required: true,
      helpText:
        "The base URL of your Gatekeeper instance (e.g., https://gatekeeper.example.com).",
      default: "https://gatekeeper.example.com",
    },
  ],

  test: async (z, bundle) => {
    const response = await z.request({
      url: `${bundle.authData.baseUrl}/api/v1/approvals`,
      params: { page_size: 1 },
    });
    return { id: bundle.authData.apiKey.slice(0, 11) + "..." };
  },

  connectionLabel: (z, bundle) => {
    return `Gatekeeper (${bundle.authData.apiKey.slice(0, 11)}...)`;
  },
};

// Middleware: inject Authorization header on every request
const addApiKeyToHeader = (request, z, bundle) => {
  request.headers["Authorization"] = `Bearer ${bundle.authData.apiKey}`;
  request.headers["Content-Type"] = "application/json";
  return request;
};

// Middleware: handle API errors
const handleErrors = (response, z) => {
  if (response.status === 401) {
    throw new z.errors.RefreshAuthError("Invalid API key");
  }
  if (response.status === 429) {
    throw new z.errors.ThrottledError("Rate limit exceeded", 60);
  }
  if (response.status >= 400) {
    const body = response.json;
    throw new z.errors.Error(
      body.error || `API error: ${response.status}`,
      body.code || "API_ERROR",
      response.status,
    );
  }
  return response;
};

module.exports = { authentication, addApiKeyToHeader, handleErrors };

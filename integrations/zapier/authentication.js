// ---------------------------------------------------------------------------
// Gatekeeper Zapier Integration -- OAuth 2.0 Authentication
// ---------------------------------------------------------------------------

const authentication = {
  type: "oauth2",

  oauth2Config: {
    // User enters their Gatekeeper URL before the OAuth flow starts.
    authorizeUrl: {
      url: "{{bundle.inputData.instance_url}}/oauth/authorize",
      params: {
        client_id: "{{process.env.CLIENT_ID}}",
        redirect_uri: "{{bundle.inputData.redirect_uri}}",
        response_type: "code",
        scope: "approvals:read approvals:write comments:write",
        state: "{{bundle.inputData.state}}",
      },
    },

    getAccessToken: {
      url: "{{bundle.inputData.instance_url}}/api/v1/oauth/token",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        code: "{{bundle.inputData.code}}",
        client_id: "{{process.env.CLIENT_ID}}",
        client_secret: "{{process.env.CLIENT_SECRET}}",
        redirect_uri: "{{bundle.inputData.redirect_uri}}",
        grant_type: "authorization_code",
      },
    },

    refreshAccessToken: {
      url: "{{bundle.authData.instance_url}}/api/v1/oauth/token",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        refresh_token: "{{bundle.authData.refresh_token}}",
        client_id: "{{process.env.CLIENT_ID}}",
        client_secret: "{{process.env.CLIENT_SECRET}}",
        grant_type: "refresh_token",
      },
    },

    autoRefresh: true,
    enablePkce: true,

    scope: "approvals:read approvals:write comments:write",
  },

  // Pre-auth fields — collected before the OAuth redirect.
  fields: [
    {
      key: "instance_url",
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
      url: `${bundle.authData.instance_url}/api/v1/approvals`,
      params: { page_size: 1 },
    });
    return {
      id: bundle.authData.user_email || bundle.authData.org_name || "connected",
    };
  },

  connectionLabel: (z, bundle) => {
    if (bundle.authData.org_name) {
      return `Gatekeeper (${bundle.authData.org_name})`;
    }
    return "Gatekeeper";
  },
};

// Middleware: inject OAuth access token on every request.
const addAuthHeader = (request, z, bundle) => {
  if (bundle.authData.access_token) {
    request.headers["Authorization"] = `Bearer ${bundle.authData.access_token}`;
  }
  request.headers["Content-Type"] = "application/json";
  return request;
};

// Middleware: handle API errors.
const handleErrors = (response, z) => {
  if (response.status === 401) {
    throw new z.errors.RefreshAuthError("Token expired or invalid");
  }
  if (response.status === 429) {
    throw new z.errors.ThrottledError("Rate limit exceeded", 60);
  }
  if (response.status >= 400) {
    const body = response.json;
    throw new z.errors.Error(
      body.error || body.error_description || `API error: ${response.status}`,
      body.code || "API_ERROR",
      response.status,
    );
  }
  return response;
};

module.exports = { authentication, addAuthHeader, handleErrors };

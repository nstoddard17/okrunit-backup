// ---------------------------------------------------------------------------
// Gatekeeper Zapier Integration -- OAuth 2.0 Authentication
// ---------------------------------------------------------------------------
// The GATEKEEPER_URL is set via the Zapier Developer Portal environment
// variables. Users do NOT need to enter any URL — they just click "Connect".
// ---------------------------------------------------------------------------

const GATEKEEPER_URL =
  process.env.GATEKEEPER_URL || "https://www.gkapprove.com";

const authentication = {
  type: "oauth2",

  oauth2Config: {
    authorizeUrl: {
      url: `${GATEKEEPER_URL}/oauth/authorize`,
      params: {
        client_id: "{{process.env.CLIENT_ID}}",
        redirect_uri: "{{bundle.inputData.redirect_uri}}",
        response_type: "code",
        scope: "approvals:read approvals:write comments:write",
        state: "{{bundle.inputData.state}}",
      },
    },

    getAccessToken: async (z, bundle) => {
      const body = {
        code: bundle.inputData.code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: bundle.inputData.redirect_uri,
        grant_type: "authorization_code",
      };

      // PKCE: Zapier puts code_verifier in bundle.inputData when enablePkce is true.
      if (bundle.inputData.code_verifier) {
        body.code_verifier = bundle.inputData.code_verifier;
      }

      const response = await z.request({
        url: `${GATEKEEPER_URL}/api/v1/oauth/token`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      return response.json;
    },

    refreshAccessToken: {
      url: `${GATEKEEPER_URL}/api/v1/oauth/token`,
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

  // No pre-auth fields — users just click "Connect" and authorize.
  fields: [],

  test: async (z, bundle) => {
    const response = await z.request({
      url: `${GATEKEEPER_URL}/api/v1/approvals`,
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

module.exports = { authentication, addAuthHeader, handleErrors, GATEKEEPER_URL };

import type { ICredentialType, INodeProperties } from "n8n-workflow";

export class GatekeeperOAuth2Api implements ICredentialType {
  name = "gatekeeperOAuth2Api";
  displayName = "OKRunit OAuth2 API";
  extends = ["oAuth2Api"];
  documentationUrl =
    "https://github.com/your-org/okrunit/tree/main/integrations/n8n";

  properties: INodeProperties[] = [
    {
      displayName: "Base URL",
      name: "baseUrl",
      type: "string",
      default: "https://okrunit.example.com",
      placeholder: "https://okrunit.example.com",
      description: "The base URL of your OKRunit instance",
    },
    {
      displayName: "Grant Type",
      name: "grantType",
      type: "hidden",
      default: "authorizationCode",
    },
    {
      displayName: "Authorization URL",
      name: "authUrl",
      type: "hidden",
      default: "={{$self.baseUrl}}/oauth/authorize",
    },
    {
      displayName: "Access Token URL",
      name: "accessTokenUrl",
      type: "hidden",
      default: "={{$self.baseUrl}}/api/v1/oauth/token",
    },
    {
      displayName: "Scope",
      name: "scope",
      type: "hidden",
      default: "approvals:read approvals:write comments:write",
    },
    {
      displayName: "Auth URI Query Parameters",
      name: "authQueryParameters",
      type: "hidden",
      default: "",
    },
    {
      displayName: "Authentication",
      name: "authentication",
      type: "hidden",
      default: "body",
    },
  ];
}

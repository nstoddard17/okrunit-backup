import type { ICredentialType, INodeProperties } from "n8n-workflow";

export class GatekeeperApi implements ICredentialType {
  name = "gatekeeperApi";
  displayName = "OKRunit API";
  documentationUrl = "https://github.com/your-org/okrunit/tree/main/integrations/n8n";

  properties: INodeProperties[] = [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      typeOptions: { password: true },
      default: "",
      placeholder: "gk_...",
      description: "Your OKRunit API key (starts with gk_)",
    },
    {
      displayName: "Base URL",
      name: "baseUrl",
      type: "string",
      default: "https://okrunit.example.com",
      placeholder: "https://okrunit.example.com",
      description: "The base URL of your OKRunit instance",
    },
  ];

  authenticate = {
    type: "generic" as const,
    properties: {
      headers: {
        Authorization: "=Bearer {{$credentials.apiKey}}",
      },
    },
  };

  test = {
    request: {
      baseURL: "={{$credentials.baseUrl}}",
      url: "/api/v1/approvals",
      qs: { page_size: "1" },
    },
  };
}

import type {
  IPollFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

interface ApprovalRecord {
  id: string;
  decided_at: string | null;
  [key: string]: unknown;
}

export class GatekeeperTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: "OKRunit Trigger",
    name: "okrunitTrigger",
    icon: "file:gatekeeper.svg",
    group: ["trigger"],
    version: 1,
    description: "Fires when an approval is decided (approved or rejected)",
    defaults: { name: "OKRunit Trigger" },
    inputs: [],
    outputs: ["main"],
    polling: true,
    credentials: [{ name: "gatekeeperApi", required: true }],
    properties: [
      {
        displayName: "Status Filter",
        name: "statusFilter",
        type: "options",
        options: [
          { name: "Any Decision", value: "any" },
          { name: "Approved Only", value: "approved" },
          { name: "Rejected Only", value: "rejected" },
        ],
        default: "any",
        description: "Filter to only trigger on specific decision types",
      },
      {
        displayName: "Priority Filter",
        name: "priorityFilter",
        type: "options",
        options: [
          { name: "Any", value: "" },
          { name: "Low", value: "low" },
          { name: "Medium", value: "medium" },
          { name: "High", value: "high" },
          { name: "Critical", value: "critical" },
        ],
        default: "",
        description: "Only trigger for approvals with this priority",
      },
    ],
  };

  async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
    const credentials = await this.getCredentials("gatekeeperApi");
    const baseUrl = credentials.baseUrl as string;
    const statusFilter = this.getNodeParameter("statusFilter") as string;
    const priorityFilter = this.getNodeParameter("priorityFilter") as string;

    // Track the last poll time via workflow static data
    const webhookData = this.getWorkflowStaticData("node");
    const lastPollTime = webhookData.lastPollTime as string | undefined;
    webhookData.lastPollTime = new Date().toISOString();

    const statuses =
      statusFilter === "any" ? ["approved", "rejected"] : [statusFilter];

    const results: INodeExecutionData[] = [];

    for (const status of statuses) {
      const qs: Record<string, string> = { status, page_size: "50" };
      if (priorityFilter) qs.priority = priorityFilter;

      const response = (await this.helpers.httpRequestWithAuthentication.call(
        this,
        "gatekeeperApi",
        {
          method: "GET",
          url: `${baseUrl}/api/v1/approvals`,
          json: true,
          qs,
        },
      )) as { data?: ApprovalRecord[] };

      const approvals: ApprovalRecord[] = response.data ?? [];

      for (const approval of approvals) {
        if (
          lastPollTime &&
          approval.decided_at &&
          approval.decided_at > lastPollTime
        ) {
          results.push({ json: approval as Record<string, unknown> });
        } else if (!lastPollTime && approval.decided_at) {
          // First poll: include all decided approvals
          results.push({ json: approval as Record<string, unknown> });
        }
      }
    }

    if (results.length === 0) return null;
    return [results];
  }
}

// ---------------------------------------------------------------------------
// OKRunit TypeScript SDK -- Client
// ---------------------------------------------------------------------------

import type {
  OKRunitConfig,
  CreateApprovalParams,
  Approval,
  PaginatedResponse,
  ListApprovalsParams,
  RespondApprovalParams,
  BatchApprovalParams,
  Comment,
  ApiErrorResponse,
  WaitOptions,
} from "./types";

export class OKRunitError extends Error {
  public readonly statusCode: number;
  public readonly code: string | undefined;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.name = "OKRunitError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class OKRunitClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: OKRunitConfig) {
    if (!config.apiKey) {
      throw new Error("apiKey is required");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? "https://okrunit.com").replace(/\/$/, "");
    this.timeout = config.timeout ?? 30_000;
  }

  // ---- Internal Helpers ---------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | undefined>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/api/v1${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, v);
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "@okrunit/sdk/0.1.0",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({
          error: response.statusText,
        }))) as ApiErrorResponse;
        throw new OKRunitError(
          response.status,
          errorBody.error,
          errorBody.code,
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  // ---- Approvals ----------------------------------------------------------

  async createApproval(params: CreateApprovalParams): Promise<{ data: Approval }> {
    return this.request("POST", "/approvals", params);
  }

  async getApproval(id: string): Promise<{ data: Approval }> {
    return this.request("GET", `/approvals/${id}`);
  }

  async listApprovals(
    params?: ListApprovalsParams,
  ): Promise<PaginatedResponse<Approval>> {
    const query: Record<string, string | undefined> = {};
    if (params?.status) query.status = params.status;
    if (params?.priority) query.priority = params.priority;
    if (params?.search) query.search = params.search;
    if (params?.page) query.page = String(params.page);
    if (params?.page_size) query.page_size = String(params.page_size);
    return this.request("GET", "/approvals", undefined, query);
  }

  async respondToApproval(
    id: string,
    params: RespondApprovalParams,
  ): Promise<{ data: Approval }> {
    return this.request("PATCH", `/approvals/${id}`, params);
  }

  async cancelApproval(id: string): Promise<{ data: Approval }> {
    return this.request("DELETE", `/approvals/${id}`);
  }

  async batchRespond(params: BatchApprovalParams): Promise<{ results: Array<{ id: string; status: string }> }> {
    return this.request("POST", "/approvals/batch", params);
  }

  /**
   * Poll an approval until it reaches a terminal state (approved, rejected,
   * cancelled, expired) or the timeout is exceeded.
   */
  async waitForDecision(
    id: string,
    options?: WaitOptions,
  ): Promise<Approval> {
    const timeout = options?.timeout ?? 300_000; // 5 minutes default
    const interval = options?.poll_interval ?? 2_000; // 2 seconds default
    const deadline = Date.now() + timeout;
    const terminalStatuses = new Set(["approved", "rejected", "cancelled", "expired"]);

    while (Date.now() < deadline) {
      const { data: approval } = await this.getApproval(id);
      if (terminalStatuses.has(approval.status)) {
        return approval;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new OKRunitError(408, "Timed out waiting for approval decision", "TIMEOUT");
  }

  // ---- Comments -----------------------------------------------------------

  async listComments(approvalId: string): Promise<{ data: Comment[] }> {
    return this.request("GET", `/approvals/${approvalId}/comments`);
  }

  async addComment(
    approvalId: string,
    body: string,
  ): Promise<{ data: Comment }> {
    return this.request("POST", `/approvals/${approvalId}/comments`, { body });
  }
}

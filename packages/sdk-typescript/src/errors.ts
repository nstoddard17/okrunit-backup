// ---------------------------------------------------------------------------
// OKRunit SDK -- Error Handling
// ---------------------------------------------------------------------------

export interface OKRunitErrorDetails {
  issues?: Array<{ path: (string | number)[]; message: string }>;
  [key: string]: unknown;
}

/**
 * Error class for OKRunit API errors. Contains the HTTP status code, a
 * machine-readable error code, and optional structured details.
 */
export class OKRunitError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details: OKRunitErrorDetails | null;

  constructor(
    message: string,
    status: number,
    code: string = "UNKNOWN_ERROR",
    details: OKRunitErrorDetails | null = null,
  ) {
    super(message);
    this.name = "OKRunitError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Parse an error response body from the OKRunit API and throw an
 * appropriate OKRunitError.
 */
export async function handleErrorResponse(response: Response): Promise<never> {
  let body: Record<string, unknown>;
  try {
    body = await response.json() as Record<string, unknown>;
  } catch {
    throw new OKRunitError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
    );
  }

  const message =
    typeof body.error === "string"
      ? body.error
      : `HTTP ${response.status}: ${response.statusText}`;

  const code =
    typeof body.code === "string" ? body.code : "UNKNOWN_ERROR";

  const details: OKRunitErrorDetails | null =
    body.issues || body.details
      ? (body as OKRunitErrorDetails)
      : null;

  throw new OKRunitError(message, response.status, code, details);
}

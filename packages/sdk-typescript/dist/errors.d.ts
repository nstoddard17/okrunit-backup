export interface OKRunitErrorDetails {
    issues?: Array<{
        path: (string | number)[];
        message: string;
    }>;
    [key: string]: unknown;
}
/**
 * Error class for OKRunit API errors. Contains the HTTP status code, a
 * machine-readable error code, and optional structured details.
 */
export declare class OKRunitError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details: OKRunitErrorDetails | null;
    constructor(message: string, status: number, code?: string, details?: OKRunitErrorDetails | null);
}
/**
 * Parse an error response body from the OKRunit API and throw an
 * appropriate OKRunitError.
 */
export declare function handleErrorResponse(response: Response): Promise<never>;
//# sourceMappingURL=errors.d.ts.map
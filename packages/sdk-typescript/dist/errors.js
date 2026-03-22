"use strict";
// ---------------------------------------------------------------------------
// OKRunit SDK -- Error Handling
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.OKRunitError = void 0;
exports.handleErrorResponse = handleErrorResponse;
/**
 * Error class for OKRunit API errors. Contains the HTTP status code, a
 * machine-readable error code, and optional structured details.
 */
class OKRunitError extends Error {
    constructor(message, status, code = "UNKNOWN_ERROR", details = null) {
        super(message);
        this.name = "OKRunitError";
        this.status = status;
        this.code = code;
        this.details = details;
    }
}
exports.OKRunitError = OKRunitError;
/**
 * Parse an error response body from the OKRunit API and throw an
 * appropriate OKRunitError.
 */
async function handleErrorResponse(response) {
    let body;
    try {
        body = await response.json();
    }
    catch {
        throw new OKRunitError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }
    const message = typeof body.error === "string"
        ? body.error
        : `HTTP ${response.status}: ${response.statusText}`;
    const code = typeof body.code === "string" ? body.code : "UNKNOWN_ERROR";
    const details = body.issues || body.details
        ? body
        : null;
    throw new OKRunitError(message, response.status, code, details);
}
//# sourceMappingURL=errors.js.map
// ---------------------------------------------------------------------------
// Gatekeeper -- App-Wide Constants
// ---------------------------------------------------------------------------

export const APP_NAME = "Gatekeeper";

/** Prefix prepended to every generated API key. */
export const API_KEY_PREFIX = "gk_";

/** Number of random bytes used to generate an API key (64 hex chars). */
export const API_KEY_LENGTH = 32;

/** Maximum number of retry attempts for callback/webhook delivery. */
export const MAX_CALLBACK_RETRIES = 3;

/** Timeout (ms) for each callback HTTP request. */
export const CALLBACK_TIMEOUT_MS = 10_000;

/** Delay (ms) before each retry attempt (index-aligned with attempt number). */
export const CALLBACK_RETRY_DELAYS = [1_000, 2_000, 4_000] as const;

/** Hours before an email-action token expires. */
export const EMAIL_TOKEN_EXPIRY_HOURS = 72;

/** Days before an organization invite expires. */
export const INVITE_EXPIRY_DAYS = 7;

/** Default number of items per page for paginated endpoints. */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum allowed page size for paginated endpoints. */
export const MAX_PAGE_SIZE = 100;

/** Numeric ordering for approval priorities (used for sorting / comparisons). */
export const PRIORITY_ORDER = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
} as const;

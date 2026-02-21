// ---------------------------------------------------------------------------
// Gatekeeper -- API Authentication (Dual: API Key + Supabase Session)
// ---------------------------------------------------------------------------

import { createHash, randomBytes } from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { API_KEY_LENGTH, API_KEY_PREFIX } from "@/lib/constants";
import { ApiError } from "@/lib/api/errors";
import type { Connection, OrgMembership, UserProfile } from "@/lib/types/database";

// ---- Types ----------------------------------------------------------------

export type AuthResult =
  | {
      type: "api_key";
      connection: Connection;
      orgId: string;
    }
  | {
      type: "session";
      user: { id: string; email: string };
      profile: UserProfile;
      membership: OrgMembership;
      orgId: string;
    };

// ---- Key Utilities --------------------------------------------------------

/**
 * Produce a hex-encoded SHA-256 hash of a plaintext API key.
 * Used both when storing keys and when verifying incoming requests.
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Generate a fresh API key.
 *
 * @returns An object containing:
 *  - `plaintext` - the full key to hand to the caller (`gk_<64 hex chars>`)
 *  - `hash`      - SHA-256 hex digest (stored in the database)
 *  - `prefix`    - first 8 characters after `gk_` (stored for display)
 */
export function generateApiKey(): {
  plaintext: string;
  hash: string;
  prefix: string;
} {
  const raw = randomBytes(API_KEY_LENGTH).toString("hex");
  const plaintext = `${API_KEY_PREFIX}${raw}`;
  const hash = hashApiKey(plaintext);
  const prefix = raw.slice(0, 8);

  return { plaintext, hash, prefix };
}

// ---- Request Authentication -----------------------------------------------

/**
 * Authenticate an incoming API request.
 *
 * 1. If the `Authorization` header carries a Bearer token, treat it as an API
 *    key: hash it, look it up in the `connections` table, verify the
 *    connection is active, and update `last_used_at`.
 * 2. Otherwise fall back to Supabase cookie-based session authentication:
 *    call `getUser()`, then look up the corresponding `user_profiles` row.
 * 3. If neither method succeeds, throw a 401 `ApiError`.
 */
export async function authenticateRequest(
  request: Request,
): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");

  // --- API Key authentication ------------------------------------------------
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);

    if (token.startsWith(API_KEY_PREFIX)) {
      return authenticateApiKey(token);
    }
  }

  // --- Supabase session authentication ---------------------------------------
  return authenticateSession();
}

// ---- Internal Helpers -----------------------------------------------------

async function authenticateApiKey(token: string): Promise<AuthResult> {
  const keyHash = hashApiKey(token);
  const admin = createAdminClient();

  // --- Primary key lookup ---------------------------------------------------
  const { data: connection, error } = await admin
    .from("connections")
    .select("*")
    .eq("api_key_hash", keyHash)
    .single();

  if (connection && !error) {
    if (!connection.is_active) {
      throw new ApiError(403, "API key is inactive", "INACTIVE_API_KEY");
    }

    // Fire-and-forget: update last_used_at so we don't block the request.
    admin
      .from("connections")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", connection.id)
      .then();

    return {
      type: "api_key",
      connection: connection as Connection,
      orgId: connection.org_id,
    };
  }

  // --- Fallback: check previous (rotated) key during grace period -----------
  const { data: rotatedConnection, error: rotatedError } = await admin
    .from("connections")
    .select("*")
    .eq("previous_key_hash", keyHash)
    .gt("previous_key_expires_at", new Date().toISOString())
    .single();

  if (rotatedConnection && !rotatedError) {
    if (!rotatedConnection.is_active) {
      throw new ApiError(403, "API key is inactive", "INACTIVE_API_KEY");
    }

    // Fire-and-forget: update last_used_at.
    admin
      .from("connections")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", rotatedConnection.id)
      .then();

    // Mark the result so callers / middleware can add a deprecation header.
    const result: AuthResult = {
      type: "api_key",
      connection: rotatedConnection as Connection,
      orgId: rotatedConnection.org_id,
    };

    // Attach a non-enumerable flag for downstream use (e.g. response header).
    Object.defineProperty(result, "_deprecatedKey", {
      value: true,
      enumerable: false,
    });

    return result;
  }

  throw new ApiError(401, "Invalid API key", "INVALID_API_KEY");
}

async function authenticateSession(): Promise<AuthResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new ApiError(401, "Authentication required", "UNAUTHENTICATED");
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new ApiError(
      401,
      "User profile not found",
      "PROFILE_NOT_FOUND",
    );
  }

  // Get active org membership (is_default = true)
  const { data: membership, error: membershipError } = await admin
    .from("org_memberships")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .single();

  if (membershipError || !membership) {
    throw new ApiError(
      401,
      "No organization membership found",
      "NO_MEMBERSHIP",
    );
  }

  return {
    type: "session",
    user: { id: user.id, email: user.email! },
    profile: profile as UserProfile,
    membership: membership as OrgMembership,
    orgId: membership.org_id,
  };
}

// ---------------------------------------------------------------------------
// OKrunit -- MFA (TOTP) Utilities
// ---------------------------------------------------------------------------

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if the current session requires MFA verification.
 * Returns { required: true, factorId } when the user has enrolled TOTP
 * but the session is still at AAL1.
 */
export async function checkMfaRequired(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error || !data) {
    return { required: false, factorId: undefined };
  }

  if (data.currentLevel === "aal1" && data.nextLevel === "aal2") {
    // User has MFA enrolled but hasn't verified this session
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totpFactor = factors?.totp?.find((f) => f.status === "verified");
    return { required: true, factorId: totpFactor?.id };
  }

  return { required: false, factorId: undefined };
}

/**
 * Challenge + verify a TOTP code in one step.
 */
export async function verifyMfaCode(
  supabase: SupabaseClient,
  factorId: string,
  code: string,
): Promise<{ error?: string }> {
  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });

  if (challengeError) {
    return { error: challengeError.message };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });

  if (verifyError) {
    return { error: verifyError.message };
  }

  return {};
}

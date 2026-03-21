// ---------------------------------------------------------------------------
// OKRunit -- Audit Logging
// ---------------------------------------------------------------------------

import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditEventParams {
  orgId: string;
  userId?: string;
  connectionId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Insert a row into the `audit_log` table.
 *
 * Uses the Supabase admin (service-role) client so the write always succeeds
 * regardless of RLS policies. Errors are logged but never thrown -- audit
 * logging must never break a request.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin.from("audit_log").insert({
    org_id: params.orgId,
    user_id: params.userId ?? null,
    connection_id: params.connectionId ?? null,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId ?? null,
    details: params.details ?? null,
    ip_address: params.ipAddress ?? null,
  });

  if (error) {
    console.error("[Audit] Failed to write audit log entry:", error);
  }
}

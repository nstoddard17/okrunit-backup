"use client";

// ---------------------------------------------------------------------------
// OKrunit -- Approval-Specific Realtime Hook
// ---------------------------------------------------------------------------

import { useState, useCallback } from "react";
import { useRealtime } from "@/hooks/use-realtime";
import type { ApprovalRequest } from "@/lib/types/database";

interface UseApprovalsOptions {
  initialApprovals: ApprovalRequest[];
  orgId: string;
}

/**
 * Manages a live list of `ApprovalRequest` rows for a given organisation.
 *
 * Accepts server-fetched `initialApprovals` and keeps them in sync via
 * Supabase Realtime -- new requests are prepended, updates are merged
 * in-place, and deletions are removed from the array.
 */
export function useApprovals({ initialApprovals, orgId }: UseApprovalsOptions) {
  const [approvals, setApprovals] =
    useState<ApprovalRequest[]>(initialApprovals);

  const handleInsert = useCallback((newApproval: ApprovalRequest) => {
    setApprovals((prev) => [newApproval, ...prev]);
  }, []);

  const handleUpdate = useCallback((updatedApproval: ApprovalRequest) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === updatedApproval.id ? updatedApproval : a)),
    );
  }, []);

  const handleDelete = useCallback((deletedApproval: ApprovalRequest) => {
    setApprovals((prev) => prev.filter((a) => a.id !== deletedApproval.id));
  }, []);

  useRealtime<ApprovalRequest>({
    table: "approval_requests",
    filter: `org_id=eq.${orgId}`,
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
  });

  return { approvals, setApprovals };
}

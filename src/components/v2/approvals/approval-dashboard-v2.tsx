"use client";

import { useState, useCallback, useEffect } from "react";
import { ApprovalFiltersV2 } from "@/components/v2/approvals/approval-filters-v2";
import { ApprovalListV2 } from "@/components/v2/approvals/approval-list-v2";
import { ApprovalDetailV2 } from "@/components/v2/approvals/approval-detail-v2";
import { useApprovalFiltersStore } from "@/stores/approval-filters-store";
import { useRealtime } from "@/hooks/use-realtime";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { ApprovalRequest, Connection } from "@/lib/types/database";

interface ApprovalDashboardV2Props {
  initialApprovals: ApprovalRequest[];
  connections: Connection[];
  canApprove?: boolean;
  orgId: string;
}

export function ApprovalDashboardV2({
  initialApprovals,
  connections,
  canApprove = true,
  orgId,
}: ApprovalDashboardV2Props) {
  const [approvals, setApprovals] =
    useState<ApprovalRequest[]>(initialApprovals);
  const [selectedApproval, setSelectedApproval] =
    useState<ApprovalRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [skipConfirmation, setSkipConfirmation] = useState(false);

  const { status, priority, search, setStatus, setPriority, setSearch } =
    useApprovalFiltersStore();

  // Load skip_confirmation preference from notification_settings
  useEffect(() => {
    const loadPreference = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notification_settings")
        .select("skip_approval_confirmation")
        .eq("user_id", user.id)
        .single();

      if (data?.skip_approval_confirmation) {
        setSkipConfirmation(true);
      }
    };
    loadPreference();
  }, []);

  // Realtime: listen for new and updated approval requests
  useRealtime<ApprovalRequest>({
    table: "approval_requests",
    filter: `org_id=eq.${orgId}`,
    onInsert: useCallback((record: ApprovalRequest) => {
      setApprovals((prev) => {
        // Don't add duplicates
        if (prev.some((a) => a.id === record.id)) return prev;
        return [record, ...prev];
      });
      toast.info("New approval request received");
    }, []),
    onUpdate: useCallback((record: ApprovalRequest) => {
      setApprovals((prev) =>
        prev.map((a) => (a.id === record.id ? record : a))
      );
      // Also update selected if it's the same one
      setSelectedApproval((prev) =>
        prev?.id === record.id ? record : prev
      );
    }, []),
    onDelete: useCallback((oldRecord: ApprovalRequest) => {
      setApprovals((prev) => prev.filter((a) => a.id !== oldRecord.id));
    }, []),
  });

  // Summary stats
  const pendingCount = approvals.filter((a) => a.status === "pending").length;
  const approvedCount = approvals.filter((a) => a.status === "approved").length;
  const rejectedCount = approvals.filter((a) => a.status === "rejected").length;

  const fetchApprovals = useCallback(
    async (filters: {
      status?: string;
      priority?: string;
      search?: string;
      connectionId?: string;
    }) => {
      setIsFetching(true);
      try {
        const supabase = createClient();
        let query = supabase
          .from("approval_requests")
          .select("*")
          .order("status", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(50);

        if (filters.status) query = query.eq("status", filters.status);
        if (filters.priority) query = query.eq("priority", filters.priority);
        if (filters.search) query = query.ilike("title", `%${filters.search}%`);
        if (filters.connectionId) query = query.eq("connection_id", filters.connectionId);

        const { data, error } = await query;
        if (error) { toast.error("Failed to fetch approvals"); return; }
        setApprovals(data ?? []);
      } catch {
        toast.error("Failed to fetch approvals");
      } finally {
        setIsFetching(false);
      }
    },
    []
  );

  const handleFilterChange = useCallback(
    (filters: {
      status?: string;
      priority?: string;
      search?: string;
      connectionId?: string;
    }) => {
      setStatus(filters.status);
      setPriority(filters.priority);
      setSearch(filters.search ?? "");
      fetchApprovals(filters);
    },
    [fetchApprovals, setStatus, setPriority, setSearch]
  );

  const handleSelect = useCallback((approval: ApprovalRequest) => {
    setSelectedApproval(approval);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedApproval(null);
  }, []);

  const submitDecision = useCallback(
    async (
      approvalId: string,
      decision: "approved" | "rejected",
      comment?: string,
    ) => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/approvals/${approvalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: decision === "approved" ? "approve" : "reject",
            comment: comment || undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error ?? `Request failed with status ${response.status}`
          );
        }

        const updatedApproval = await response.json();

        setApprovals((prev) =>
          prev.map((a) =>
            a.id === approvalId ? { ...a, ...updatedApproval } : a
          )
        );

        setSelectedApproval((prev) =>
          prev?.id === approvalId ? { ...prev, ...updatedApproval } : prev
        );

        toast.success(
          decision === "approved"
            ? "Request approved successfully"
            : "Request rejected"
        );

        handleCloseDetail();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to submit decision"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [handleCloseDetail]
  );

  const handleRespond = useCallback(
    async (
      approvalId: string,
      decision: "approved" | "rejected",
      comment: string
    ) => {
      await submitDecision(approvalId, decision, comment);
    },
    [submitDecision]
  );

  const handleInlineAction = useCallback(
    async (approvalId: string, decision: "approved" | "rejected") => {
      await submitDecision(approvalId, decision);
    },
    [submitDecision]
  );

  const handleSkipConfirmationChange = useCallback(async (skip: boolean) => {
    setSkipConfirmation(skip);
    // Persist to database
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notification_settings")
      .upsert({
        user_id: user.id,
        skip_approval_confirmation: skip,
      }, { onConflict: "user_id" });
  }, []);

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wider text-amber-600">Pending</p>
            <span className="text-[10px] text-amber-400">Last 24h</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-amber-700">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-600">Approved</p>
            <span className="text-[10px] text-emerald-400">Last 24h</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-emerald-700">{approvedCount}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wider text-red-600">Rejected</p>
            <span className="text-[10px] text-red-400">Last 24h</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-red-700">{rejectedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <ApprovalFiltersV2
        onFilterChange={handleFilterChange}
        connections={connections}
        currentFilters={{ status, priority, search }}
      />

      {/* Approval list */}
      <div className={isFetching ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}>
        <ApprovalListV2
          approvals={approvals}
          connections={connections}
          onSelect={handleSelect}
          canApprove={canApprove}
          isLoading={isLoading}
          skipConfirmation={skipConfirmation}
          onInlineAction={handleInlineAction}
          onSkipConfirmationChange={handleSkipConfirmationChange}
        />
      </div>

      {/* Detail slide-in panel */}
      <ApprovalDetailV2
        approval={selectedApproval}
        open={detailOpen}
        onClose={handleCloseDetail}
        onRespond={handleRespond}
        isLoading={isLoading}
        canApprove={canApprove}
      />
    </div>
  );
}

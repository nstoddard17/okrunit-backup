"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ApprovalFilters } from "@/components/approvals/approval-filters";
import { ApprovalList } from "@/components/approvals/approval-list";
import { ApprovalListGrouped } from "@/components/approvals/approval-list-grouped";
import { ApprovalListMasterDetail } from "@/components/approvals/approval-list-master-detail";
import { ApprovalDetail } from "@/components/approvals/approval-detail";
import { LayoutToggle } from "@/components/approvals/layout-toggle";
import { StatCard } from "@/components/ui/stat-card";
import { useApprovalFiltersStore } from "@/stores/approval-filters-store";
import { useRealtime } from "@/hooks/use-realtime";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApprovalRequest, Connection, DashboardLayout } from "@/lib/types/database";

interface ApprovalDashboardProps {
  initialApprovals: ApprovalRequest[];
  connections: Connection[];
  canApprove?: boolean;
  orgId: string;
}

export function ApprovalDashboard({
  initialApprovals,
  connections,
  canApprove = true,
  orgId,
}: ApprovalDashboardProps) {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(initialApprovals);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [skipConfirmation, setSkipConfirmation] = useState(false);
  const [layout, setLayout] = useState<DashboardLayout>("cards");
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const newIdTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const { status, priority, search, source, setStatus, setPriority, setSearch, setSource } =
    useApprovalFiltersStore();

  // Load preferences from notification_settings
  useEffect(() => {
    const loadPreferences = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notification_settings")
        .select("skip_approval_confirmation, dashboard_layout")
        .eq("user_id", user.id)
        .single();

      if (data?.skip_approval_confirmation) {
        setSkipConfirmation(true);
      }
      if (data?.dashboard_layout) {
        setLayout(data.dashboard_layout as DashboardLayout);
      }
    };
    loadPreferences();
  }, []);

  // Persist layout preference
  const handleLayoutChange = useCallback(async (newLayout: DashboardLayout) => {
    setLayout(newLayout);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notification_settings")
      .upsert({
        user_id: user.id,
        dashboard_layout: newLayout,
      }, { onConflict: "user_id" });
  }, []);

  // Track new IDs with auto-clear
  const markAsNew = useCallback((id: string) => {
    setNewIds((prev) => new Set(prev).add(id));
    // Clear existing timer if any
    const existing = newIdTimers.current.get(id);
    if (existing) clearTimeout(existing);
    // Auto-clear after 2.5s
    const timer = setTimeout(() => {
      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      newIdTimers.current.delete(id);
    }, 2500);
    newIdTimers.current.set(id, timer);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      newIdTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Realtime: listen for new and updated approval requests
  useRealtime<ApprovalRequest>({
    table: "approval_requests",
    filter: `org_id=eq.${orgId}`,
    onInsert: useCallback((record: ApprovalRequest) => {
      setApprovals((prev) => {
        if (prev.some((a) => a.id === record.id)) return prev;
        return [record, ...prev];
      });
      markAsNew(record.id);
      toast.info("New approval request received");
    }, [markAsNew]),
    onUpdate: useCallback((record: ApprovalRequest) => {
      setApprovals((prev) =>
        prev.map((a) => (a.id === record.id ? record : a))
      );
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
      source?: string;
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
        if (filters.source) query = query.eq("source", filters.source);

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
      source?: string;
    }) => {
      setStatus(filters.status);
      setPriority(filters.priority);
      setSearch(filters.search ?? "");
      setSource(filters.source);
      fetchApprovals(filters);
    },
    [fetchApprovals, setStatus, setPriority, setSearch, setSource]
  );

  const handleRefresh = useCallback(() => {
    fetchApprovals({ status, priority, search, source });
  }, [fetchApprovals, status, priority, search, source]);

  // Stat card click-to-filter
  const handleStatClick = useCallback((filterStatus: string | undefined) => {
    handleFilterChange({ status: filterStatus, priority, search, source });
  }, [handleFilterChange, priority, search, source]);

  const handleSelect = useCallback((approval: ApprovalRequest) => {
    setSelectedApproval(approval);
    if (layout !== "split") {
      setDetailOpen(true);
    }
  }, [layout]);

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

        if (layout !== "split") {
          handleCloseDetail();
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to submit decision"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [handleCloseDetail, layout]
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

  const sharedListProps = {
    approvals,
    connections,
    onSelect: handleSelect,
    canApprove,
    isLoading,
    skipConfirmation,
    onInlineAction: handleInlineAction,
    onSkipConfirmationChange: handleSkipConfirmationChange,
    newIds,
  };

  return (
    <div className="space-y-6">
      {/* Header row: live indicator + refresh + layout toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="h-7 gap-1.5 text-xs text-muted-foreground"
          >
            <RefreshCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <LayoutToggle layout={layout} onChange={handleLayoutChange} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={Clock}
          iconColor="text-amber-500"
          subtitle="Awaiting decision"
          onClick={() => handleStatClick(status === "pending" ? undefined : "pending")}
          className={status === "pending" ? "ring-2 ring-amber-400/50" : ""}
        />
        <StatCard
          title="Approved"
          value={approvedCount}
          icon={CheckCircle}
          iconColor="text-emerald-500"
          subtitle="Recently approved"
          onClick={() => handleStatClick(status === "approved" ? undefined : "approved")}
          className={status === "approved" ? "ring-2 ring-emerald-400/50" : ""}
        />
        <StatCard
          title="Rejected"
          value={rejectedCount}
          icon={XCircle}
          iconColor="text-red-500"
          subtitle="Recently rejected"
          onClick={() => handleStatClick(status === "rejected" ? undefined : "rejected")}
          className={status === "rejected" ? "ring-2 ring-red-400/50" : ""}
        />
      </div>

      {/* Filters */}
      <ApprovalFilters
        onFilterChange={handleFilterChange}
        connections={connections}
        currentFilters={{ status, priority, search, source }}
      />

      {/* Approval list — conditional by layout */}
      <div className={isFetching ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}>
        {layout === "cards" && <ApprovalList {...sharedListProps} />}
        {layout === "grouped" && <ApprovalListGrouped {...sharedListProps} />}
        {layout === "split" && (
          <ApprovalListMasterDetail
            {...sharedListProps}
            onRespond={handleRespond}
          />
        )}
      </div>

      {/* Detail slide-in panel (Cards & Grouped only) */}
      {layout !== "split" && (
        <ApprovalDetail
          approval={selectedApproval}
          open={detailOpen}
          onClose={handleCloseDetail}
          onRespond={handleRespond}
          isLoading={isLoading}
          canApprove={canApprove}
        />
      )}
    </div>
  );
}

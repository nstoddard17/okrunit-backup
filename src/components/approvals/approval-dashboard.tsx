"use client";

import { useState, useCallback } from "react";
import { ApprovalFilters } from "@/components/approvals/approval-filters";
import { ApprovalList } from "@/components/approvals/approval-list";
import { ApprovalDetail } from "@/components/approvals/approval-detail";
import { useApprovalFiltersStore } from "@/stores/approval-filters-store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { ApprovalRequest, Connection } from "@/lib/types/database";

interface ApprovalDashboardProps {
  initialApprovals: ApprovalRequest[];
  connections: Connection[];
}

export function ApprovalDashboard({
  initialApprovals,
  connections,
}: ApprovalDashboardProps) {
  const [approvals, setApprovals] =
    useState<ApprovalRequest[]>(initialApprovals);
  const [selectedApproval, setSelectedApproval] =
    useState<ApprovalRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const { status, priority, search, setStatus, setPriority, setSearch } =
    useApprovalFiltersStore();

  const fetchApprovals = useCallback(
    async (filters: {
      status?: string;
      priority?: string;
      search?: string;
      connectionId?: string;
    }) => {
      setIsFetching(true);
      try {
        const params = new URLSearchParams();
        if (filters.status) params.set("status", filters.status);
        if (filters.priority) params.set("priority", filters.priority);
        if (filters.search) params.set("search", filters.search);
        if (filters.connectionId)
          params.set("connection_id", filters.connectionId);

        const supabase = createClient();
        let query = supabase
          .from("approval_requests")
          .select("*")
          .order("status", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(50);

        if (filters.status) {
          query = query.eq("status", filters.status);
        }
        if (filters.priority) {
          query = query.eq("priority", filters.priority);
        }
        if (filters.search) {
          query = query.ilike("title", `%${filters.search}%`);
        }
        if (filters.connectionId) {
          query = query.eq("connection_id", filters.connectionId);
        }

        const { data, error } = await query;

        if (error) {
          toast.error("Failed to fetch approvals");
          return;
        }

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

  const handleRespond = useCallback(
    async (
      approvalId: string,
      decision: "approved" | "rejected",
      comment: string
    ) => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/approvals/${approvalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: decision,
            decision_comment: comment || undefined,
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

        setSelectedApproval(
          updatedApproval.id ? { ...selectedApproval!, ...updatedApproval } : null
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
    [selectedApproval, handleCloseDetail]
  );

  return (
    <div className="space-y-6">
      <ApprovalFilters
        onFilterChange={handleFilterChange}
        connections={connections}
        currentFilters={{ status, priority, search }}
      />

      <div className={isFetching ? "pointer-events-none opacity-60" : ""}>
        <ApprovalList
          approvals={approvals}
          connections={connections}
          onSelect={handleSelect}
        />
      </div>

      <ApprovalDetail
        approval={selectedApproval}
        open={detailOpen}
        onClose={handleCloseDetail}
        onRespond={handleRespond}
        isLoading={isLoading}
      />
    </div>
  );
}

"use client";

// ---------------------------------------------------------------------------
// OKRunit -- Webhook Delivery Log Filters (Client Component)
// Filter controls for narrowing down delivery log entries by status,
// connection, and (eventually) date range.
// ---------------------------------------------------------------------------

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Connection } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_VALUE = "__all__";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeliveryLogFilters {
  status: "all" | "success" | "failure";
  connectionId: string | null;
}

interface DeliveryLogFiltersProps {
  connections: Connection[];
  onFilterChange: (filters: DeliveryLogFilters) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DeliveryLogFilters({
  connections,
  onFilterChange,
}: DeliveryLogFiltersProps) {
  const [status, setStatus] = useState<string>(ALL_VALUE);
  const [connectionId, setConnectionId] = useState<string>(ALL_VALUE);

  const emitChange = useCallback(
    (nextStatus: string, nextConnectionId: string) => {
      onFilterChange({
        status:
          nextStatus === ALL_VALUE
            ? "all"
            : (nextStatus as "success" | "failure"),
        connectionId:
          nextConnectionId === ALL_VALUE ? null : nextConnectionId,
      });
    },
    [onFilterChange]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      setStatus(value);
      emitChange(value, connectionId);
    },
    [connectionId, emitChange]
  );

  const handleConnectionChange = useCallback(
    (value: string) => {
      setConnectionId(value);
      emitChange(status, value);
    },
    [status, emitChange]
  );

  const clearFilters = useCallback(() => {
    setStatus(ALL_VALUE);
    setConnectionId(ALL_VALUE);
    onFilterChange({ status: "all", connectionId: null });
  }, [onFilterChange]);

  const hasActiveFilters =
    status !== ALL_VALUE || connectionId !== ALL_VALUE;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Status filter */}
      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
          <SelectItem value="success">Success</SelectItem>
          <SelectItem value="failure">Failed</SelectItem>
        </SelectContent>
      </Select>

      {/* Connection filter */}
      <Select value={connectionId} onValueChange={handleConnectionChange}>
        <SelectTrigger className="w-full sm:w-[220px]">
          <SelectValue placeholder="All connections" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All connections</SelectItem>
          {connections.map((conn) => (
            <SelectItem key={conn.id} value={conn.id}>
              {conn.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range placeholder */}
      <Button variant="outline" size="sm" disabled className="w-full sm:w-auto">
        Date range (coming soon)
      </Button>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}

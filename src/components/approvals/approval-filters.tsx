"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import type { Connection } from "@/lib/types/database";

interface ApprovalFiltersProps {
  onFilterChange: (filters: {
    status?: string;
    priority?: string;
    search?: string;
    connectionId?: string;
  }) => void;
  connections: Connection[];
  currentFilters: {
    status?: string;
    priority?: string;
    search?: string;
    connectionId?: string;
  };
}

export function ApprovalFilters({
  onFilterChange,
  connections,
  currentFilters,
}: ApprovalFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search approvals..."
          value={currentFilters.search ?? ""}
          onChange={(e) =>
            onFilterChange({ ...currentFilters, search: e.target.value })
          }
          className="pl-9"
        />
      </div>

      <Select
        value={currentFilters.status ?? "all"}
        onValueChange={(value) =>
          onFilterChange({
            ...currentFilters,
            status: value === "all" ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={currentFilters.priority ?? "all"}
        onValueChange={(value) =>
          onFilterChange({
            ...currentFilters,
            priority: value === "all" ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={currentFilters.connectionId ?? "all"}
        onValueChange={(value) =>
          onFilterChange({
            ...currentFilters,
            connectionId: value === "all" ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Connection" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Connections</SelectItem>
          {connections.map((connection) => (
            <SelectItem key={connection.id} value={connection.id}>
              {connection.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(currentFilters.status ||
        currentFilters.priority ||
        currentFilters.search ||
        currentFilters.connectionId) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onFilterChange({
              status: undefined,
              priority: undefined,
              search: undefined,
              connectionId: undefined,
            })
          }
          className="gap-1"
        >
          <X className="size-3" />
          Clear
        </Button>
      )}
    </div>
  );
}

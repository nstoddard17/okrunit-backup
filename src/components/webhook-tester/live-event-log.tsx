"use client";

// ---------------------------------------------------------------------------
// Gatekeeper -- Live Event Log Tab
// Real-time stream of all audit log activity across the org, with expandable
// detail rows. Uses Supabase Realtime to prepend new entries as they arrive.
// ---------------------------------------------------------------------------

import { Fragment, useCallback, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";

import { useRealtime } from "@/hooks/use-realtime";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditLogEntry } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_VALUE = "__all__";
const TRUNCATE_LENGTH = 500;

/** Known action categories for the filter dropdown. */
const ACTION_CATEGORIES = [
  { value: ALL_VALUE, label: "All events" },
  { value: "approval", label: "Approvals" },
  { value: "comment", label: "Comments" },
  { value: "connection", label: "Connections" },
  { value: "rule", label: "Rules" },
  { value: "oauth", label: "OAuth" },
  { value: "anomaly", label: "Anomalies" },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function actionBadgeVariant(
  action: string,
): "default" | "secondary" | "destructive" | "outline" {
  const lower = action.toLowerCase();
  if (
    lower.includes("delete") ||
    lower.includes("revoke") ||
    lower.includes("emergency") ||
    lower.includes("anomaly") ||
    lower.includes("reject") ||
    lower.includes("cancelled")
  ) {
    return "destructive";
  }
  if (lower.includes("create") || lower.includes("approve")) {
    return "default";
  }
  if (lower.includes("update") || lower.includes("rotate")) {
    return "secondary";
  }
  return "outline";
}

function formatJson(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function TruncatedText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > TRUNCATE_LENGTH;

  if (!needsTruncation) {
    return <span className="whitespace-pre-wrap break-all">{text}</span>;
  }

  return (
    <span className="whitespace-pre-wrap break-all">
      {expanded ? text : text.slice(0, TRUNCATE_LENGTH) + "..."}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-primary ml-1 text-xs font-medium hover:underline"
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface LiveEventLogProps {
  orgId: string;
  initialAuditEntries: AuditLogEntry[];
}

export function LiveEventLog({
  orgId,
  initialAuditEntries,
}: LiveEventLogProps) {
  const [entries, setEntries] =
    useState<AuditLogEntry[]>(initialAuditEntries);
  const [actionFilter, setActionFilter] = useState<string>(ALL_VALUE);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Realtime: audit_log
  const handleInsert = useCallback((entry: AuditLogEntry) => {
    setEntries((prev) => [entry, ...prev]);
  }, []);

  useRealtime<AuditLogEntry>({
    table: "audit_log",
    filter: `org_id=eq.${orgId}`,
    event: "INSERT",
    onInsert: handleInsert,
  });

  // Filtered entries
  const filteredEntries = useMemo(() => {
    if (actionFilter === ALL_VALUE) return entries;
    return entries.filter((e) => e.action.startsWith(actionFilter + "."));
  }, [entries, actionFilter]);

  // Toggle expand
  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-4 pt-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground ml-auto text-sm">
          {filteredEntries.length} of {entries.length} events
        </span>
      </div>

      {/* Events Table */}
      {filteredEntries.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center rounded-xl border py-16 text-center">
          <p className="text-sm">No events recorded yet.</p>
          <p className="mt-1 text-xs">
            API activity will appear here in real time as it happens.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => {
                const isExpanded = expandedRows.has(entry.id);

                return (
                  <Fragment key={entry.id}>
                    <TableRow className="group">
                      {/* Expand toggle */}
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => toggleRow(entry.id)}
                          className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
                          aria-label={
                            isExpanded
                              ? "Collapse details"
                              : "Expand details"
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </button>
                      </TableCell>

                      {/* Timestamp */}
                      <TableCell
                        className="text-muted-foreground whitespace-nowrap text-xs"
                        title={new Date(entry.created_at).toLocaleString()}
                      >
                        {formatDistanceToNow(new Date(entry.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>

                      {/* Action */}
                      <TableCell>
                        <Badge variant={actionBadgeVariant(entry.action)}>
                          {entry.action}
                        </Badge>
                      </TableCell>

                      {/* Resource */}
                      <TableCell className="text-muted-foreground text-xs">
                        <span className="font-medium">
                          {entry.resource_type}
                        </span>
                        {entry.resource_id && (
                          <span className="ml-1 font-mono">
                            {entry.resource_id.slice(0, 8)}...
                          </span>
                        )}
                      </TableCell>

                      {/* IP Address */}
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {entry.ip_address ?? "-"}
                      </TableCell>
                    </TableRow>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <TableRow key={`details-${entry.id}`}>
                        <TableCell colSpan={5} className="bg-muted/30 p-0">
                          <div className="space-y-4 px-6 py-4">
                            {/* Details JSON */}
                            {entry.details && (
                              <div>
                                <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wider">
                                  Details
                                </p>
                                <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-xs">
                                  <TruncatedText
                                    text={formatJson(entry.details)}
                                  />
                                </pre>
                              </div>
                            )}

                            {/* Metadata row */}
                            <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
                              <span>
                                <span className="font-medium">Entry ID:</span>{" "}
                                <span className="font-mono">{entry.id}</span>
                              </span>
                              {entry.user_id && (
                                <span>
                                  <span className="font-medium">
                                    User ID:
                                  </span>{" "}
                                  <span className="font-mono">
                                    {entry.user_id.slice(0, 8)}...
                                  </span>
                                </span>
                              )}
                              {entry.connection_id && (
                                <span>
                                  <span className="font-medium">
                                    Connection ID:
                                  </span>{" "}
                                  <span className="font-mono">
                                    {entry.connection_id.slice(0, 8)}...
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

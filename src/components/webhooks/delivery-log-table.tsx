"use client";

// ---------------------------------------------------------------------------
// Gatekeeper -- Webhook Delivery Log Table (Client Component)
// Paginated, filterable table with expandable rows showing full request/
// response details for each webhook delivery attempt.
// ---------------------------------------------------------------------------

import {
  Fragment,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { WebhookDeliveryLog, Connection } from "@/lib/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DeliveryLogFilters,
  type DeliveryLogFilters as Filters,
} from "@/components/webhooks/delivery-log-filters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50;
const TRUNCATE_LENGTH = 500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a connection id -> name lookup map. */
function buildConnectionMap(connections: Connection[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const conn of connections) {
    map.set(conn.id, conn.name);
  }
  return map;
}

/** Safely format a JSON value for display. */
function formatJson(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

// ---------------------------------------------------------------------------
// Truncated Text Component
// ---------------------------------------------------------------------------

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
// Detail Section Component
// ---------------------------------------------------------------------------

function DetailSection({
  label,
  content,
}: {
  label: string;
  content: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wider">
        {label}
      </p>
      <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-xs">
        <TruncatedText text={content} />
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DeliveryLogTableProps {
  initialEntries: WebhookDeliveryLog[];
  connections: Connection[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DeliveryLogTable({
  initialEntries,
  connections,
}: DeliveryLogTableProps) {
  const [entries, setEntries] =
    useState<WebhookDeliveryLog[]>(initialEntries);
  const [hasMore, setHasMore] = useState(
    initialEntries.length >= PAGE_SIZE
  );
  const [isPending, startTransition] = useTransition();

  // Filters
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    connectionId: null,
  });

  // Expanded rows (track by entry id)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Connection lookup map.
  const connectionMap = useMemo(
    () => buildConnectionMap(connections),
    [connections]
  );

  // Apply client-side filters.
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filters.status !== "all") {
        const wantSuccess = filters.status === "success";
        if (entry.success !== wantSuccess) return false;
      }
      if (
        filters.connectionId !== null &&
        entry.connection_id !== filters.connectionId
      ) {
        return false;
      }
      return true;
    });
  }, [entries, filters]);

  // Toggle row expansion.
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

  // Handle filter changes.
  const handleFilterChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  // Load more entries from Supabase.
  const loadMore = useCallback(() => {
    startTransition(async () => {
      const supabase = createClient();
      const lastEntry = entries[entries.length - 1];
      if (!lastEntry) return;

      const { data } = await supabase
        .from("webhook_delivery_log")
        .select("*")
        .lt("created_at", lastEntry.created_at)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE)
        .returns<WebhookDeliveryLog[]>();

      if (data) {
        setEntries((prev) => [...prev, ...data]);
        if (data.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    });
  }, [entries]);

  return (
    <div className="space-y-4">
      {/* ---- Filters ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DeliveryLogFilters
          connections={connections}
          onFilterChange={handleFilterChange}
        />
        <span className="text-muted-foreground shrink-0 text-sm">
          {filteredEntries.length} of {entries.length} deliveries
        </span>
      </div>

      {/* ---- Table ---- */}
      {filteredEntries.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center rounded-xl border py-16 text-center">
          <p className="text-sm">No webhook deliveries found.</p>
          {(filters.status !== "all" || filters.connectionId !== null) && (
            <Button
              variant="link"
              size="sm"
              className="mt-1"
              onClick={() =>
                handleFilterChange({ status: "all", connectionId: null })
              }
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Attempt</TableHead>
                <TableHead>Connection</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => {
                const isExpanded = expandedRows.has(entry.id);
                const connName =
                  connectionMap.get(entry.connection_id) ??
                  entry.connection_id.slice(0, 8) + "...";

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

                      {/* Status */}
                      <TableCell>
                        {entry.success ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                      </TableCell>

                      {/* URL */}
                      <TableCell
                        className="text-muted-foreground max-w-[200px] truncate font-mono text-xs"
                        title={entry.url}
                      >
                        {entry.url}
                      </TableCell>

                      {/* Method */}
                      <TableCell className="font-mono text-xs font-medium uppercase">
                        {entry.method}
                      </TableCell>

                      {/* Response Status */}
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {entry.response_status ?? "-"}
                      </TableCell>

                      {/* Duration */}
                      <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                        {entry.duration_ms !== null
                          ? `${entry.duration_ms}ms`
                          : "-"}
                      </TableCell>

                      {/* Attempt */}
                      <TableCell className="text-center text-xs">
                        {entry.attempt_number}
                      </TableCell>

                      {/* Connection */}
                      <TableCell
                        className="text-muted-foreground max-w-[140px] truncate text-xs"
                        title={connName}
                      >
                        {connName}
                      </TableCell>
                    </TableRow>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <TableRow key={`details-${entry.id}`}>
                        <TableCell colSpan={9} className="bg-muted/30 p-0">
                          <div className="space-y-4 px-6 py-4">
                            {/* Error message (if any) */}
                            {entry.error_message && (
                              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
                                <p className="text-xs font-medium text-red-800 dark:text-red-400">
                                  Error
                                </p>
                                <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                                  {entry.error_message}
                                </p>
                              </div>
                            )}

                            <div className="grid gap-4 lg:grid-cols-2">
                              {/* Request Headers */}
                              <DetailSection
                                label="Request Headers"
                                content={formatJson(entry.request_headers)}
                              />

                              {/* Response Headers */}
                              <DetailSection
                                label="Response Headers"
                                content={formatJson(entry.response_headers)}
                              />

                              {/* Request Body */}
                              <DetailSection
                                label="Request Body"
                                content={formatJson(entry.request_body)}
                              />

                              {/* Response Body */}
                              <DetailSection
                                label="Response Body"
                                content={
                                  entry.response_body ?? "No response body"
                                }
                              />
                            </div>

                            {/* Metadata row */}
                            <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
                              <span>
                                <span className="font-medium">Request ID:</span>{" "}
                                <span className="font-mono">
                                  {entry.request_id}
                                </span>
                              </span>
                              <span>
                                <span className="font-medium">
                                  Delivery ID:
                                </span>{" "}
                                <span className="font-mono">{entry.id}</span>
                              </span>
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

      {/* ---- Load More ---- */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

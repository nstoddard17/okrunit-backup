"use client";

// ---------------------------------------------------------------------------
// OKRunit -- Webhook Catcher Tab
// Displays a test URL for capturing webhook requests and shows captured
// requests in real-time with expandable detail rows.
// ---------------------------------------------------------------------------

import { Fragment, useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useRealtime } from "@/hooks/use-realtime";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  WebhookTestEndpoint,
  WebhookTestRequest,
} from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TRUNCATE_LENGTH = 500;

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
// Method badge color
// ---------------------------------------------------------------------------

function methodColor(method: string): string {
  switch (method.toUpperCase()) {
    case "GET":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "POST":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "PUT":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "PATCH":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    case "DELETE":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface WebhookCatcherProps {
  endpoint: WebhookTestEndpoint;
  orgId: string;
  initialRequests: WebhookTestRequest[];
}

export function WebhookCatcher({
  endpoint,
  orgId,
  initialRequests,
}: WebhookCatcherProps) {
  const [currentEndpoint, setCurrentEndpoint] = useState(endpoint);
  const [requests, setRequests] =
    useState<WebhookTestRequest[]>(initialRequests);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [testUrl, setTestUrl] = useState("");

  // Build the full test URL on the client
  useEffect(() => {
    setTestUrl(
      `${window.location.origin}/api/v1/test-webhook/${currentEndpoint.token}`,
    );
  }, [currentEndpoint.token]);

  // Realtime: listen for new captured requests
  const handleInsert = useCallback((newReq: WebhookTestRequest) => {
    setRequests((prev) => [newReq, ...prev]);
  }, []);

  useRealtime<WebhookTestRequest>({
    table: "webhook_test_requests",
    filter: `org_id=eq.${orgId}`,
    event: "INSERT",
    onInsert: handleInsert,
  });

  // Copy URL handler
  const copyUrl = useCallback(async () => {
    await navigator.clipboard.writeText(testUrl);
    setCopied(true);
    toast.success("Test URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [testUrl]);

  // Rotate URL handler
  const rotateUrl = useCallback(async () => {
    const res = await fetch("/api/v1/test-endpoints", { method: "POST" });
    if (res.ok) {
      const newEndpoint = await res.json();
      setCurrentEndpoint(newEndpoint);
      toast.success("Test URL rotated");
    } else {
      toast.error("Failed to rotate URL");
    }
  }, []);

  // Clear requests handler
  const clearRequests = useCallback(async () => {
    const res = await fetch("/api/v1/test-endpoints", { method: "DELETE" });
    if (res.ok) {
      setRequests([]);
      toast.success("Captured requests cleared");
    } else {
      toast.error("Failed to clear requests");
    }
  }, []);

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
      {/* URL Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Test Webhook URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={testUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyUrl}
              title="Copy URL"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Use this URL as the <code>callback_url</code> when creating
            approvals via Zapier, n8n, or Make. All incoming HTTP requests
            will be captured below in real time.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={rotateUrl}>
              <RefreshCw className="mr-2 size-3" /> Rotate URL
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearRequests}
              disabled={requests.length === 0}
            >
              <Trash2 className="mr-2 size-3" /> Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Captured Requests */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Captured Requests</h3>
        <span className="text-muted-foreground text-sm">
          {requests.length} {requests.length === 1 ? "request" : "requests"}
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center rounded-xl border py-16 text-center">
          <p className="text-sm">No requests captured yet.</p>
          <p className="mt-1 text-xs">
            Send a request to the URL above to see it here in real time.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Timestamp</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Content-Type</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => {
                const isExpanded = expandedRows.has(req.id);

                return (
                  <Fragment key={req.id}>
                    <TableRow className="group">
                      {/* Expand toggle */}
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => toggleRow(req.id)}
                          className="cursor-pointer text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
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
                        title={new Date(req.created_at).toLocaleString()}
                      >
                        {formatDistanceToNow(new Date(req.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>

                      {/* Method */}
                      <TableCell>
                        <Badge className={methodColor(req.method)}>
                          {req.method}
                        </Badge>
                      </TableCell>

                      {/* Content-Type */}
                      <TableCell className="text-muted-foreground max-w-[200px] truncate text-xs">
                        {req.content_type ?? "-"}
                      </TableCell>

                      {/* IP Address */}
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {req.ip_address ?? "-"}
                      </TableCell>
                    </TableRow>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <TableRow key={`details-${req.id}`}>
                        <TableCell colSpan={5} className="bg-muted/30 p-0">
                          <div className="space-y-4 px-6 py-4">
                            <div className="grid gap-4 lg:grid-cols-2">
                              {/* Headers */}
                              <DetailSection
                                label="Headers"
                                content={formatJson(req.headers)}
                              />

                              {/* Body */}
                              <DetailSection
                                label="Body"
                                content={
                                  req.body_json
                                    ? formatJson(req.body_json)
                                    : req.body ?? "(empty)"
                                }
                              />
                            </div>

                            {/* Query Params (if any) */}
                            {Object.keys(req.query_params).length > 0 && (
                              <DetailSection
                                label="Query Parameters"
                                content={formatJson(req.query_params)}
                              />
                            )}

                            {/* Metadata row */}
                            <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
                              <span>
                                <span className="font-medium">
                                  Request ID:
                                </span>{" "}
                                <span className="font-mono">{req.id}</span>
                              </span>
                              <span>
                                <span className="font-medium">URL Path:</span>{" "}
                                <span className="font-mono">{req.url}</span>
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
    </div>
  );
}

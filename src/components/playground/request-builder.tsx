"use client";

// ---------------------------------------------------------------------------
// OKRunit -- API Request Builder
// Interactive form for constructing and sending HTTP requests against the
// OKRunit API. Includes pre-built request templates, connection-based
// auth pre-fill, and live code snippet generation.
// ---------------------------------------------------------------------------

import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Play, Plus, Trash2 } from "lucide-react";

import type { Connection } from "@/lib/types/database";
import {
  ResponseViewer,
  type PlaygroundResponse,
} from "@/components/playground/response-viewer";
import { CodeSnippets } from "@/components/playground/code-snippets";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type HttpMethod = "POST" | "GET" | "PATCH" | "DELETE";

interface Header {
  id: string;
  key: string;
  value: string;
}

interface Template {
  label: string;
  method: HttpMethod;
  endpoint: string;
  body: string;
}

const METHODS: HttpMethod[] = ["POST", "GET", "PATCH", "DELETE"];

const COMMON_ENDPOINTS = [
  "/api/v1/approvals",
  "/api/v1/approvals/{id}",
  "/api/v1/approvals/{id}/comments",
  "/api/v1/approvals/batch",
  "/api/v1/connections",
  "/api/v1/connections/{id}",
  "/api/v1/rules",
  "/api/v1/rules/{id}",
  "/api/v1/analytics",
] as const;

const TEMPLATES: Template[] = [
  {
    label: "Create Approval",
    method: "POST",
    endpoint: "/api/v1/approvals",
    body: JSON.stringify(
      {
        title: "Deploy v2.4.0 to production",
        description: "Routine release with bug-fixes and minor UI tweaks.",
        action_type: "deployment",
        priority: "medium",
        metadata: {
          environment: "production",
          version: "2.4.0",
        },
      },
      null,
      2,
    ),
  },
  {
    label: "List Approvals",
    method: "GET",
    endpoint: "/api/v1/approvals",
    body: "",
  },
  {
    label: "Approve Request",
    method: "PATCH",
    endpoint: "/api/v1/approvals/{id}",
    body: JSON.stringify(
      {
        status: "approved",
        decision_comment: "Looks good, ship it!",
      },
      null,
      2,
    ),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let headerId = 0;
function nextHeaderId(): string {
  return `h_${++headerId}`;
}

function defaultHeaders(): Header[] {
  return [
    { id: nextHeaderId(), key: "Content-Type", value: "application/json" },
    { id: nextHeaderId(), key: "Authorization", value: "Bearer " },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RequestBuilder({
  connections,
}: {
  connections: Omit<Connection, "api_key_hash">[];
}) {
  // ---- State ---------------------------------------------------------------
  const [method, setMethod] = useState<HttpMethod>("POST");
  const [endpoint, setEndpoint] = useState("/api/v1/approvals");
  const [headers, setHeaders] = useState<Header[]>(defaultHeaders);
  const [body, setBody] = useState(TEMPLATES[0].body);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<PlaygroundResponse | null>(null);

  // ---- Header management ---------------------------------------------------

  const addHeader = useCallback(() => {
    setHeaders((prev) => [...prev, { id: nextHeaderId(), key: "", value: "" }]);
  }, []);

  const removeHeader = useCallback((id: string) => {
    setHeaders((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const updateHeader = useCallback(
    (id: string, field: "key" | "value", value: string) => {
      setHeaders((prev) =>
        prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)),
      );
    },
    [],
  );

  // ---- Connection selector -------------------------------------------------

  const selectConnection = useCallback(
    (connectionId: string) => {
      const conn = connections.find((c) => c.id === connectionId);
      if (!conn) return;

      // Update the Authorization header value with the prefix hint.
      setHeaders((prev) =>
        prev.map((h) =>
          h.key.toLowerCase() === "authorization"
            ? {
                ...h,
                value: `Bearer ${conn.api_key_prefix}... (paste full key)`,
              }
            : h,
        ),
      );

      toast.info(
        `Selected connection "${conn.name}". Paste the full API key into the Authorization header.`,
      );
    },
    [connections],
  );

  // ---- Template application ------------------------------------------------

  const applyTemplate = useCallback((templateLabel: string) => {
    const template = TEMPLATES.find((t) => t.label === templateLabel);
    if (!template) return;

    setMethod(template.method);
    setEndpoint(template.endpoint);
    setBody(template.body);

    // Reset headers to defaults when applying a template.
    setHeaders(defaultHeaders());
    setResponse(null);

    toast.success(`Template "${template.label}" applied`);
  }, []);

  // ---- Send request --------------------------------------------------------

  const sendRequest = useCallback(async () => {
    setSending(true);
    setResponse(null);

    try {
      const reqHeaders: Record<string, string> = {};
      for (const h of headers) {
        if (h.key.trim() && h.value.trim()) {
          reqHeaders[h.key.trim()] = h.value.trim();
        }
      }

      const hasBody =
        (method === "POST" || method === "PATCH") && body.trim();

      const start = Date.now();

      const res = await fetch(endpoint, {
        method,
        headers: reqHeaders,
        body: hasBody ? body : undefined,
      });

      const duration = Date.now() - start;

      // Read response body as text first, then try to parse.
      const resBody = await res.text();

      // Collect response headers into a plain object.
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        resHeaders[key] = value;
      });

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: resBody,
        duration,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(`Request failed: ${message}`);
      setResponse({
        status: 0,
        statusText: "Network Error",
        headers: {},
        body: JSON.stringify({ error: message }, null, 2),
        duration: 0,
      });
    } finally {
      setSending(false);
    }
  }, [method, endpoint, headers, body]);

  // ---- Build full URL for code snippets ------------------------------------
  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${endpoint}`
      : endpoint;

  const snippetHeaders = headers
    .filter((h) => h.key.trim() && h.value.trim())
    .map((h) => ({ key: h.key, value: h.value }));

  // ---- Render --------------------------------------------------------------

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ================================================================== */}
      {/* Left column: Request builder                                       */}
      {/* ================================================================== */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Request</CardTitle>

              {/* Template selector */}
              <Select onValueChange={applyTemplate}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Load template..." />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.label} value={t.label}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* ---- Method + Endpoint ---- */}
            <div className="flex gap-2">
              <div className="w-[120px] shrink-0">
                <Label htmlFor="method" className="sr-only">
                  Method
                </Label>
                <Select
                  value={method}
                  onValueChange={(v) => setMethod(v as HttpMethod)}
                >
                  <SelectTrigger id="method" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label htmlFor="endpoint" className="sr-only">
                  Endpoint
                </Label>
                <div className="relative">
                  <Input
                    id="endpoint"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="/api/v1/approvals"
                    list="common-endpoints"
                    className="font-mono text-sm"
                  />
                  <datalist id="common-endpoints">
                    {COMMON_ENDPOINTS.map((ep) => (
                      <option key={ep} value={ep} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <Separator />

            {/* ---- Connection selector ---- */}
            {connections.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="connection">Connection (API Key)</Label>
                <Select onValueChange={selectConnection}>
                  <SelectTrigger id="connection" className="w-full">
                    <SelectValue placeholder="Select a connection..." />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((conn) => (
                      <SelectItem key={conn.id} value={conn.id}>
                        <span className="flex items-center gap-2">
                          <span>{conn.name}</span>
                          <span className="text-muted-foreground font-mono text-xs">
                            {conn.api_key_prefix}...
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  The stored key prefix is shown for identification. You must
                  paste the full API key into the Authorization header.
                </p>
              </div>
            )}

            <Separator />

            {/* ---- Headers ---- */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Headers</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={addHeader}
                >
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {headers.map((header) => (
                  <div key={header.id} className="flex items-center gap-2">
                    <Input
                      value={header.key}
                      onChange={(e) =>
                        updateHeader(header.id, "key", e.target.value)
                      }
                      placeholder="Header name"
                      className="flex-1 font-mono text-xs"
                    />
                    <Input
                      value={header.value}
                      onChange={(e) =>
                        updateHeader(header.id, "value", e.target.value)
                      }
                      placeholder="Value"
                      className="flex-1 font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeHeader(header.id)}
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Remove header</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* ---- Body (POST / PATCH only) ---- */}
            {(method === "POST" || method === "PATCH") && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="body">Request Body (JSON)</Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder='{ "key": "value" }'
                    rows={12}
                    className="resize-y font-mono text-xs leading-relaxed"
                  />
                </div>
              </>
            )}

            <Separator />

            {/* ---- Send button ---- */}
            <Button
              onClick={sendRequest}
              disabled={sending || !endpoint.trim()}
              className="w-full gap-2"
            >
              <Play className="size-4" />
              {sending ? "Sending..." : "Send Request"}
            </Button>
          </CardContent>
        </Card>

        {/* ---- Code Snippets ---- */}
        <CodeSnippets
          method={method}
          url={fullUrl}
          headers={snippetHeaders}
          body={body}
        />
      </div>

      {/* ================================================================== */}
      {/* Right column: Response viewer                                      */}
      {/* ================================================================== */}
      <div>
        <ResponseViewer response={response} />
      </div>
    </div>
  );
}

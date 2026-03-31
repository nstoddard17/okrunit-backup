/**
 * Chainable Supabase mock for unit tests.
 *
 * Usage:
 *   const { mockClient, mockResult } = createMockSupabaseClient();
 *   vi.mocked(createAdminClient).mockReturnValue(mockClient as any);
 *   mockResult({ data: [...], count: 5 });
 */
import { vi } from "vitest";

interface MockQueryResult {
  data: unknown;
  error: null | { message: string };
  count: number | null;
}

export function createMockSupabaseClient() {
  let pendingResult: MockQueryResult = { data: null, error: null, count: null };

  const chainable: Record<string, ReturnType<typeof vi.fn>> = {};

  const methods = [
    "from",
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "in",
    "is",
    "like",
    "ilike",
    "match",
    "not",
    "or",
    "filter",
    "order",
    "limit",
    "range",
    "single",
    "maybeSingle",
  ];

  const proxy: Record<string, unknown> = {};

  for (const method of methods) {
    chainable[method] = vi.fn();
  }

  // Every method returns the proxy (chainable), except `single`/`maybeSingle`
  // which resolve the pending result.
  for (const method of methods) {
    chainable[method].mockImplementation(() => {
      if (method === "single" || method === "maybeSingle") {
        return Promise.resolve(pendingResult);
      }
      return proxy;
    });
    proxy[method] = chainable[method];
  }

  // Overrides: `from` also resets and returns proxy (for fresh chains)
  chainable["from"].mockImplementation(() => proxy);

  // `select` with count option should still chain
  chainable["select"].mockImplementation(() => proxy);

  // `insert`/`update`/`delete` resolve by default (no `.single()` needed)
  for (const m of ["insert", "update", "delete"]) {
    chainable[m].mockImplementation(() => proxy);
  }

  // Allow `.then()` on the proxy so `await admin.from(...).select(...)...` resolves
  (proxy as Record<string, unknown>)["then"] = (
    resolve: (v: MockQueryResult) => void,
    reject: (e: unknown) => void,
  ) => {
    return Promise.resolve(pendingResult).then(resolve, reject);
  };

  /** Set the result that the next query chain will resolve to. */
  function mockResult(result: Partial<MockQueryResult>) {
    pendingResult = { data: null, error: null, count: null, ...result };
  }

  /** Set per-table results for more granular control. */
  function mockTableResults(tableResults: Record<string, Partial<MockQueryResult>>) {
    chainable["from"].mockImplementation((table: string) => {
      if (tableResults[table]) {
        pendingResult = { data: null, error: null, count: null, ...tableResults[table] };
      }
      return proxy;
    });
  }

  return {
    mockClient: proxy,
    mockResult,
    mockTableResults,
    chainable,
  };
}

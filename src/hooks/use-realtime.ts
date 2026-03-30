"use client";

// ---------------------------------------------------------------------------
// OKrunit -- Generic Supabase Realtime Subscription Hook
// ---------------------------------------------------------------------------

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

type PostgresChangeEvent = "INSERT" | "UPDATE" | "DELETE";

interface UseRealtimeOptions<T> {
  table: string;
  schema?: string;
  filter?: string; // e.g., "org_id=eq.xxx"
  event?: PostgresChangeEvent | "*";
  onInsert?: (record: T) => void;
  onUpdate?: (record: T, oldRecord: T) => void;
  onDelete?: (oldRecord: T) => void;
  enabled?: boolean;
}

/**
 * Subscribe to Supabase Realtime Postgres changes for a given table.
 *
 * The subscription is scoped by an optional RLS-compatible `filter` string
 * (e.g. `org_id=eq.<uuid>`) and automatically cleaned up on unmount or when
 * the `table`, `filter`, or `enabled` dependencies change.
 *
 * Returns a ref to the underlying `RealtimeChannel` for advanced use-cases.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRealtime<T extends { [key: string]: any }>(
  options: UseRealtimeOptions<T>,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (options.enabled === false) return;

    let cancelled = false;
    const supabase = createClient();
    const channelName = `realtime-${options.table}-${Math.random().toString(36).slice(2)}`;

    // Build channel with listener, then subscribe asynchronously
    // to avoid the "cannot add callbacks after subscribe()" race in strict mode.
    const channel = supabase.channel(channelName);

    channel.on(
      "postgres_changes",
      {
        event: options.event || "*",
        schema: options.schema || "public",
        table: options.table,
        filter: options.filter,
      },
      (payload: RealtimePostgresChangesPayload<T>) => {
        if (cancelled) return;
        if (payload.eventType === "INSERT" && options.onInsert) {
          options.onInsert(payload.new as T);
        } else if (payload.eventType === "UPDATE" && options.onUpdate) {
          options.onUpdate(payload.new as T, payload.old as T);
        } else if (payload.eventType === "DELETE" && options.onDelete) {
          options.onDelete(payload.old as T);
        }
      },
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // Re-subscribe when table, filter, or enabled flag changes.
    // Callback refs (onInsert, onUpdate, onDelete) are intentionally omitted
    // to avoid unnecessary re-subscriptions -- callers should memoize them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.table, options.filter, options.enabled]);

  return channelRef;
}

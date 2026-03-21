"use client";

// ---------------------------------------------------------------------------
// OKRunit -- Connection Data Hook
// ---------------------------------------------------------------------------

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Connection } from "@/lib/types/database";

/**
 * Provides the list of `Connection` rows for the current user's organisation.
 *
 * When `initialConnections` are passed (e.g. from a Server Component), the
 * hook uses them directly and skips the client-side fetch. Otherwise it
 * performs a one-time fetch via the browser Supabase client.
 */
export function useConnections(initialConnections?: Connection[]) {
  const [connections, setConnections] = useState<Connection[]>(
    initialConnections ?? [],
  );
  const [isLoading, setIsLoading] = useState(!initialConnections);

  useEffect(() => {
    if (initialConnections) return;

    async function fetchConnections() {
      const supabase = createClient();
      const { data } = await supabase
        .from("connections")
        .select(
          "id, org_id, name, description, api_key_prefix, is_active, rate_limit_per_hour, allowed_action_types, max_priority, last_used_at, created_by, created_at, updated_at",
        )
        .order("created_at", { ascending: false });

      if (data) setConnections(data as Connection[]);
      setIsLoading(false);
    }

    fetchConnections();
  }, [initialConnections]);

  return { connections, setConnections, isLoading };
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuditLogTable } from "@/components/audit/audit-log-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditLogEntry } from "@/lib/types/database";

const PAGE_SIZE = 50;

interface AuditLogClientProps {
  orgId: string;
}

export function AuditLogClient({ orgId }: AuditLogClientProps) {
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("audit_log")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      setEntries((data as AuditLogEntry[]) ?? []);
    };
    load();
  }, [orgId]);

  if (entries === null) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-9 w-[200px]" />
          <Skeleton className="h-9 w-[200px]" />
        </div>
        <div className="rounded-xl border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-5 w-[70px] rounded-full" />
              <Skeleton className="h-4 w-[90px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[130px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <AuditLogTable initialEntries={entries} orgId={orgId} pageSize={PAGE_SIZE} />;
}

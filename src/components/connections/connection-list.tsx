"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Unplug } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConnectionCard } from "@/components/connections/connection-card";
import { ConnectionForm } from "@/components/connections/connection-form";
import type { Connection } from "@/lib/types/database";

// ---- Component --------------------------------------------------------------

interface ConnectionListProps {
  initialConnections: Connection[];
}

export function ConnectionList({ initialConnections }: ConnectionListProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  // ---- Handlers -----------------------------------------------------------

  async function handleDeactivate(id: string) {
    try {
      const res = await fetch(`/api/v1/connections/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to deactivate connection");
      }

      toast.success("Connection deactivated");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to deactivate connection",
      );
    }
  }

  async function handleActivate(id: string) {
    try {
      const res = await fetch(`/api/v1/connections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to activate connection");
      }

      toast.success("Connection activated");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to activate connection",
      );
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/v1/connections/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to delete connection");
      }

      toast.success("Connection deleted");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete connection",
      );
    }
  }

  // ---- Render -------------------------------------------------------------

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Create Connection
        </Button>
      </div>

      {/* Connection cards or empty state */}
      {initialConnections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Unplug className="text-muted-foreground mb-4 size-10" />
          <h3 className="text-sm font-medium">No connections yet</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            Create a connection to generate an API key that your agents and
            integrations can use to submit approval requests.
          </p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus />
            Create Connection
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {initialConnections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onDeactivate={handleDeactivate}
              onActivate={handleActivate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <ConnectionForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}

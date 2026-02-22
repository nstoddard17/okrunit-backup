"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Key, Pencil, Power, PowerOff, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConnectionForm } from "@/components/connections/connection-form";
import type { Connection } from "@/lib/types/database";

// ---- Component --------------------------------------------------------------

interface ConnectionCardProps {
  connection: Connection;
  onDeactivate: (id: string) => Promise<void>;
  onActivate: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ConnectionCard({
  connection,
  onDeactivate,
  onActivate,
  onDelete,
}: ConnectionCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isActive = connection.is_active;

  // ---- Handlers -----------------------------------------------------------

  async function handleToggleActive() {
    setLoading(true);
    try {
      if (isActive) {
        await onDeactivate(connection.id);
      } else {
        await onActivate(connection.id);
      }
      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await onDelete(connection.id);
      setDeleteOpen(false);
    } finally {
      setLoading(false);
    }
  }

  // ---- Render -------------------------------------------------------------

  return (
    <>
      <Card className={!isActive ? "opacity-60" : undefined}>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              {connection.name}
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </CardTitle>
            {connection.description && (
              <CardDescription>{connection.description}</CardDescription>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Metadata row */}
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Key className="size-3.5" />
              <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                gk_{connection.api_key_prefix}...
              </code>
            </span>

            <span>
              Rate limit:{" "}
              <span className="text-foreground font-medium">
                {connection.rate_limit_per_hour}
              </span>
              /hr
            </span>

            {connection.last_used_at && (
              <span>
                Last used{" "}
                {formatDistanceToNow(new Date(connection.last_used_at), {
                  addSuffix: true,
                })}
              </span>
            )}

            <span>
              Created{" "}
              {formatDistanceToNow(new Date(connection.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil />
              Edit
            </Button>

            <Button
              variant={isActive ? "outline" : "default"}
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              {isActive ? (
                <>
                  <PowerOff />
                  Deactivate
                </>
              ) : (
                <>
                  <Power />
                  Activate
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <ConnectionForm
        connection={connection}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
        }}
      />

      {/* Confirmation dialog for activate / deactivate */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isActive ? "Deactivate" : "Activate"} Connection
            </DialogTitle>
            <DialogDescription>
              {isActive
                ? `Are you sure you want to deactivate "${connection.name}"? Any agents using this connection's API key will immediately lose access.`
                : `Are you sure you want to reactivate "${connection.name}"? The existing API key will start working again.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant={isActive ? "destructive" : "default"}
              onClick={handleToggleActive}
              disabled={loading}
            >
              {loading
                ? isActive
                  ? "Deactivating..."
                  : "Activating..."
                : isActive
                  ? "Deactivate"
                  : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for delete */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Connection</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete &ldquo;{connection.name}&rdquo;? This action cannot be undone. The API key will be invalidated immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState, useCallback, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Connection } from "@/lib/types/database";

// ---- Types ----------------------------------------------------------------

interface ScopingFormProps {
  connection: Connection;
  onSave: () => void;
}

// ---- Priority options -----------------------------------------------------

const PRIORITY_OPTIONS = [
  { value: "none", label: "No limit" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

// ---- Helpers --------------------------------------------------------------

function parseIpAllowlist(connection: Connection): string[] {
  if (
    connection.scoping_rules &&
    typeof connection.scoping_rules === "object"
  ) {
    const rules = connection.scoping_rules as Record<string, unknown>;
    if (Array.isArray(rules.ip_allowlist)) {
      return rules.ip_allowlist.filter(
        (ip): ip is string => typeof ip === "string",
      );
    }
  }
  return [];
}

// ---- Component ------------------------------------------------------------

export function ScopingForm({ connection, onSave }: ScopingFormProps) {
  // -- State: Allowed action types -------------------------------------------
  const [actionTypes, setActionTypes] = useState<string[]>(
    connection.allowed_action_types ?? [],
  );
  const [actionTypeInput, setActionTypeInput] = useState("");

  // -- State: Maximum priority -----------------------------------------------
  const [maxPriority, setMaxPriority] = useState<string>(
    connection.max_priority ?? "none",
  );

  // -- State: IP allowlist ---------------------------------------------------
  const [ipAllowlist, setIpAllowlist] = useState<string>(
    parseIpAllowlist(connection).join("\n"),
  );

  // -- State: Loading --------------------------------------------------------
  const [saving, setSaving] = useState(false);

  // -- Action type tag management --------------------------------------------

  const addActionType = useCallback(() => {
    const trimmed = actionTypeInput.trim().toLowerCase();
    if (!trimmed) return;
    if (actionTypes.includes(trimmed)) {
      toast.error(`"${trimmed}" is already in the list`);
      return;
    }
    setActionTypes((prev) => [...prev, trimmed]);
    setActionTypeInput("");
  }, [actionTypeInput, actionTypes]);

  const removeActionType = useCallback((type: string) => {
    setActionTypes((prev) => prev.filter((t) => t !== type));
  }, []);

  const handleActionTypeKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addActionType();
      }
    },
    [addActionType],
  );

  // -- Save handler ----------------------------------------------------------

  async function handleSave() {
    setSaving(true);

    // Parse IP allowlist from the textarea (one per line, trimmed, non-empty).
    const parsedIps = ipAllowlist
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    // Build the scoping_rules object.
    const scopingRules =
      parsedIps.length > 0 ? { ip_allowlist: parsedIps } : null;

    const body: Record<string, unknown> = {
      allowed_action_types: actionTypes.length > 0 ? actionTypes : null,
      max_priority: maxPriority === "none" ? null : maxPriority,
      scoping_rules: scopingRules,
    };

    try {
      const res = await fetch(`/api/v1/connections/${connection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save scoping rules");
      }

      toast.success("Connection scoping rules updated");
      onSave();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setSaving(false);
    }
  }

  // -- Render ----------------------------------------------------------------

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection Scoping</CardTitle>
        <CardDescription>
          Restrict what this connection is allowed to submit. Leave fields empty
          for no restrictions.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ---- Allowed Action Types ---------------------------------------- */}
        <div className="space-y-2">
          <Label>Allowed Action Types</Label>
          <p className="text-muted-foreground text-sm">
            Only these action types will be accepted. Leave empty to allow all.
          </p>

          {/* Tag display */}
          {actionTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {actionTypes.map((type) => (
                <Badge key={type} variant="secondary" className="gap-1 pr-1">
                  {type}
                  <button
                    type="button"
                    onClick={() => removeActionType(type)}
                    className="hover:bg-muted-foreground/20 ml-0.5 rounded-full p-0.5"
                    aria-label={`Remove ${type}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Input for adding new tags */}
          <div className="flex gap-2">
            <Input
              placeholder="e.g. deploy, database_migration"
              value={actionTypeInput}
              onChange={(e) => setActionTypeInput(e.target.value)}
              onKeyDown={handleActionTypeKeyDown}
              disabled={saving}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addActionType}
              disabled={saving || !actionTypeInput.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        {/* ---- Maximum Priority -------------------------------------------- */}
        <div className="space-y-2">
          <Label>Maximum Priority</Label>
          <p className="text-muted-foreground text-sm">
            Requests with a priority higher than this will be rejected.
          </p>
          <Select value={maxPriority} onValueChange={setMaxPriority}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select maximum priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ---- IP Allowlist ------------------------------------------------ */}
        <div className="space-y-2">
          <Label>IP Allowlist</Label>
          <p className="text-muted-foreground text-sm">
            Only requests from these IP addresses will be accepted. One IP per
            line. Leave empty to allow all.
          </p>
          <Textarea
            placeholder={"192.168.1.1\n10.0.0.0\n2001:db8::1"}
            value={ipAllowlist}
            onChange={(e) => setIpAllowlist(e.target.value)}
            disabled={saving}
            rows={4}
          />
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Scoping Rules"}
        </Button>
      </CardFooter>
    </Card>
  );
}

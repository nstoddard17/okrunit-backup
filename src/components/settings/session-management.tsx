"use client";

import { useState } from "react";
import { Monitor, LogOut, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SessionManagement() {
  const [revoking, setRevoking] = useState(false);

  async function handleSignOutOthers() {
    setRevoking(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      toast.success("All other sessions have been signed out");
    } catch {
      toast.error("Failed to sign out other sessions");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Session Management</h3>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-white dark:bg-card px-4 py-3">
        <Monitor className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">Current Session</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            This is the device you&apos;re currently using.
          </p>
        </div>
        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">Active</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs bg-white dark:bg-card"
        onClick={handleSignOutOthers}
        disabled={revoking}
      >
        {revoking ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <LogOut className="size-3.5" />
        )}
        Sign out all other sessions
      </Button>

      <p className="text-[11px] text-muted-foreground">
        This will sign out all other browsers and devices where you&apos;re logged in.
        Your current session will remain active.
      </p>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Key,
  Plus,
  Trash2,
  Fingerprint,
  Shield,
  Loader2,
} from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Credential {
  id: string;
  name: string;
  device_type: string | null;
  backed_up: boolean;
  transports: string[];
  last_used_at: string | null;
  created_at: string;
}

export function PasskeySettings() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("Security Key");

  useEffect(() => {
    fetchCredentials();
  }, []);

  async function fetchCredentials() {
    try {
      const res = await fetch("/api/v1/auth/webauthn/credentials");
      if (res.ok) {
        const data = await res.json();
        setCredentials(data.credentials ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setRegistering(true);
    try {
      // 1. Get registration options from server
      const optionsRes = await fetch("/api/v1/auth/webauthn/register", {
        method: "POST",
      });
      if (!optionsRes.ok) throw new Error("Failed to get registration options");
      const options = await optionsRes.json();

      // 2. Start browser registration ceremony
      const registration = await startRegistration({ optionsJSON: options });

      // 3. Send response to server for verification
      const verifyRes = await fetch("/api/v1/auth/webauthn/register", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: registration, name: keyName }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error ?? "Registration failed");
      }

      toast.success("Passkey registered successfully");
      setNameDialogOpen(false);
      setKeyName("Security Key");
      fetchCredentials();
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        toast.error("Registration was cancelled");
      } else {
        toast.error(err instanceof Error ? err.message : "Registration failed");
      }
    } finally {
      setRegistering(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/v1/auth/webauthn/credentials?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove");
      toast.success("Passkey removed");
      fetchCredentials();
    } catch {
      toast.error("Failed to remove passkey");
    } finally {
      setDeleting(null);
    }
  }

  // Check if WebAuthn is supported
  const isSupported = typeof window !== "undefined" && !!window.PublicKeyCredential;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Fingerprint className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Passkeys & Security Keys</h3>
        </div>
        {isSupported && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs bg-white dark:bg-card"
            onClick={() => setNameDialogOpen(true)}
            disabled={registering}
          >
            <Plus className="size-3.5" />
            Add Passkey
          </Button>
        )}
      </div>

      {!isSupported && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Your browser doesn&apos;t support passkeys (WebAuthn). Use a modern browser like Chrome, Safari, or Firefox.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : credentials.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-border/50 py-8 text-center">
          <Key className="size-6 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">No passkeys registered</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            Add a hardware key (YubiKey) or biometric (fingerprint, Face ID) for stronger security.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className="group flex items-center gap-3 rounded-lg border border-border/50 bg-white dark:bg-card px-3 py-2.5"
            >
              <Shield className="size-4 shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{cred.name}</p>
                  {cred.device_type && (
                    <Badge variant="secondary" className="text-[10px]">
                      {cred.device_type === "singleDevice" ? "Hardware Key" : "Synced Passkey"}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Added {new Date(cred.created_at).toLocaleDateString()}
                  {cred.last_used_at && ` · Last used ${new Date(cred.last_used_at).toLocaleDateString()}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(cred.id)}
                disabled={deleting === cred.id}
              >
                <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Name dialog before registration */}
      <Dialog open={nameDialogOpen} onOpenChange={(open) => { if (!open) setNameDialogOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Passkey</DialogTitle>
            <DialogDescription>
              Register a hardware security key (YubiKey) or biometric (fingerprint, Face ID).
              Give it a name so you can identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              placeholder="e.g. YubiKey, MacBook Touch ID"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              maxLength={50}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameDialogOpen(false)} disabled={registering}>
              Cancel
            </Button>
            <Button onClick={handleRegister} disabled={registering || !keyName.trim()}>
              {registering ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Waiting for key...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

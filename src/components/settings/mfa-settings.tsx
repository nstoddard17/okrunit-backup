"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  ShieldOff,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { verifyMfaCode } from "@/lib/mfa";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type EnrollmentState =
  | { step: "idle" }
  | { step: "enrolling"; factorId: string; qrCode: string; secret: string }
  | { step: "enrolled"; factorId: string };

export function MfaSettings({ inline = false }: { inline?: boolean }) {
  const [state, setState] = useState<EnrollmentState>({ step: "idle" });
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Disable dialog
  const [showDisable, setShowDisable] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disabling, setDisabling] = useState(false);

  const loadFactors = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find((f) => f.status === "verified");
    if (verified) {
      setState({ step: "enrolled", factorId: verified.id });
    } else {
      setState({ step: "idle" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFactors();
  }, [loadFactors]);

  async function handleEnroll() {
    setError(null);
    const supabase = createClient();
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "OKrunit",
    });

    if (enrollError || !data) {
      setError(enrollError?.message ?? "Failed to start enrollment");
      return;
    }

    setState({
      step: "enrolling",
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
  }

  async function handleVerify() {
    if (state.step !== "enrolling") return;
    setVerifying(true);
    setError(null);

    const supabase = createClient();
    const result = await verifyMfaCode(supabase, state.factorId, code);

    if (result.error) {
      setError(result.error);
      setVerifying(false);
      return;
    }

    setState({ step: "enrolled", factorId: state.factorId });
    setCode("");
    setVerifying(false);
    toast.success("Two-factor authentication enabled.");
  }

  async function handleDisable() {
    if (state.step !== "enrolled") return;
    setDisabling(true);
    setError(null);

    const supabase = createClient();

    // Verify the code first to confirm identity
    const verifyResult = await verifyMfaCode(supabase, state.factorId, disableCode);
    if (verifyResult.error) {
      setError(verifyResult.error);
      setDisabling(false);
      return;
    }

    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId: state.factorId,
    });

    if (unenrollError) {
      setError(unenrollError.message);
      setDisabling(false);
      return;
    }

    setState({ step: "idle" });
    setDisableCode("");
    setDisabling(false);
    setShowDisable(false);
    toast.success("Two-factor authentication disabled.");
  }

  function handleCopySecret() {
    if (state.step !== "enrolling") return;
    navigator.clipboard.writeText(state.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCancel() {
    // Unenroll the unverified factor silently
    if (state.step === "enrolling") {
      const supabase = createClient();
      supabase.auth.mfa.unenroll({ factorId: state.factorId });
    }
    setState({ step: "idle" });
    setCode("");
    setError(null);
  }

  if (loading) {
    const loadingContent = (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );

    if (inline) return loadingContent;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>{loadingContent}</CardContent>
      </Card>
    );
  }

  const mfaContent = (
    <div className="space-y-4">
      {inline && (
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Two-Factor Authentication</h3>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {state.step === "idle" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted/50 p-2">
                  <ShieldOff className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Not enabled</p>
                  <p className="text-xs text-muted-foreground">
                    Your account is not protected with 2FA.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-zinc-900"
                onClick={handleEnroll}
              >
                Enable 2FA
              </Button>
            </div>
          )}

          {state.step === "enrolling" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.), then enter the 6-digit code below.
              </p>

              <div className="flex flex-col items-center gap-4 rounded-lg border bg-white p-6 dark:bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={state.qrCode}
                  alt="Scan this QR code with your authenticator app"
                  className="size-48"
                />
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                    {state.secret}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleCopySecret}
                    title="Copy secret"
                  >
                    {copied ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Can&apos;t scan? Enter the secret key manually.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mfa-code">Verification code</Label>
                <Input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="bg-white dark:bg-zinc-900"
                  autoComplete="one-time-code"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-white dark:bg-zinc-900"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleVerify}
                  disabled={code.length !== 6 || verifying}
                >
                  {verifying && <Loader2 className="size-4 animate-spin" />}
                  Verify &amp; Enable
                </Button>
              </div>
            </div>
          )}

          {state.step === "enrolled" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <ShieldCheck className="size-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Enabled
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your account is protected with two-factor authentication.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-zinc-900"
                onClick={() => {
                  setShowDisable(true);
                  setError(null);
                  setDisableCode("");
                }}
              >
                Disable 2FA
              </Button>
            </div>
          )}
    </div>
  );

  return (
    <>
      {inline ? mfaContent : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security by requiring a code from your authenticator app when signing in.
            </CardDescription>
          </CardHeader>
          <CardContent>{mfaContent}</CardContent>
        </Card>
      )}

      {/* Disable confirmation dialog */}
      <AlertDialog open={showDisable} onOpenChange={setShowDisable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable two-factor authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the extra security layer from your account. Enter your current authenticator code to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="disable-mfa-code">Authenticator code</Label>
            <Input
              id="disable-mfa-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
              autoComplete="one-time-code"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={disabling}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={disableCode.length !== 6 || disabling}
            >
              {disabling && <Loader2 className="size-4 animate-spin" />}
              Disable 2FA
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

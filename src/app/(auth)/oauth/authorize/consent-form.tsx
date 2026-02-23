"use client";

// ---------------------------------------------------------------------------
// Gatekeeper -- OAuth 2.0 Consent Form
// ---------------------------------------------------------------------------

import { useState } from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SCOPE_LABELS: Record<string, { label: string; description: string }> = {
  "approvals:read": {
    label: "Read Approvals",
    description: "View approval requests and their details",
  },
  "approvals:write": {
    label: "Write Approvals",
    description: "Create, approve, and reject approval requests",
  },
  "comments:write": {
    label: "Write Comments",
    description: "Add comments to approval requests",
  },
};

interface ConsentFormProps {
  clientName: string;
  orgName: string;
  scopes: string[];
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  userId: string;
  orgId: string;
}

export function ConsentForm({
  clientName,
  orgName,
  scopes,
  clientId,
  redirectUri,
  state,
  codeChallenge,
  codeChallengeMethod,
  userId,
  orgId,
}: ConsentFormProps) {
  const [loading, setLoading] = useState(false);

  async function handleAuthorize() {
    setLoading(true);

    try {
      const response = await fetch("/api/v1/oauth/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          scopes,
          state,
          code_challenge: codeChallenge || undefined,
          code_challenge_method: codeChallengeMethod || undefined,
          user_id: userId,
          org_id: orgId,
        }),
      });

      const data = await response.json();

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        console.error("No redirect URL in response:", data);
        setLoading(false);
      }
    } catch (err) {
      console.error("Authorization failed:", err);
      setLoading(false);
    }
  }

  function handleDeny() {
    const url = new URL(redirectUri);
    url.searchParams.set("error", "access_denied");
    url.searchParams.set("error_description", "The user denied the request.");
    if (state) url.searchParams.set("state", state);
    window.location.href = url.toString();
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <img
          src="/logo_text.png"
          alt="Gatekeeper"
          className="mx-auto mb-4 h-8 w-auto dark:invert"
        />
        <CardTitle className="text-xl">Authorize {clientName}</CardTitle>
        <CardDescription>
          <strong>{clientName}</strong> is requesting access to your{" "}
          <strong>{orgName}</strong> organization on Gatekeeper.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">This will allow {clientName} to:</p>
        </div>

        <ul className="space-y-3">
          {scopes.map((scope) => {
            const info = SCOPE_LABELS[scope];
            return (
              <li
                key={scope}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <div>
                  <p className="text-sm font-medium">
                    {info?.label || scope}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {info?.description || scope}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleDeny}
          disabled={loading}
        >
          <X className="h-4 w-4" />
          Deny
        </Button>
        <Button
          className="flex-1"
          onClick={handleAuthorize}
          disabled={loading}
        >
          {loading ? "Authorizing..." : "Authorize"}
        </Button>
      </CardFooter>
    </Card>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";
import { toast } from "sonner";

import { ConnectedAppCard } from "@/components/connections/connected-app-card";
import type { OAuthGrant } from "@/lib/types/oauth-grant";

// ---- Component --------------------------------------------------------------

interface ConnectedAppsListProps {
  grants: OAuthGrant[];
}

export function ConnectedAppsList({ grants }: ConnectedAppsListProps) {
  const router = useRouter();

  async function handleRevoke(clientId: string) {
    try {
      const res = await fetch(`/api/v1/oauth/grants/${clientId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to revoke access");
      }

      toast.success("App access revoked successfully");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to revoke access",
      );
    }
  }

  if (grants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
        <Link2 className="text-muted-foreground mb-4 size-10" />
        <h3 className="text-sm font-medium">No connected apps</h3>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          When third-party apps like Zapier connect to your organization via
          OAuth, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {grants.map((grant) => (
        <ConnectedAppCard
          key={grant.client_id}
          grant={grant}
          onRevoke={handleRevoke}
        />
      ))}
    </div>
  );
}

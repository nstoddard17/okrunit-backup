"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepLayout } from "./step-layout";
import { Building2 } from "lucide-react";

interface OrganizationStepProps {
  initialName: string;
  orgId: string;
  onComplete: () => void;
  onBack?: () => void;
}

export function OrganizationStep({
  initialName,
  orgId,
  onComplete,
  onBack,
}: OrganizationStepProps) {
  const [name, setName] = useState(initialName || "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleNext() {
    if (!name.trim()) {
      setError("Organization name is required.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/org`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to update organization name.");
          return;
        }

        onComplete();
      } catch {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  }

  return (
    <StepLayout
      stepNumber={1}
      totalSteps={5}
      title="Name your organization"
      description="This is how your organization will appear across OKRunit. You can change it later in settings."
      onNext={handleNext}
      onBack={onBack}
      showBack={false}
      nextLabel="Save & Continue"
      nextDisabled={!name.trim()}
      isLoading={isPending}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Organization name</p>
            <p className="text-xs text-muted-foreground">
              Your team will see this name when working in OKRunit.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-name">Name</Label>
          <Input
            id="org-name"
            type="text"
            placeholder="e.g., Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            autoFocus
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </StepLayout>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useSetupWizard } from "@/hooks/use-onboarding";
import { WizardProgress } from "./wizard-progress";
import { OrganizationStep } from "./organization-step";
import { InviteTeamStep } from "./invite-team-step";
import { ConnectMessagingStep } from "./connect-messaging-step";
import { CreateConnectionStep } from "./create-connection-step";
import { TestApprovalStep } from "./test-approval-step";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SetupWizardProps {
  orgId: string;
  orgName: string;
  connectedPlatforms: string[];
}

export function SetupWizard({
  orgId,
  orgName,
  connectedPlatforms,
}: SetupWizardProps) {
  const router = useRouter();
  const {
    state,
    loaded,
    goToStep,
    completeStep,
    skipStep,
    updateData,
    isComplete,
  } = useSetupWizard();

  // If already complete, redirect to dashboard
  if (loaded && isComplete) {
    router.push("/dashboard");
    return null;
  }

  // Show skeleton while loading localStorage state
  if (!loaded) {
    return (
      <Card>
        <CardContent className="space-y-6 p-8">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  const currentStep = state.currentStep;

  function handleCompleteSetup() {
    // Mark as fully complete and navigate to dashboard
    completeStep(4);
    router.push("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <WizardProgress
        currentStep={currentStep}
        completedSteps={state.completedSteps}
        onStepClick={goToStep}
      />

      {/* Step content */}
      <Card>
        <CardContent className="p-6 sm:p-8">
          {currentStep === 0 && (
            <OrganizationStep
              initialName={orgName}
              orgId={orgId}
              onComplete={() => completeStep(0)}
            />
          )}

          {currentStep === 1 && (
            <InviteTeamStep
              onComplete={() => completeStep(1)}
              onBack={() => goToStep(0)}
              onSkip={() => skipStep(1)}
            />
          )}

          {currentStep === 2 && (
            <ConnectMessagingStep
              connectedPlatforms={connectedPlatforms}
              onComplete={() => completeStep(2)}
              onBack={() => goToStep(1)}
              onSkip={() => skipStep(2)}
            />
          )}

          {currentStep === 3 && (
            <CreateConnectionStep
              existingConnectionId={state.connectionId}
              existingApiKey={state.apiKey}
              onComplete={(connectionId, apiKey) => {
                updateData({ connectionId, apiKey });
                completeStep(3);
              }}
              onBack={() => goToStep(2)}
              onSkip={() => skipStep(3)}
            />
          )}

          {currentStep === 4 && (
            <TestApprovalStep
              apiKey={state.apiKey}
              existingTestApprovalId={state.testApprovalId}
              onComplete={(approvalId) => {
                updateData({ testApprovalId: approvalId });
                handleCompleteSetup();
              }}
              onBack={() => goToStep(3)}
            />
          )}

          {/* Edge case: step past the end */}
          {currentStep >= 5 && (() => {
            router.push("/dashboard");
            return null;
          })()}
        </CardContent>
      </Card>
    </div>
  );
}

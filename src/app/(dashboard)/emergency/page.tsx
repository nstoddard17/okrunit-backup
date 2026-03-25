import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmergencyStopButton } from "@/components/emergency/emergency-stop-button";
import { EmergencyStatus } from "@/components/emergency/emergency-status";

export const metadata = {
  title: "Emergency Stop - OKRunit",
  description: "Emergency stop controls for the approval system.",
};

export default async function EmergencyPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership, org } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") redirect("/org/overview");

  return (
    <PageContainer className="max-w-2xl">
      <PageHeader
        title="Emergency Stop"
        description="Use the emergency stop to immediately cancel all pending approvals and block new requests."
      />

      <div className="space-y-6">
        <EmergencyStatus
          isActive={org.emergency_stop_active}
          activatedAt={org.emergency_stop_activated_at}
          activatedBy={org.emergency_stop_activated_by}
        />

        <EmergencyStopButton
          isActive={org.emergency_stop_active}
          orgId={org.id}
        />
      </div>
    </PageContainer>
  );
}

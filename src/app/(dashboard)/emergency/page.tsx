import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { EmergencyStopButton } from "@/components/emergency/emergency-stop-button";
import { EmergencyStatus } from "@/components/emergency/emergency-status";

export const metadata = {
  title: "Emergency Stop - Gatekeeper",
  description: "Emergency stop controls for the approval system.",
};

export default async function EmergencyPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership, org } = ctx;

  // Only admins and owners can access emergency controls.
  if (membership.role !== "owner" && membership.role !== "admin") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Emergency Stop</h1>
        <p className="text-muted-foreground mt-1">
          Use the emergency stop to immediately cancel all pending approvals and
          block new requests.
        </p>
      </div>

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
  );
}

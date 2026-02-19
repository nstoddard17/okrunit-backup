import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmergencyStopButton } from "@/components/emergency/emergency-stop-button";
import { EmergencyStatus } from "@/components/emergency/emergency-status";
import type { Organization, UserProfile } from "@/lib/types/database";

export const metadata = {
  title: "Emergency Stop - Gatekeeper",
  description: "Emergency stop controls for the approval system.",
};

export default async function EmergencyPage() {
  const supabase = await createClient();

  // Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile for org_id
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single<UserProfile>();

  if (!profile) {
    redirect("/login");
  }

  // Fetch organization data including emergency stop state
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.org_id)
    .single<Organization>();

  if (!org) {
    redirect("/login");
  }

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

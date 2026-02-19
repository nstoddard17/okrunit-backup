import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApprovalDashboard } from "@/components/approvals/approval-dashboard";
import type { ApprovalRequest, Connection, UserProfile } from "@/lib/types/database";

export const metadata = {
  title: "Dashboard - Gatekeeper",
  description: "View and manage approval requests.",
};

export default async function DashboardPage() {
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
    .select("org_id")
    .eq("id", user.id)
    .single<Pick<UserProfile, "org_id">>();

  if (!profile) {
    redirect("/login");
  }

  // Fetch approval requests: pending first, then by most recent
  const { data: approvals } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("org_id", profile.org_id)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<ApprovalRequest[]>();

  // Fetch connections for filter dropdown labels
  const { data: connections } = await supabase
    .from("connections")
    .select("*")
    .eq("org_id", profile.org_id)
    .eq("is_active", true)
    .order("name")
    .returns<Connection[]>();

  return (
    <ApprovalDashboard
      initialApprovals={approvals ?? []}
      connections={connections ?? []}
    />
  );
}

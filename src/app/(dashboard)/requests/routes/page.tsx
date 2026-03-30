import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RoutesHub } from "@/components/routes/routes-hub";
import type { ApprovalFlow, Team, UserProfile } from "@/lib/types/database";

export const metadata = {
  title: "Routes - OKrunit",
  description: "Configure approval flows and who must approve for each source.",
};

export default async function RoutesPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin")
    redirect("/requests");

  const supabase = await createClient();
  const admin = createAdminClient();

  const [
    { data: flows },
    { data: teams },
    { data: memberships },
  ] = await Promise.all([
    admin
      .from("approval_flows")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("last_request_at", { ascending: false, nullsFirst: false })
      .returns<ApprovalFlow[]>(),
    supabase
      .from("teams")
      .select("id, name")
      .eq("org_id", membership.org_id)
      .order("name")
      .returns<Pick<Team, "id" | "name">[]>(),
    admin
      .from("org_memberships")
      .select("user_id, role, can_approve")
      .eq("org_id", membership.org_id)
      .eq("can_approve", true),
  ]);

  const memberIds = (memberships ?? []).map((m: { user_id: string }) => m.user_id);
  const { data: profiles } = memberIds.length > 0
    ? await admin
        .from("user_profiles")
        .select("id, full_name, email")
        .in("id", memberIds)
        .returns<Pick<UserProfile, "id" | "full_name" | "email">[]>()
    : { data: [] as Pick<UserProfile, "id" | "full_name" | "email">[] };

  const members = (memberships ?? []).map((m: { user_id: string; role: string }) => {
    const profile = (profiles ?? []).find((p) => p.id === m.user_id);
    return {
      id: m.user_id,
      name: profile?.full_name || profile?.email || m.user_id,
      email: profile?.email || "",
      role: m.role,
    };
  });

  // Fetch position names for flows that use position-based approval
  const positionIds = (flows ?? [])
    .map((f) => f.assigned_position_id)
    .filter((id): id is string => id != null);

  let positionsMap: Record<string, string> = {};
  if (positionIds.length > 0) {
    const { data: positionRows } = await admin
      .from("team_positions")
      .select("id, name")
      .in("id", positionIds);
    if (positionRows) {
      positionsMap = Object.fromEntries(positionRows.map((p) => [p.id, p.name]));
    }
  }

  return (
    <RoutesHub
      flows={flows ?? []}
      teams={teams ?? []}
      members={members}
      orgId={membership.org_id}
      positionsMap={positionsMap}
    />
  );
}

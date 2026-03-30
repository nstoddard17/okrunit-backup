import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getOrgContext, getUserOrgs } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getOrgContext();

  if (!ctx) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/login?error=no_org");
    }

    redirect("/login");
  }

  const { profile, membership, org } = ctx;

  // Force users who haven't completed setup through the wizard.
  // Allow access to /setup itself to avoid a redirect loop.
  if (!profile.setup_completed_at) {
    const headerList = await headers();
    const pathname = headerList.get("x-pathname") || "";
    if (!pathname.startsWith("/setup")) {
      redirect("/setup");
    }
  }

  const admin = createAdminClient();
  const [userOrgs, { count: pendingCount }] = await Promise.all([
    getUserOrgs(profile.id),
    admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id)
      .eq("status", "pending"),
  ]);

  return (
    <DashboardShell
      sidebarProps={{
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        },
        currentOrgId: org.id,
        userOrgs,
        pendingCount: pendingCount ?? 0,
        userRole: membership.role,
        isAppAdmin: profile.is_app_admin,
      }}
      emergencyStopActive={org.emergency_stop_active}
      user={{
        email: profile.email,
        full_name: profile.full_name,
      }}
      orgName={org.name}
      pendingCount={pendingCount ?? 0}
      currentOrgId={org.id}
      userOrgs={userOrgs}
    >
      {children}
    </DashboardShell>
  );
}

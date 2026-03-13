import { redirect } from "next/navigation";
import { SidebarV2 } from "@/components/v2/layout/sidebar-v2";
import { HeaderV2 } from "@/components/v2/layout/header-v2";
import { getOrgContext, getUserOrgs } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardV2Layout({
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

  const userOrgs = await getUserOrgs(profile.id);

  const admin = createAdminClient();
  const { count: pendingCount } = await admin
    .from("approval_requests")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("status", "pending");

  return (
    <div className="gk-v2 force-light flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Sidebar: hidden on mobile, visible on md+ */}
      <div className="hidden md:flex">
        <SidebarV2
          user={{
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          }}
          currentOrgId={org.id}
          userOrgs={userOrgs}
          pendingCount={pendingCount ?? 0}
          userRole={membership.role}
          isAppAdmin={profile.is_app_admin}
        />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <HeaderV2 emergencyStopActive={org.emergency_stop_active} />
        <main className="flex-1 overflow-y-auto">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
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
      // User is authenticated but has no org membership
      redirect("/login?error=no_org");
    }

    redirect("/login");
  }

  const { profile, membership, org } = ctx;

  // Fetch user's org list for the switcher
  const userOrgs = await getUserOrgs(profile.id);

  // Fetch pending approval count for the active org
  const admin = createAdminClient();
  const { count: pendingCount } = await admin
    .from("approval_requests")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("status", "pending");

  return (
    <div className="force-light flex h-screen overflow-hidden bg-white text-zinc-950">
      {/* Sidebar: hidden on mobile, visible on md+ */}
      <div className="hidden md:flex">
        <Sidebar
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
        />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header emergencyStopActive={org.emergency_stop_active} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

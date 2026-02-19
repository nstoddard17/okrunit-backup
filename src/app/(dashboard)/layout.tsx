import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import type { Organization, UserProfile } from "@/lib/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single<UserProfile>();

  if (!profile) {
    redirect("/login");
  }

  // Fetch organization
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.org_id)
    .single<Organization>();

  if (!org) {
    redirect("/login");
  }

  // Fetch pending approval count
  const { count: pendingCount } = await supabase
    .from("approval_requests")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("status", "pending");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar: hidden on mobile, visible on md+ */}
      <div className="hidden md:flex">
        <Sidebar
          user={{
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          }}
          orgName={org.name}
          pendingCount={pendingCount ?? 0}
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

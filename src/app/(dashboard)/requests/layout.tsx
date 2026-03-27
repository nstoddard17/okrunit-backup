import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { RequestsNav } from "@/components/requests/requests-nav";

export default async function RequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership, org } = ctx;

  const isAdmin = membership.role === "owner" || membership.role === "admin";

  const admin = createAdminClient();
  const { count } = await admin
    .from("approval_requests")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("status", "pending");
  const pendingCount = count ?? 0;

  return (
    <div className="flex w-full flex-col md:flex-row md:min-h-[calc(100vh-52px)]">
      {/* Left sidebar — desktop */}
      <aside className="hidden md:block w-52 shrink-0 border-r border-border/40 bg-card pt-5">
        <RequestsNav isAdmin={isAdmin} pendingCount={pendingCount} />
      </aside>

      {/* Mobile nav — top dropdown */}
      <div className="md:hidden border-b border-border/40 bg-background px-4 py-3">
        <RequestsNav isAdmin={isAdmin} pendingCount={pendingCount} mobile />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

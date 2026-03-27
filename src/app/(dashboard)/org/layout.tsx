import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { V2OrgNav } from "@/components/org/v2-org-nav";

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership, org } = ctx;

  const isAdmin = membership.role === "owner" || membership.role === "admin";

  const admin = createAdminClient();

  let pendingInviteCount = 0;
  let planName: string | undefined;

  if (isAdmin) {
    const [inviteResult, subResult] = await Promise.all([
      admin
        .from("org_invites")
        .select("*", { count: "exact", head: true })
        .eq("org_id", membership.org_id)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString()),
      admin
        .from("subscriptions")
        .select("plan_id, status")
        .eq("org_id", org.id)
        .single(),
    ]);
    pendingInviteCount = inviteResult.count ?? 0;

    const planId = subResult.data?.plan_id ?? "free";
    const status = subResult.data?.status ?? "active";
    const label = planId.charAt(0).toUpperCase() + planId.slice(1);

    // Build descriptive badge: "Pro", "Pro (Trial)", "Pro (Past Due)", etc.
    const statusSuffix: Record<string, string> = {
      active: "",
      trialing: " (Trial)",
      past_due: " (Past Due)",
      cancelled: " (Cancelled)",
      expired: " (Expired)",
    };
    planName = label + (statusSuffix[status] ?? "");
  }

  return (
    <div className="flex w-full flex-col md:flex-row md:min-h-[calc(100vh-52px)]">
      {/* Left sidebar — desktop, sticks to top while content scrolls */}
      <aside className="hidden md:block w-56 shrink-0 border-r border-border/40 bg-[var(--card)]">
        <div className="sticky top-0 pt-5">
          <V2OrgNav isAdmin={isAdmin} pendingInviteCount={pendingInviteCount} planName={planName} />
        </div>
      </aside>

      {/* Mobile nav — top dropdown */}
      <div className="md:hidden border-b border-border/40 bg-background px-4 py-3">
        <V2OrgNav isAdmin={isAdmin} pendingInviteCount={pendingInviteCount} mobile />
      </div>

      {/* Main content — fills remaining space */}
      <main className="flex-1 min-w-0">
        <div className="px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

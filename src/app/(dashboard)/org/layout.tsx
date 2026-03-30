import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { V2OrgNav } from "@/components/org/v2-org-nav";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import type { BillingPlan } from "@/lib/types/database";

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
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("plan_id")
    .eq("org_id", org.id)
    .maybeSingle();

  const currentPlan = (subscription?.plan_id ?? "free") as BillingPlan;
  const planName = PLAN_LIMITS[currentPlan]?.name ?? "Free";

  return (
    <div className="flex w-full flex-col md:flex-row md:min-h-[calc(100vh-52px)]">
      {/* Left sidebar — desktop, sticks to top while content scrolls */}
      <aside className="hidden md:block w-56 shrink-0 border-r border-border/40 bg-[var(--card)]">
        <div className="sticky top-0 pt-5">
          <V2OrgNav isAdmin={isAdmin} pendingInviteCount={0} planName={planName} />
        </div>
      </aside>

      {/* Mobile nav — top dropdown */}
      <div className="md:hidden border-b border-border/40 bg-background px-4 py-3">
        <V2OrgNav isAdmin={isAdmin} pendingInviteCount={0} planName={planName} mobile />
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

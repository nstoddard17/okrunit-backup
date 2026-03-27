import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { BarChart3 } from "lucide-react";

export const metadata = {
  title: "Credit Usage - OKRunit",
  description: "View your organization's credit usage.",
};

export default async function OrgUsagePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { org, membership } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") redirect("/org/overview");

  const admin = createAdminClient();

  const [
    { count: requestsThisMonth },
    { count: connectionsCount },
    { count: membersCount },
  ] = await Promise.all([
    admin.from("approval_requests").select("*", { count: "exact", head: true }).eq("org_id", org.id).gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    admin.from("connections").select("*", { count: "exact", head: true }).eq("org_id", org.id).eq("is_active", true),
    admin.from("org_memberships").select("*", { count: "exact", head: true }).eq("org_id", org.id),
  ]);

  const stats = [
    { label: "Requests this month", value: requestsThisMonth ?? 0 },
    { label: "Active connections", value: connectionsCount ?? 0 },
    { label: "Team members", value: membersCount ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Credit Usage</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Current billing period usage overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border/50 p-5">
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-border/50 p-12 text-center">
        <BarChart3 className="size-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Detailed usage charts coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Usage breakdowns and historical data will appear here.</p>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { Receipt, Download } from "lucide-react";

export const metadata = {
  title: "Payments - OKRunit",
  description: "View your payment history and invoices.",
};

export default async function OrgPaymentsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { org, membership } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") redirect("/org/overview");

  const admin = createAdminClient();

  const { data: invoices } = await admin
    .from("invoices")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Payments</h2>
        <p className="text-sm text-muted-foreground mt-0.5">View your payment history and invoices.</p>
      </div>

      {invoices && invoices.length > 0 ? (
        <div className="rounded-xl border border-border/50 divide-y divide-border/40">
          {invoices.map((invoice: Record<string, unknown>) => (
            <div key={invoice.id as string} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium">
                  {new Date(invoice.created_at as string).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {invoice.status as string === "paid" ? "Paid" : (invoice.status as string)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">
                  ${((invoice.amount_cents as number ?? 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/50 p-12 text-center">
          <Receipt className="size-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No payments yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Your payment history will appear here.</p>
        </div>
      )}
    </div>
  );
}

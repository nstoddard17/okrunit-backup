"use client";

// ---------------------------------------------------------------------------
// OKrunit -- Admin Plan Override Tab
// Lets app admins set a plan override on any organization for testing.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Crown, Zap, Building2, Sparkles, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrgWithCounts } from "@/lib/admin-types";
import type { BillingPlan } from "@/lib/types/database";

interface PlanOverrideTabProps {
  organizations: OrgWithCounts[];
}

const PLAN_CONFIG: Record<BillingPlan, { label: string; icon: typeof Crown; color: string; bg: string }> = {
  free: { label: "Free", icon: Zap, color: "text-gray-600", bg: "bg-gray-100" },
  pro: { label: "Pro", icon: Sparkles, color: "text-blue-600", bg: "bg-blue-100" },
  business: { label: "Business", icon: Building2, color: "text-violet-600", bg: "bg-violet-100" },
  enterprise: { label: "Enterprise", icon: Crown, color: "text-amber-600", bg: "bg-amber-100" },
};

export function PlanOverrideTab({ organizations }: PlanOverrideTabProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const filtered = organizations.filter((org) => {
    const q = search.toLowerCase();
    return (
      org.name.toLowerCase().includes(q) ||
      org.owner_email?.toLowerCase().includes(q) ||
      org.owner_name?.toLowerCase().includes(q)
    );
  });

  async function handleOverrideChange(orgId: string, orgName: string, value: string) {
    const planOverride = value === "none" ? null : value;
    setSaving(orgId);
    try {
      const res = await fetch("/api/v1/admin/plan-override", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, plan_override: planOverride }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update");
      }
      toast.success(
        planOverride
          ? `${orgName} overridden to ${PLAN_CONFIG[planOverride as BillingPlan].label}`
          : `${orgName} override cleared`,
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update plan override");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Plan Overrides</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Override an org&apos;s billing plan for testing. Overrides bypass the subscription and take effect immediately.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-[200px] pl-8 text-sm bg-white"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center rounded-xl border py-16 text-center">
          <p className="text-sm">
            {search ? "No organizations match your search." : "No organizations found."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Override</TableHead>
                <TableHead>Set Override</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((org) => {
                const override = (org as OrgWithCounts & { plan_override?: string | null }).plan_override as BillingPlan | null;
                const config = override ? PLAN_CONFIG[override] : null;
                const PlanIcon = config?.icon;

                return (
                  <TableRow key={org.id}>
                    <TableCell>
                      <span className="font-medium">{org.name}</span>
                    </TableCell>
                    <TableCell>
                      {org.owner_name || org.owner_email ? (
                        <div className="min-w-0">
                          {org.owner_name && (
                            <p className="text-sm truncate">{org.owner_name}</p>
                          )}
                          {org.owner_email && (
                            <p className="text-xs text-muted-foreground truncate">{org.owner_email}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No owner</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const subPlan = org.subscription_plan as BillingPlan | null;
                        const subConfig = subPlan ? PLAN_CONFIG[subPlan] : null;
                        const SubIcon = subConfig?.icon;
                        return subPlan && subConfig && SubIcon ? (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className={`gap-1 ${subConfig.color}`}>
                              <SubIcon className="size-3" />
                              {subConfig.label}
                            </Badge>
                            {org.subscription_status && org.subscription_status !== "active" && (
                              <span className="text-[10px] text-muted-foreground capitalize">({org.subscription_status})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No subscription</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {override && config && PlanIcon ? (
                        <Badge variant="outline" className={`gap-1 ${config.color}`}>
                          <PlanIcon className="size-3" />
                          {config.label}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">None (uses subscription)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={override ?? "none"}
                        onValueChange={(v) => handleOverrideChange(org.id, org.name, v)}
                        disabled={saving === org.id}
                      >
                        <SelectTrigger className="w-[160px] h-8 text-xs bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No override</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {override && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOverrideChange(org.id, org.name, "none")}
                          disabled={saving === org.id}
                          title="Clear override"
                        >
                          <X className="size-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

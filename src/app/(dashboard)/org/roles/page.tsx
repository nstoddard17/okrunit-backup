import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomRolesManager } from "@/components/org/custom-roles-manager";
import type { CustomRole } from "@/lib/types/database";

export const metadata = {
  title: "Custom Roles - OKrunit",
  description: "Define custom roles for your organization.",
};

export default async function CustomRolesPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") {
    redirect("/org/overview");
  }

  const admin = createAdminClient();
  const { data: roles } = await admin
    .from("custom_roles")
    .select("*")
    .eq("org_id", membership.org_id)
    .order("name")
    .returns<CustomRole[]>();

  return <CustomRolesManager initialRoles={roles ?? []} />;
}

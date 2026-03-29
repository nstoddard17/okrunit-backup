import { getAdminData } from "@/lib/admin-data";
import { PlanOverrideTab } from "@/components/admin/plan-override-tab";

export const metadata = {
  title: "Plan Overrides - Admin - OKRunit",
};

export default async function AdminPlanOverridesPage() {
  const { organizations } = await getAdminData();

  return <PlanOverrideTab organizations={organizations} />;
}

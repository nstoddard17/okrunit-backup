import { getAdminData } from "@/lib/admin-data";
import { OverviewTab } from "@/components/admin/overview-tab";

export const metadata = {
  title: "Overview - Admin - OKrunit",
};

export default async function AdminOverviewPage() {
  const { organizations, systemStats } = await getAdminData();

  return <OverviewTab stats={systemStats} organizations={organizations} />;
}

import { getAdminData } from "@/lib/admin-data";
import { OrganizationsTab } from "@/components/admin/organizations-tab";

export const metadata = {
  title: "Organizations - Admin - OKrunit",
};

export default async function AdminOrganizationsPage() {
  const { organizations } = await getAdminData();

  return <OrganizationsTab organizations={organizations} />;
}

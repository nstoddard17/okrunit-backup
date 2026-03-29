import { getAdminData } from "@/lib/admin-data";
import { UsersTab } from "@/components/admin/users-tab";

export const metadata = {
  title: "Users - Admin - OKRunit",
};

export default async function AdminUsersPage() {
  const { organizations, users } = await getAdminData();

  return <UsersTab users={users} organizations={organizations} />;
}

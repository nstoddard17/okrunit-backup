import { redirect } from "next/navigation";
import { getAppAdminContext } from "@/lib/app-admin";
import { EmailPreviewClient } from "@/components/admin/email-preview-client";

export const metadata = {
  title: "Email Previews - OKRunit Admin",
  description: "Preview all email templates with sample data.",
};

export default async function EmailPreviewsPage() {
  const profile = await getAppAdminContext();
  if (!profile) redirect("/org/overview");

  return <EmailPreviewClient />;
}

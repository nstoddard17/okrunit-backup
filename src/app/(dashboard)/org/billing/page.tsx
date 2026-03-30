import { redirect } from "next/navigation";

export const metadata = {
  title: "Subscription - OKrunit",
  description: "Manage your subscription and billing.",
};

export default function OrgBillingPage() {
  redirect("/org/subscription");
}

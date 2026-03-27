import { redirect } from "next/navigation";

// Redirect old /emergency URL to the Safety tab in Settings
export default function EmergencyPage() {
  redirect("/settings?tab=safety");
}

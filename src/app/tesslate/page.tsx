import { createClient } from "@/lib/supabase/server";
import { TesslateHero } from "@/components/landing/tesslate-hero";

export const metadata = {
  title: "Gatekeeper - Human Approval for Every Automation",
  description:
    "Universal approval gateway for AI agents and automation platforms. Get human approval before destructive actions execute.",
};

export default async function TesslatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <TesslateHero
      user={
        user
          ? {
              email: user.email ?? "",
              full_name: user.user_metadata?.full_name ?? null,
            }
          : null
      }
    />
  );
}

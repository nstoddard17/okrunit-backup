import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/landing/hero";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Hero
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

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SiteFooter } from "@/components/marketing/site-footer";
import { MarketingSiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: {
    default: "Company & Trust",
    template: "%s | OKRunit",
  },
};

export default async function MarketingPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingSiteHeader
        user={
          user
            ? {
                email: user.email ?? "",
                full_name: user.user_metadata?.full_name ?? null,
              }
            : null
        }
      />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

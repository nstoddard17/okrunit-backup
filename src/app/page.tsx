import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";
import {
  OrganizationJsonLd,
  SoftwareAppJsonLd,
  WebsiteJsonLd,
  FAQJsonLd,
} from "@/components/seo/json-ld";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://okrunit.com",
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <OrganizationJsonLd />
      <SoftwareAppJsonLd />
      <WebsiteJsonLd />
      <FAQJsonLd />
      <LandingPage
        user={
          user
            ? {
                email: user.email ?? "",
                full_name: user.user_metadata?.full_name ?? null,
              }
            : null
        }
      />
    </>
  );
}

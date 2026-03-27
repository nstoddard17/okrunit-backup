import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildWelcomeEmailHtml } from "@/lib/email/welcome";

const FROM_EMAIL = process.env.EMAIL_FROM || "OKRunit <noreply@okrunit.com>";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const inviteToken = searchParams.get("invite");

  if (!code) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "Missing authorization code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(loginUrl);
  }

  // Send welcome email on first sign-in (when profile doesn't exist yet)
  const { data: { user } } = await supabase.auth.getUser();
  if (user && process.env.RESEND_API_KEY) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    // Only send welcome email if this is a new user (no profile yet)
    if (!profile) {
      try {
        const fullName = user.user_metadata?.full_name || "there";
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email!,
          subject: "Welcome to OKRunit!",
          html: buildWelcomeEmailHtml({ fullName }),
        });
      } catch (err) {
        console.error("[Auth] Failed to send welcome email:", err);
      }
    }
  }

  // If there's an invite token, route through the invite acceptance page
  // which handles email verification, profile creation, and org membership.
  if (inviteToken) {
    return NextResponse.redirect(new URL(`/invite/${inviteToken}`, origin));
  }

  return NextResponse.redirect(new URL("/org/overview", origin));
}

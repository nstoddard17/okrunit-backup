import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // If there's an invite token, route through the invite acceptance page
  // which handles email verification, profile creation, and org membership.
  if (inviteToken) {
    return NextResponse.redirect(new URL(`/invite/${inviteToken}`, origin));
  }

  return NextResponse.redirect(new URL("/dashboard", origin));
}

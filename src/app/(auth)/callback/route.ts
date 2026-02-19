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

  const redirectUrl = new URL("/dashboard", origin);
  if (inviteToken) {
    redirectUrl.searchParams.set("invite", inviteToken);
  }

  return NextResponse.redirect(redirectUrl);
}

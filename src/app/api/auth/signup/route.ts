// ---------------------------------------------------------------------------
// Gatekeeper -- Custom Sign-Up Route
// ---------------------------------------------------------------------------
// Creates the user via Supabase admin, then sends a branded confirmation
// email through Resend instead of Supabase's default plain-text email.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

import { createAdminClient } from "@/lib/supabase/admin";
import { buildConfirmEmailHtml } from "@/lib/email/confirm";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const FROM_EMAIL =
  process.env.EMAIL_FROM || "Gatekeeper <noreply@gatekeeper.app>";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  inviteToken: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await request.json());
    const admin = createAdminClient();

    // Build the redirect URL for after email confirmation.
    const redirectTo = new URL("/callback", APP_URL);
    if (body.inviteToken) {
      redirectTo.searchParams.set("invite", body.inviteToken);
    }

    // Generate a sign-up confirmation link via Supabase admin.
    // This creates the user in auth.users WITHOUT sending Supabase's default
    // email, giving us control over the email content.
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "signup",
        email: body.email,
        password: body.password,
        options: {
          data: { full_name: body.fullName },
          redirectTo: redirectTo.toString(),
        },
      });

    if (linkError) {
      // Handle duplicate email gracefully.
      if (
        linkError.message?.includes("already been registered") ||
        linkError.message?.includes("already exists")
      ) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 },
        );
      }
      console.error("[Auth] generateLink error:", linkError);
      return NextResponse.json(
        { error: linkError.message || "Failed to create account" },
        { status: 400 },
      );
    }

    // The generated link contains the OTP token. We extract it and build our
    // own confirmation URL that points to our callback.
    const confirmLink =
      linkData.properties?.action_link ?? "";

    // Send the branded confirmation email via Resend.
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const html = buildConfirmEmailHtml({
          fullName: body.fullName,
          confirmLink,
        });

        const { error: emailError } = await resend.emails.send({
          from: FROM_EMAIL,
          to: body.email,
          subject: "Confirm your Gatekeeper account",
          html,
        });

        if (emailError) {
          console.error("[Auth] Resend API error:", emailError);
        }
      } catch (emailErr) {
        console.error("[Auth] Failed to send confirmation email:", emailErr);
      }
    } else {
      console.warn(
        "[Auth] RESEND_API_KEY is not set -- skipping confirmation email for:",
        body.email,
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("[Auth] Unexpected signup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

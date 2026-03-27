// ---------------------------------------------------------------------------
// OKRunit -- SAML Login Initiator
// ---------------------------------------------------------------------------
// GET /api/auth/saml/login?email=user@company.com
//
// Looks up the SSO config for the user's email domain, creates a SAML
// AuthnRequest, and redirects to the IdP's SSO URL.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import * as samlify from "samlify";
import {
  createServiceProvider,
  createIdentityProvider,
  findSSOConfigByEmail,
} from "@/lib/saml/provider";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.redirect(
      new URL("/login?error=sso_email_required", request.url),
    );
  }

  const config = await findSSOConfigByEmail(email);

  if (!config) {
    return NextResponse.redirect(
      new URL("/login?error=sso_not_configured", request.url),
    );
  }

  const sp = createServiceProvider();
  const idp = createIdentityProvider(config);

  const loginRequest = sp.createLoginRequest(
    idp,
    samlify.Constants.namespace.binding.redirect,
  );

  // loginRequest has { id, context } where context is the redirect URL
  return NextResponse.redirect(loginRequest.context);
}

// ---------------------------------------------------------------------------
// OKRunit -- SAML SP Metadata Endpoint
// ---------------------------------------------------------------------------
// GET /api/auth/saml/metadata
//
// Returns the SAML Service Provider metadata XML. Identity providers use this
// to configure OKRunit as a service provider.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createServiceProvider } from "@/lib/saml/provider";

export async function GET() {
  const sp = createServiceProvider();
  const metadata = sp.getMetadata();

  return new NextResponse(metadata, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

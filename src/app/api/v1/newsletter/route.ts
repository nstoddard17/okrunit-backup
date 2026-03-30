// ---------------------------------------------------------------------------
// OKrunit -- Newsletter Subscription API
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkIpRateLimit, getClientIp, rateLimitResponse } from "@/lib/api/ip-rate-limiter";

const NEWSLETTER_RATE_LIMIT = { limit: 5, windowSeconds: 60 };

const subscribeSchema = z.object({
  email: z.string().email().max(255),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkIpRateLimit(`newsletter:${ip}`, NEWSLETTER_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl);

  try {
    const body = await request.json();
    const { email } = subscribeSchema.parse(body);

    const admin = createAdminClient();
    await admin
      .from("newsletter_subscribers")
      .upsert({ email, source: "landing_page" }, { onConflict: "email" });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

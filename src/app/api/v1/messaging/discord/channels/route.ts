// ---------------------------------------------------------------------------
// OKrunit -- List Discord Guild Channels
// ---------------------------------------------------------------------------
// GET /api/v1/messaging/discord/channels?connection_id=xxx
//
// Returns text channels for the guild associated with a Discord connection,
// so the user can pick which channel to send notifications to.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/api/auth";
import { ApiError, errorResponse } from "@/lib/api/errors";
import { createAdminClient } from "@/lib/supabase/admin";

const DISCORD_API_BASE = "https://discord.com/api/v10";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.type !== "session") {
      throw new ApiError(401, "Session required");
    }

    const url = new URL(request.url);
    const connectionId = url.searchParams.get("connection_id");
    if (!connectionId) {
      throw new ApiError(400, "Missing connection_id");
    }

    const admin = createAdminClient();
    const { data: connection } = await admin
      .from("messaging_connections")
      .select("id, org_id, platform, bot_token, workspace_id")
      .eq("id", connectionId)
      .eq("org_id", auth.orgId)
      .eq("platform", "discord")
      .single();

    if (!connection) {
      throw new ApiError(404, "Discord connection not found");
    }

    if (!connection.bot_token || !connection.workspace_id) {
      throw new ApiError(400, "Missing bot token or guild ID");
    }

    // Try the dedicated bot token first, then the OAuth token with both auth types
    const tokensToTry = [
      ...(process.env.DISCORD_BOT_TOKEN ? [`Bot ${process.env.DISCORD_BOT_TOKEN}`] : []),
      `Bot ${connection.bot_token}`,
      `Bearer ${connection.bot_token}`,
    ];

    let allChannels: Array<{ id: string; name: string; type: number; position: number }> = [];

    for (const authHeader of tokensToTry) {
      const response = await fetch(
        `${DISCORD_API_BASE}/guilds/${connection.workspace_id}/channels`,
        { headers: { Authorization: authHeader } },
      );

      if (response.ok) {
        allChannels = await response.json();
        break;
      } else {
        console.log("[Discord Channels] Failed with", authHeader.split(" ")[0], "auth:", response.status);
      }
    }

    if (allChannels.length === 0) {
      console.error("[Discord Channels] Could not fetch channels for guild:", connection.workspace_id);
      throw new ApiError(502, "Failed to fetch Discord channels. Ensure DISCORD_BOT_TOKEN is set or the bot has guild access.");
    }

    // Only return text channels (type 0) sorted by position
    const textChannels = allChannels
      .filter((c) => c.type === 0)
      .sort((a, b) => a.position - b.position)
      .map((c) => ({ id: c.id, name: c.name }));

    return NextResponse.json({ channels: textChannels });
  } catch (err) {
    return errorResponse(err);
  }
}

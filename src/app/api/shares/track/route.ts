import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { facilityId, platform, context } = await req.json();

    if (!facilityId || !platform) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Log share events for analytics (server logs are parseable by log aggregation)
    console.log(
      JSON.stringify({
        event: "share",
        facilityId,
        platform,
        context: context || "unknown",
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

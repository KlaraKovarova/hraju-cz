import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { getUserBadges } from "@/lib/challenges";

// GET /api/auth/my-badges — list earned badges for current user
export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const badges = await getUserBadges(session.userId);
    return NextResponse.json({ badges });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

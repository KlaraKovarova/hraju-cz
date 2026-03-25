import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { getUserBadgeProgress } from "@/lib/challenges";

// GET /api/auth/my-badges/progress — badge progress for current user
export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const progress = await getUserBadgeProgress(session.userId);
    return NextResponse.json({ progress });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

// POST /api/facilities/[id]/reviews/[reviewId]/flag — flag a review for moderation
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { reviewId } = await params;

  try {
    // Flag the review and revoke approval (trusted user loses auto-publish)
    await prisma.review.update({
      where: { id: reviewId, isApproved: true },
      data: { flagged: true, isApproved: false },
    });
    return NextResponse.json({ flagged: true });
  } catch {
    return NextResponse.json({ error: "Recenze nenalezena." }, { status: 404 });
  }
}

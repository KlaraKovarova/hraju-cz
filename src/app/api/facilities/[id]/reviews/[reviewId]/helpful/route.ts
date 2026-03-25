import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkBadgesByCategory } from "@/lib/challenges";

// POST /api/facilities/[id]/reviews/[reviewId]/helpful — increment helpful count
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const { reviewId } = await params;

  try {
    const review = await prisma.review.update({
      where: { id: reviewId, isApproved: true },
      data: { helpful: { increment: 1 } },
      select: { helpful: true, userId: true },
    });

    // Check Průvodce badge for the review author (fire-and-forget)
    if (review.userId) {
      checkBadgesByCategory(review.userId, "community").catch(() => {});
    }

    return NextResponse.json({ helpful: review.helpful });
  } catch {
    return NextResponse.json({ error: "Recenze nenalezena." }, { status: 404 });
  }
}

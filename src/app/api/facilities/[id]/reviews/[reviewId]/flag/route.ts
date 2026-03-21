import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/facilities/[id]/reviews/[reviewId]/flag — flag a review for moderation
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const { reviewId } = await params;

  try {
    await prisma.review.update({
      where: { id: reviewId, isApproved: true },
      data: { flagged: true },
    });
    return NextResponse.json({ flagged: true });
  } catch {
    return NextResponse.json({ error: "Recenze nenalezena." }, { status: 404 });
  }
}

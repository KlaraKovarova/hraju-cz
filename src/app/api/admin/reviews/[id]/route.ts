import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/reviews/[id] — approve or reject a review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action } = body;
  if (action !== "approve" && action !== "reject" && action !== "revoke") {
    return NextResponse.json({ error: "Action must be 'approve', 'reject', or 'revoke'." }, { status: 400 });
  }

  const review = await prisma.review.findUnique({
    where: { id },
    select: { id: true, facilityId: true, isApproved: true },
  });
  if (!review) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  if (action === "approve") {
    // Approve the review
    await prisma.review.update({
      where: { id },
      data: { isApproved: true },
    });

    // Recalculate facility averageRating and reviewCount
    const stats = await prisma.review.aggregate({
      where: { facilityId: review.facilityId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.facility.update({
      where: { id: review.facilityId },
      data: {
        averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : null,
        reviewCount: stats._count.rating,
      },
    });
  } else if (action === "revoke") {
    // Revoke approval
    await prisma.review.update({
      where: { id },
      data: { isApproved: false },
    });

    // Recalculate facility averageRating and reviewCount
    const stats = await prisma.review.aggregate({
      where: { facilityId: review.facilityId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.facility.update({
      where: { id: review.facilityId },
      data: {
        averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : null,
        reviewCount: stats._count.rating,
      },
    });
  } else {
    // Reject = delete the review
    await prisma.review.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}

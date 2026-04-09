import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkBadgesByCategory } from "@/lib/challenges";
import { createNotification } from "@/lib/notifications";
import { getUserSession } from "@/lib/user-auth";

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
      select: {
        helpful: true,
        userId: true,
        facility: {
          select: {
            name: true,
            slug: true,
            sports: { select: { sport: { select: { slug: true } } }, take: 1 },
          },
        },
      },
    });

    // Check Průvodce badge for the review author (fire-and-forget)
    if (review.userId) {
      checkBadgesByCategory(review.userId, "community").catch(() => {});
    }

    // Notify review author about the helpful vote (fire-and-forget)
    if (review.userId) {
      notifyHelpfulVote(review.userId, review.facility).catch(() => {});
    }

    return NextResponse.json({ helpful: review.helpful });
  } catch {
    return NextResponse.json({ error: "Recenze nenalezena." }, { status: 404 });
  }
}

async function notifyHelpfulVote(
  reviewAuthorId: string,
  facility: { name: string; slug: string; sports: { sport: { slug: string } }[] }
) {
  // Don't notify if the voter is the review author
  const session = await getUserSession().catch(() => null);
  if (session?.userId === reviewAuthorId) return;

  // Debounce: skip if a helpful_vote notification was sent for this user in the last 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recent = await prisma.notification.findFirst({
    where: {
      userId: reviewAuthorId,
      type: "helpful_vote",
      createdAt: { gte: tenMinutesAgo },
    },
  });
  if (recent) return;

  const sportSlug = facility.sports[0]?.sport.slug;
  const linkUrl = sportSlug
    ? `/sport/${sportSlug}/${facility.slug}#recenze`
    : `/${facility.slug}#recenze`;

  await createNotification(reviewAuthorId, "helpful_vote", "Vaše recenze byla označena jako užitečná", {
    body: facility.name,
    linkUrl,
    icon: "👍",
  });
}

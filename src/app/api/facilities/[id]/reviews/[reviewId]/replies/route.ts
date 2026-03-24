import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";
import { sendReviewReplyNotificationEmail } from "@/lib/email";
import { getUnsubscribeToken, buildUnsubscribeUrl } from "@/lib/notifications";

// GET /api/facilities/[id]/reviews/[reviewId]/replies
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const { reviewId } = await params;

  const replies = await prisma.reviewReply.findMany({
    where: { reviewId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      userId: true,
      body: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  return NextResponse.json({
    replies: replies.map((r) => ({
      id: r.id,
      userId: r.userId,
      authorName: r.user.name || "Uživatel",
      body: r.body,
      createdAt: r.createdAt,
    })),
  });
}

// POST /api/facilities/[id]/reviews/[reviewId]/replies
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const { id: facilityId, reviewId } = await params;

  const session = await getUserSession();
  if (!session) {
    return NextResponse.json(
      { error: "Pro odpověď se musíte přihlásit." },
      { status: 401 }
    );
  }

  let body: { body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = body.body?.trim();
  if (!text || text.length < 2) {
    return NextResponse.json(
      { error: "Odpověď musí mít alespoň 2 znaky." },
      { status: 400 }
    );
  }
  if (text.length > 1000) {
    return NextResponse.json(
      { error: "Odpověď může mít maximálně 1000 znaků." },
      { status: 400 }
    );
  }

  // Verify the review exists and is approved
  const review = await prisma.review.findFirst({
    where: { id: reviewId, facilityId, isApproved: true },
    select: {
      id: true,
      userId: true,
      authorName: true,
      authorEmail: true,
      facility: {
        select: {
          name: true,
          slug: true,
          sports: { select: { sport: { select: { slug: true } } }, take: 1 },
        },
      },
    },
  });
  if (!review) {
    return NextResponse.json(
      { error: "Recenze nenalezena." },
      { status: 404 }
    );
  }

  // Rate limit: max 10 replies per user per day
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dailyCount = await prisma.reviewReply.count({
    where: {
      userId: session.userId,
      createdAt: { gte: dayStart },
    },
  });
  if (dailyCount >= 10) {
    return NextResponse.json(
      { error: "Překročen denní limit odpovědí. Zkuste to zítra." },
      { status: 429 }
    );
  }

  const reply = await prisma.reviewReply.create({
    data: {
      reviewId,
      userId: session.userId,
      body: text,
    },
    select: {
      id: true,
      userId: true,
      body: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  // Increment reply count on the review
  await prisma.review.update({
    where: { id: reviewId },
    data: { replyCount: { increment: 1 } },
  });

  // Notify review author if someone else replied (fire-and-forget)
  if (review.userId && review.userId !== session.userId) {
    const replierName = session.name || session.email.split("@")[0];
    const sportSlug = review.facility.sports[0]?.sport.slug || "tenis";
    const facilityUrl = `https://www.hraju.cz/sport/${sportSlug}/${review.facility.slug}`;

    getUnsubscribeToken(review.userId)
      .then((token) => {
        const unsubUrl = buildUnsubscribeUrl(token, "all");
        return sendReviewReplyNotificationEmail(
          review.authorEmail,
          review.authorName,
          replierName,
          text,
          review.facility.name,
          facilityUrl,
          unsubUrl
        );
      })
      .catch(() => {});
  }

  return NextResponse.json(
    {
      id: reply.id,
      userId: reply.userId,
      authorName: reply.user.name || "Uživatel",
      body: reply.body,
      createdAt: reply.createdAt,
    },
    { status: 201 }
  );
}

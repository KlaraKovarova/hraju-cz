import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReviewNotificationEmail, sendNewReviewOnFacilityEmail } from "@/lib/email";
import { getUserSession } from "@/lib/user-auth";
import { findUsersToNotifyAboutReview, getUnsubscribeToken, buildUnsubscribeUrl, createFavoriteNotifications } from "@/lib/notifications";
import { checkBadgesByCategory, getBadgeDefinition } from "@/lib/challenges";
import { BADGE_META } from "@/lib/badge-meta";

// GET /api/facilities/[id]/reviews — list approved reviews (paginated, newest first)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
  const sort = searchParams.get("sort") || "newest";

  const orderBy: Record<string, string> =
    sort === "highest" ? { rating: "desc" } :
    sort === "lowest" ? { rating: "asc" } :
    sort === "oldest" ? { createdAt: "asc" } :
    sort === "helpful" ? { helpful: "desc" } :
    { createdAt: "desc" };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { facilityId: id, isApproved: true },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        userId: true,
        authorName: true,
        rating: true,
        title: true,
        text: true,
        helpful: true,
        replyCount: true,
        createdAt: true,
        photos: {
          where: { isHidden: false },
          select: { id: true, url: true, alt: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.review.count({ where: { facilityId: id, isApproved: true } }),
  ]);

  // Batch-fetch badges for all review authors
  const userIds = [...new Set(reviews.map((r) => r.userId).filter(Boolean))] as string[];
  const userBadges = userIds.length > 0
    ? await prisma.userBadge.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, badgeSlug: true },
      })
    : [];
  const badgesByUser = new Map<string, { slug: string; emoji: string; name: string }[]>();
  for (const ub of userBadges) {
    const meta = BADGE_META[ub.badgeSlug];
    if (!meta) continue;
    if (!badgesByUser.has(ub.userId)) badgesByUser.set(ub.userId, []);
    badgesByUser.get(ub.userId)!.push({ slug: ub.badgeSlug, emoji: meta.emoji, name: meta.name });
  }

  const reviewsWithBadges = reviews.map((r) => ({
    ...r,
    badges: r.userId ? badgesByUser.get(r.userId) || [] : [],
  }));

  return NextResponse.json({ reviews: reviewsWithBadges, total, page, limit });
}

// POST /api/facilities/[id]/reviews — submit a review (requires user auth)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Require user authentication
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json(
      { error: "Pro přidání recenze se musíte přihlásit." },
      { status: 401 }
    );
  }

  let body: { rating?: number; title?: string; text?: string; photoIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { rating, title, text, photoIds } = body;

  // Use session data for author info
  const authorName = session.name || session.email.split("@")[0];
  const authorEmail = session.email;

  // Validation
  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: "Hodnocení musí být 1–5." }, { status: 400 });
  }

  // Check facility exists and get details for notification
  const facility = await prisma.facility.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      contacts: { where: { type: "EMAIL" }, select: { value: true }, take: 1 },
      sports: { select: { sport: { select: { slug: true } } }, take: 1 },
    },
  });
  if (!facility) {
    return NextResponse.json({ error: "Sportoviště nenalezeno." }, { status: 404 });
  }

  // Rate limit: 1 per user per facility
  const existing = await prisma.review.findFirst({
    where: { facilityId: id, userId: session.userId },
  });
  if (existing) {
    return NextResponse.json({ error: "Toto sportoviště jste již hodnotili." }, { status: 409 });
  }

  // Fallback: also check by email (for pre-auth reviews)
  const existingByEmail = await prisma.review.findFirst({
    where: { facilityId: id, authorEmail },
  });
  if (existingByEmail) {
    return NextResponse.json({ error: "Toto sportoviště jste již hodnotili." }, { status: 409 });
  }

  // Rate limit: max 5 reviews per user per day
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dailyCount = await prisma.review.count({
    where: {
      userId: session.userId,
      createdAt: { gte: dayStart },
    },
  });
  if (dailyCount >= 5) {
    return NextResponse.json({ error: "Překročen denní limit recenzí. Zkuste to zítra." }, { status: 429 });
  }

  const review = await prisma.review.create({
    data: {
      facilityId: id,
      userId: session.userId,
      authorName: authorName.trim(),
      authorEmail: authorEmail.toLowerCase().trim(),
      rating,
      title: title?.trim() || null,
      text: text?.trim() || null,
    },
  });

  // Link uploaded photos to the review
  if (photoIds && Array.isArray(photoIds) && photoIds.length > 0) {
    await prisma.userPhoto.updateMany({
      where: {
        id: { in: photoIds.slice(0, 3) },
        userId: session.userId,
        facilityId: id,
        reviewId: null,
      },
      data: { reviewId: review.id },
    });
  }

  // Notify facility owner by email (fire-and-forget)
  const ownerEmail = facility.contacts[0]?.value;
  if (ownerEmail) {
    const sportSlug = facility.sports[0]?.sport.slug || "tenis";
    const facilityUrl = `https://www.hraju.cz/sport/${sportSlug}/${facility.slug}`;
    sendReviewNotificationEmail(
      ownerEmail,
      facility.name,
      rating,
      text?.trim() || null,
      facilityUrl
    ).then(async (sent) => {
      if (sent) {
        await prisma.review.update({
          where: { id: review.id },
          data: { ownerNotifiedAt: new Date() },
        }).catch(() => {});
      }
    }).catch(() => {});
  }

  // Notify users who checked in or reviewed this facility (fire-and-forget)
  findUsersToNotifyAboutReview(id, session.userId).then(async (users) => {
    const sportSlug = facility.sports[0]?.sport.slug || "tenis";
    const facilityUrl = `https://www.hraju.cz/sport/${sportSlug}/${facility.slug}`;
    for (const user of users) {
      try {
        const token = await getUnsubscribeToken(user.id);
        const unsubUrl = buildUnsubscribeUrl(token, "all");
        await sendNewReviewOnFacilityEmail(
          user.email,
          user.name,
          facility.name,
          authorName.trim(),
          rating,
          text?.trim() || null,
          facilityUrl,
          unsubUrl
        );
      } catch {
        // fire-and-forget, don't block
      }
    }
  }).catch(() => {});

  // Create in-app notifications for users who favorited this facility (fire-and-forget)
  createFavoriteNotifications(id, session.userId, "review", authorName.trim()).catch(() => {});

  // Check for newly earned review/community/streak badges
  let newBadges: { slug: string; name: string; emoji: string }[] = [];
  try {
    const [reviewBadges, communityBadges, streakBadges] = await Promise.all([
      checkBadgesByCategory(session.userId, "review"),
      checkBadgesByCategory(session.userId, "community"),
      checkBadgesByCategory(session.userId, "streak"),
    ]);
    newBadges = [...reviewBadges, ...communityBadges, ...streakBadges]
      .map((slug) => {
        const def = getBadgeDefinition(slug);
        return def ? { slug: def.slug, name: def.name, emoji: def.emoji } : null;
      })
      .filter((b): b is { slug: string; name: string; emoji: string } => b !== null);
  } catch {
    // Badge check failure shouldn't block the review
  }

  return NextResponse.json({ id: review.id, message: "Děkujeme za recenzi! Bude zobrazena po schválení.", newBadges }, { status: 201 });
}

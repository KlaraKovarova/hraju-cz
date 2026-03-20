import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReviewNotificationEmail } from "@/lib/email";
import { getUserSession } from "@/lib/user-auth";

// GET /api/facilities/[id]/reviews — list approved reviews (paginated, newest first)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { facilityId: id, isApproved: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        authorName: true,
        rating: true,
        text: true,
        createdAt: true,
      },
    }),
    prisma.review.count({ where: { facilityId: id, isApproved: true } }),
  ]);

  return NextResponse.json({ reviews, total, page, limit });
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

  let body: { rating?: number; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { rating, text } = body;

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
      text: text?.trim() || null,
    },
  });

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

  return NextResponse.json({ id: review.id, message: "Děkujeme za recenzi! Bude zobrazena po schválení." }, { status: 201 });
}

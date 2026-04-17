import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";
import {
  TRIP_REPORT_MAX_PHOTOS,
  TRIP_REPORT_PAGE_SIZE,
  TRIP_REPORT_RATE_LIMIT_PER_HOUR,
  TRIP_REPORT_RATE_LIMIT_WINDOW_MS,
  validateTripReportInput,
} from "@/lib/trip-reports";
import { checkBadgesByCategory } from "@/lib/challenges";

// GET /api/facilities/[id]/trip-reports?limit=20&cursor=...
// Returns non-hidden reports newest first. Cursor = last seen id for keyset pagination.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || String(TRIP_REPORT_PAGE_SIZE), 10))
  );
  const cursor = searchParams.get("cursor");

  const reports = await prisma.tripReport.findMany({
    where: { facilityId: id, isHidden: false },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      dateClimbed: true,
      durationMinutes: true,
      gradeText: true,
      partnersText: true,
      beta: true,
      weatherNote: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
      photos: {
        where: { isHidden: false },
        select: { id: true, url: true, alt: true },
        orderBy: { createdAt: "asc" },
        take: 3,
      },
    },
  });

  const hasMore = reports.length > limit;
  const page = hasMore ? reports.slice(0, limit) : reports;
  const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

  return NextResponse.json({ reports: page, nextCursor });
}

// POST /api/facilities/[id]/trip-reports — submit a trip report (auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getUserSession();
  if (!session) {
    return NextResponse.json(
      { error: "Pro přidání záznamu se musíte přihlásit." },
      { status: 401 }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = validateTripReportInput(raw);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error.message, field: parsed.error.field }, { status: 400 });
  }
  const input = parsed.value;

  const facility = await prisma.facility.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!facility) {
    return NextResponse.json({ error: "Sportoviště nenalezeno." }, { status: 404 });
  }

  // Rate limit: max N trip reports per user per hour (site-wide, not per-facility).
  const windowStart = new Date(Date.now() - TRIP_REPORT_RATE_LIMIT_WINDOW_MS);
  const recentCount = await prisma.tripReport.count({
    where: { userId: session.userId, createdAt: { gte: windowStart } },
  });
  if (recentCount >= TRIP_REPORT_RATE_LIMIT_PER_HOUR) {
    return NextResponse.json(
      { error: "Překročili jste limit záznamů výstupů. Zkuste to znovu za hodinu." },
      { status: 429 }
    );
  }

  const report = await prisma.tripReport.create({
    data: {
      facilityId: id,
      userId: session.userId,
      dateClimbed: input.dateClimbed,
      durationMinutes: input.durationMinutes,
      gradeText: input.gradeText,
      partnersText: input.partnersText,
      beta: input.beta,
      weatherNote: input.weatherNote,
    },
  });

  if (input.photoIds.length > 0) {
    await prisma.userPhoto.updateMany({
      where: {
        id: { in: input.photoIds.slice(0, TRIP_REPORT_MAX_PHOTOS) },
        userId: session.userId,
        facilityId: id,
        reviewId: null,
        visitId: null,
        conditionReportId: null,
        tripReportId: null,
      },
      data: { tripReportId: report.id },
    });
  }

  // Award any newly earned trip-reporter tiers — fire-and-forget so the
  // user still gets a 201 even if the badge pipeline hiccups. The badge
  // helpers themselves are idempotent (UserBadge has unique [userId, slug]).
  checkBadgesByCategory(session.userId, "trip_reporter").catch(() => {});

  return NextResponse.json(
    {
      id: report.id,
      message: "Děkujeme za záznam! Pomůže to ostatním plánovat výstup.",
    },
    { status: 201 }
  );
}

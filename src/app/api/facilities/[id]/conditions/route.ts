import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";
import {
  ALLOWED_CONDITION_RATINGS,
  CONDITION_COMMENT_MAX_LENGTH,
  CONDITION_FRESH_DAYS,
  CONDITION_RATE_LIMIT_HOURS,
  daysAgo,
} from "@/lib/conditions";
import { checkBadgesByCategory } from "@/lib/challenges";
import { batchLocalGuideTiers } from "@/lib/badges/local-guide";

// GET /api/facilities/[id]/conditions — recent reports (last FRESH_DAYS by default)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") || String(CONDITION_FRESH_DAYS), 10)));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "5", 10)));

  const reports = await prisma.conditionReport.findMany({
    where: {
      facilityId: id,
      isHidden: false,
      createdAt: { gte: daysAgo(days) },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      rating: true,
      comment: true,
      helpful: true,
      visitedAt: true,
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

  // Decorate authors with their highest "Místní průvodce" tier (if any) so
  // the UI can render the badge next to their name without N+1 queries.
  const tierMap = await batchLocalGuideTiers(reports.map((r) => r.user.id));
  const decorated = reports.map((r) => ({
    ...r,
    user: {
      ...r.user,
      localGuideTier: tierMap.get(r.user.id) ?? null,
    },
  }));

  return NextResponse.json({ reports: decorated });
}

// POST /api/facilities/[id]/conditions — submit a new condition report (auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getUserSession();
  if (!session) {
    return NextResponse.json(
      { error: "Pro odeslání reportu se musíte přihlásit." },
      { status: 401 }
    );
  }

  let body: { rating?: string; comment?: string; photoIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { rating, comment, photoIds } = body;

  if (!rating || typeof rating !== "string" || !ALLOWED_CONDITION_RATINGS.includes(rating as never)) {
    return NextResponse.json(
      { error: "Vyberte platné hodnocení." },
      { status: 400 }
    );
  }

  const trimmedComment = typeof comment === "string" ? comment.trim() : "";
  if (trimmedComment.length > CONDITION_COMMENT_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Komentář může mít nejvýše ${CONDITION_COMMENT_MAX_LENGTH} znaků.` },
      { status: 400 }
    );
  }

  // Facility must exist
  const facility = await prisma.facility.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!facility) {
    return NextResponse.json({ error: "Sportoviště nenalezeno." }, { status: 404 });
  }

  // Rate limit: 1 report per user per facility per 24h
  const windowStart = new Date(Date.now() - CONDITION_RATE_LIMIT_HOURS * 60 * 60 * 1000);
  const recent = await prisma.conditionReport.findFirst({
    where: {
      facilityId: id,
      userId: session.userId,
      createdAt: { gte: windowStart },
    },
    select: { id: true },
  });
  if (recent) {
    return NextResponse.json(
      { error: "Report z tohoto sportoviště jste nedávno odeslali. Zkuste to znovu za 24 hodin." },
      { status: 429 }
    );
  }

  const report = await prisma.conditionReport.create({
    data: {
      facilityId: id,
      userId: session.userId,
      rating,
      comment: trimmedComment.length > 0 ? trimmedComment : null,
    },
  });

  // Link uploaded photos to the report
  if (photoIds && Array.isArray(photoIds) && photoIds.length > 0) {
    await prisma.userPhoto.updateMany({
      where: {
        id: { in: photoIds.slice(0, 3) },
        userId: session.userId,
        facilityId: id,
        reviewId: null,
        visitId: null,
        conditionReportId: null,
      },
      data: { conditionReportId: report.id },
    });
  }

  // Award any newly earned "Místní průvodce" tiers — fire-and-forget so the
  // user still gets a 201 even if the badge pipeline hiccups. The badge
  // helpers themselves are idempotent (UserBadge has unique [userId, slug]).
  checkBadgesByCategory(session.userId, "local_guide").catch(() => {});

  return NextResponse.json(
    { id: report.id, message: "Děkujeme za report! Pomáháte ostatním plánovat." },
    { status: 201 }
  );
}


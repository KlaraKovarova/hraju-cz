import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TRIP_REPORT_PAGE_SIZE } from "@/lib/trip-reports";

// GET /api/users/[id]/trip-reports?limit=20&cursor=...
// Returns non-hidden trip reports for a user (by createdAt desc).
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
    where: { userId: id, isHidden: false },
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
      facility: {
        select: {
          id: true,
          name: true,
          slug: true,
          location: { select: { city: true } },
          sports: {
            take: 1,
            select: { sport: { select: { slug: true, nameCs: true } } },
          },
        },
      },
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

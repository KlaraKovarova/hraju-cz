import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const region = sp.get("region") || undefined;
  const month = sp.get("month"); // YYYY-MM
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const pageSize = 20;

  const now = new Date();
  let dateFrom: Date;
  let dateTo: Date;

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, mon] = month.split("-").map(Number);
    dateFrom = new Date(year, mon - 1, 1);
    dateTo = new Date(year, mon, 0, 23, 59, 59, 999); // last day of month
    // Don't show past events even when filtering by month
    if (dateFrom < now) dateFrom = now;
  } else {
    dateFrom = now;
    dateTo = new Date(now);
    dateTo.setMonth(dateTo.getMonth() + 2);
  }

  const where = {
    isActive: true,
    dateStart: { gte: dateFrom, lte: dateTo },
    ...(region ? { region } : {}),
  };

  try {
    const [events, total] = await Promise.all([
      prisma.touristEvent.findMany({
        where,
        orderBy: { dateStart: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          dateStart: true,
          dateEnd: true,
          city: true,
          region: true,
          description: true,
          externalUrl: true,
          lat: true,
          lng: true,
          source: true,
        },
      }),
      prisma.touristEvent.count({ where }),
    ]);

    return NextResponse.json({
      events,
      total,
      page,
      pages: Math.ceil(total / pageSize),
    });
  } catch {
    return NextResponse.json({ events: [], total: 0, page: 1, pages: 0 });
  }
}

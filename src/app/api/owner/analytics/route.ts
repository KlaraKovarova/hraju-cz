import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/owner-auth";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/db-timeout";

export async function GET() {
  try {
    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: session.facilityId },
      select: { isPremium: true },
    });

    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Total views last 30 days
    const totalResult = await withTimeout(prisma.facilityView.aggregate({
      where: {
        facilityId: session.facilityId,
        date: { gte: thirtyDaysAgo },
      },
      _sum: { views: true },
    }));
    const totalViews = totalResult._sum.views || 0;

    // This week vs last week
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay() + 1);
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const [thisWeekResult, lastWeekResult] = await withTimeout(Promise.all([
      prisma.facilityView.aggregate({
        where: {
          facilityId: session.facilityId,
          date: { gte: startOfThisWeek },
        },
        _sum: { views: true },
      }),
      prisma.facilityView.aggregate({
        where: {
          facilityId: session.facilityId,
          date: { gte: startOfLastWeek, lt: startOfThisWeek },
        },
        _sum: { views: true },
      }),
    ]));

    const thisWeekViews = thisWeekResult._sum.views || 0;
    const lastWeekViews = lastWeekResult._sum.views || 0;

    // Daily views for last 14 days (only for premium)
    let dailyViews: { date: string; views: number }[] = [];
    if (facility.isPremium) {
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      fourteenDaysAgo.setHours(0, 0, 0, 0);

      const rows = await withTimeout(prisma.facilityView.findMany({
        where: {
          facilityId: session.facilityId,
          date: { gte: fourteenDaysAgo },
        },
        orderBy: { date: "asc" },
        select: { date: true, views: true },
      }));

      dailyViews = rows.map((r) => ({
        date: r.date.toISOString().split("T")[0],
        views: r.views,
      }));
    }

    return NextResponse.json({
      totalViews,
      thisWeekViews,
      lastWeekViews,
      dailyViews,
      isPremium: facility.isPremium,
    });
  } catch (error) {
    console.error("Analytics fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

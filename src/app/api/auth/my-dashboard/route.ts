import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      reviewsThisMonth,
      reviewsLastMonth,
      visitsThisMonth,
      visitsLastMonth,
      totalHelpful,
      visitedFacilityIds,
      userSportSlugs,
    ] = await Promise.all([
      prisma.review.count({
        where: { userId: session.userId, createdAt: { gte: thisMonthStart } },
      }),
      prisma.review.count({
        where: {
          userId: session.userId,
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
      prisma.visit.count({
        where: { userId: session.userId, createdAt: { gte: thisMonthStart } },
      }),
      prisma.visit.count({
        where: {
          userId: session.userId,
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
      prisma.review.aggregate({
        where: { userId: session.userId, isApproved: true },
        _sum: { helpful: true },
      }),
      prisma.visit.findMany({
        where: { userId: session.userId },
        select: { facilityId: true },
      }),
      // Get sports the user is interested in (from visits + reviews)
      prisma.visit.findMany({
        where: { userId: session.userId },
        select: {
          facility: {
            select: {
              sports: {
                take: 1,
                select: { sport: { select: { slug: true } } },
              },
            },
          },
        },
        take: 50,
      }),
    ]);

    // Build recommended facilities: same sports, not yet visited
    const visitedIds = new Set(visitedFacilityIds.map((v) => v.facilityId));
    const sportSlugs = [
      ...new Set(
        userSportSlugs
          .map((v) => v.facility.sports[0]?.sport.slug)
          .filter(Boolean)
      ),
    ];

    let recommendations: {
      id: string;
      name: string;
      slug: string;
      city: string;
      sportSlug: string | null;
      sportName: string | null;
      averageRating: number | null;
      reviewCount: number;
    }[] = [];

    if (sportSlugs.length > 0) {
      const candidates = await prisma.facility.findMany({
        where: {
          isActive: true,
          id: { notIn: [...visitedIds] },
          sports: { some: { sport: { slug: { in: sportSlugs } } } },
        },
        orderBy: [{ averageRating: "desc" }, { reviewCount: "desc" }],
        take: 6,
        select: {
          id: true,
          name: true,
          slug: true,
          averageRating: true,
          reviewCount: true,
          location: { select: { city: true } },
          sports: {
            take: 1,
            select: { sport: { select: { slug: true, nameCs: true } } },
          },
        },
      });

      recommendations = candidates.map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        city: f.location.city,
        sportSlug: f.sports[0]?.sport.slug ?? null,
        sportName: f.sports[0]?.sport.nameCs ?? null,
        averageRating: f.averageRating,
        reviewCount: f.reviewCount,
      }));
    }

    // If no sport-based recommendations, show top-rated ferraty (beachhead sport)
    if (recommendations.length === 0) {
      const ferraty = await prisma.facility.findMany({
        where: {
          isActive: true,
          sports: { some: { sport: { slug: "ferraty" } } },
          reviewCount: { gte: 1 },
        },
        orderBy: [{ averageRating: "desc" }, { reviewCount: "desc" }],
        take: 4,
        select: {
          id: true,
          name: true,
          slug: true,
          averageRating: true,
          reviewCount: true,
          location: { select: { city: true } },
          sports: {
            take: 1,
            select: { sport: { select: { slug: true, nameCs: true } } },
          },
        },
      });

      recommendations = ferraty.map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        city: f.location.city,
        sportSlug: f.sports[0]?.sport.slug ?? null,
        sportName: f.sports[0]?.sport.nameCs ?? null,
        averageRating: f.averageRating,
        reviewCount: f.reviewCount,
      }));
    }

    return NextResponse.json({
      trends: {
        reviewsThisMonth,
        reviewsLastMonth,
        visitsThisMonth,
        visitsLastMonth,
      },
      totalHelpfulVotes: totalHelpful._sum.helpful ?? 0,
      recommendations,
    });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

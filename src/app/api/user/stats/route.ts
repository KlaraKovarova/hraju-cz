import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/db-timeout";

const EXPERTISE_THRESHOLDS = [
  { level: "znalec" as const, count: 3, labelCs: "Znalec" },
  { level: "expert" as const, count: 10, labelCs: "Expert" },
];

const SPORT_LABELS: Record<string, string> = {
  ferraty: "ferrat",
  lezeni: "lezení",
  tenis: "tenisu",
  badminton: "badmintonu",
  squash: "squashe",
  plavani: "plavání",
  fitness: "fitness",
};

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const [reviews, totalHelpful, totalCheckIns] = await withTimeout(
      Promise.all([
        // Reviews with sport info for per-sport breakdown
        prisma.review.findMany({
          where: { userId: session.userId },
          select: {
            id: true,
            isApproved: true,
            facility: {
              select: {
                sports: {
                  take: 1,
                  select: { sport: { select: { slug: true, nameCs: true } } },
                },
              },
            },
          },
        }),
        prisma.review.aggregate({
          where: { userId: session.userId, isApproved: true },
          _sum: { helpful: true },
        }),
        prisma.visit.count({ where: { userId: session.userId } }),
      ])
    );

    // Group reviews by sport
    const sportMap = new Map<string, { nameCs: string; total: number; approved: number }>();
    for (const r of reviews) {
      const sport = r.facility.sports[0]?.sport;
      const slug = sport?.slug ?? "other";
      const nameCs = sport?.nameCs ?? "Ostatní";
      const entry = sportMap.get(slug) ?? { nameCs, total: 0, approved: 0 };
      entry.total++;
      if (r.isApproved) entry.approved++;
      sportMap.set(slug, entry);
    }

    const reviewsBySport = [...sportMap.entries()]
      .map(([slug, data]) => ({ slug, nameCs: data.nameCs, total: data.total, approved: data.approved }))
      .sort((a, b) => b.total - a.total);

    // Expertise progress per sport
    const expertiseProgress: {
      sportSlug: string;
      sportNameCs: string;
      approvedCount: number;
      currentLevel: string | null;
      nextLevel: string | null;
      nextThreshold: number | null;
      remaining: number | null;
    }[] = [];

    for (const [slug, data] of sportMap) {
      if (!SPORT_LABELS[slug]) continue;
      const approved = data.approved;

      let currentLevel: string | null = null;
      let nextLevel: string | null = null;
      let nextThreshold: number | null = null;

      for (const t of EXPERTISE_THRESHOLDS) {
        if (approved >= t.count) {
          currentLevel = t.labelCs;
        } else if (nextLevel === null) {
          nextLevel = t.labelCs;
          nextThreshold = t.count;
        }
      }

      // If not yet expert, show next milestone
      if (nextLevel && nextThreshold) {
        expertiseProgress.push({
          sportSlug: slug,
          sportNameCs: data.nameCs,
          approvedCount: approved,
          currentLevel,
          nextLevel,
          nextThreshold,
          remaining: nextThreshold - approved,
        });
      }
    }

    // Sort by closest to next milestone
    expertiseProgress.sort((a, b) => (a.remaining ?? 99) - (b.remaining ?? 99));

    return NextResponse.json({
      totalReviews: reviews.length,
      totalApproved: reviews.filter((r) => r.isApproved).length,
      totalHelpfulVotes: totalHelpful._sum.helpful ?? 0,
      totalCheckIns,
      reviewsBySport,
      expertiseProgress,
    });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

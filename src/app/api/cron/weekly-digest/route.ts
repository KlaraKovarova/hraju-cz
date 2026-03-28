import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWeeklyDigestEmail, type WeeklyDigestData } from "@/lib/email";
import { getUnsubscribeToken, buildUnsubscribeUrl } from "@/lib/notifications";
import { getAllPosts } from "@/lib/blog";

const CRON_SECRET = process.env.CRON_SECRET;

// POST /api/cron/weekly-digest
// Called by GitHub Actions weekly. Protected by CRON_SECRET.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = oneWeekAgo.toISOString().slice(0, 10);

  // Find eligible users: non-seed, digest enabled, with 1+ check-in, review, or favorite
  const eligibleUsers = await prisma.user.findMany({
    where: {
      isSeed: false,
      weeklyDigest: true,
      OR: [
        { visits: { some: {} } },
        { reviews: { some: {} } },
        { favorites: { some: {} } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      visits: {
        select: {
          facilityId: true,
          facility: {
            select: {
              location: { select: { region: true } },
            },
          },
        },
      },
      reviews: {
        select: { facilityId: true },
        where: { isApproved: true },
      },
      favorites: {
        select: {
          facilityId: true,
          facility: {
            select: {
              location: { select: { region: true } },
            },
          },
        },
      },
    },
  });

  // Get new blog posts from the last week
  const allPosts = getAllPosts();
  const newPosts = allPosts
    .filter((p) => p.date >= oneWeekAgoStr)
    .slice(0, 5)
    .map((p) => ({
      title: p.title,
      url: `https://www.hraju.cz/blog/${p.slug}`,
    }));

  // Ferraty seasonal section
  const now = new Date();
  const month = now.getMonth(); // 0-indexed: 0=Jan, 3=Apr, 9=Oct
  const isFerrataSeason = month >= 3 && month <= 9; // April–October
  const isPreSeason = month === 2 || month === 3; // March–April

  let seasonalFerraty: WeeklyDigestData["seasonalFerraty"] = null;
  if (isFerrataSeason || isPreSeason) {
    const topFerraty = await prisma.facility.findMany({
      where: {
        isActive: true,
        sports: { some: { sport: { slug: "ferraty" } } },
      },
      orderBy: { averageRating: "desc" },
      take: 3,
      select: {
        name: true,
        slug: true,
        averageRating: true,
        location: { select: { region: true } },
      },
    });

    if (topFerraty.length > 0) {
      seasonalFerraty = {
        heading: isPreSeason
          ? "Ferratová sezóna začíná!"
          : "Ferraty sezóna v plném proudu",
        description: isPreSeason
          ? "Jaro je tady a ferraty se otevírají. Naplánujte svůj první výstup."
          : "Využijte pěkné počasí a vyrazte na ferratu.",
        facilities: topFerraty.map((f) => ({
          name: f.name,
          url: `https://www.hraju.cz/sport/ferraty/${f.slug}`,
          rating: f.averageRating,
          region: f.location?.region || null,
        })),
        categoryUrl: "https://www.hraju.cz/sport/ferraty",
      };
    }
  }

  // Get upcoming events (next 2 weeks)
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
  const upcomingEvents = await prisma.touristEvent.findMany({
    where: {
      isActive: true,
      dateStart: { gte: now, lte: twoWeeksFromNow },
    },
    orderBy: { dateStart: "asc" },
    take: 20,
    select: {
      name: true,
      dateStart: true,
      city: true,
      region: true,
    },
  });

  // Batch-fetch all recent reviews on facilities any user cares about (single query)
  const allFacilityIds = new Set<string>();
  const userFacilityMap = new Map<string, Set<string>>();
  for (const user of eligibleUsers) {
    const ids = new Set([
      ...user.visits.map((v) => v.facilityId),
      ...user.reviews.map((r) => r.facilityId),
      ...user.favorites.map((f) => f.facilityId),
    ]);
    userFacilityMap.set(user.id, ids);
    for (const id of ids) allFacilityIds.add(id);
  }

  const allRecentReviews = allFacilityIds.size > 0
    ? await prisma.review.findMany({
        where: {
          facilityId: { in: [...allFacilityIds] },
          isApproved: true,
          createdAt: { gte: oneWeekAgo },
        },
        select: {
          userId: true,
          facilityId: true,
          authorName: true,
          rating: true,
          createdAt: true,
          facility: {
            select: {
              name: true,
              slug: true,
              sports: {
                select: { sport: { select: { slug: true } } },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Index reviews by facilityId for fast lookup
  const reviewsByFacility = new Map<string, typeof allRecentReviews>();
  for (const review of allRecentReviews) {
    if (!reviewsByFacility.has(review.facilityId)) {
      reviewsByFacility.set(review.facilityId, []);
    }
    reviewsByFacility.get(review.facilityId)!.push(review);
  }

  let sent = 0;
  let skipped = 0;

  for (const user of eligibleUsers) {
    try {
      const facilityIds = userFacilityMap.get(user.id) ?? new Set();

      // Filter batch-fetched reviews: user's facilities, excluding own reviews
      const newReviews: typeof allRecentReviews = [];
      for (const fid of facilityIds) {
        const facilityReviews = reviewsByFacility.get(fid);
        if (!facilityReviews) continue;
        for (const r of facilityReviews) {
          if (r.userId !== user.id) newReviews.push(r);
        }
      }
      // Sort by recency and cap at 5
      newReviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const topReviews = newReviews.slice(0, 5);

      // Get user's regions for event filtering (from visits and favorites)
      const userRegions = [
        ...new Set([
          ...user.visits.map((v) => v.facility.location.region),
          ...user.favorites.map((f) => f.facility.location.region),
        ].filter(Boolean)),
      ];

      // Filter events by user's regions (or show all if no region data)
      const relevantEvents =
        userRegions.length > 0
          ? upcomingEvents.filter((e) => e.region && userRegions.includes(e.region))
          : upcomingEvents;

      const digestData: WeeklyDigestData = {
        userName: user.name,
        newReviews: topReviews.map((r) => {
          const sportSlug = r.facility.sports[0]?.sport.slug || "tenis";
          return {
            facilityName: r.facility.name,
            facilityUrl: `https://www.hraju.cz/sport/${sportSlug}/${r.facility.slug}`,
            reviewerName: r.authorName,
            rating: r.rating,
          };
        }),
        newPosts,
        upcomingEvents: relevantEvents.slice(0, 5).map((e) => ({
          name: e.name,
          date: e.dateStart.toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "long",
          }),
          city: e.city,
        })),
        seasonalFerraty,
      };

      // Skip if nothing to show
      if (
        digestData.newReviews.length === 0 &&
        digestData.newPosts.length === 0 &&
        digestData.upcomingEvents.length === 0 &&
        !digestData.seasonalFerraty
      ) {
        skipped++;
        continue;
      }

      const token = await getUnsubscribeToken(user.id);
      const unsubUrl = buildUnsubscribeUrl(token, "digest");
      const didSend = await sendWeeklyDigestEmail(user.email, digestData, unsubUrl);
      if (didSend) sent++;
      else skipped++;
    } catch (error) {
      console.error(`Failed to send digest to ${user.email}:`, error);
      skipped++;
    }
  }

  return NextResponse.json({
    success: true,
    eligible: eligibleUsers.length,
    sent,
    skipped,
  });
}

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

  // Find eligible users: non-seed, digest enabled, with 1+ check-in or review
  const eligibleUsers = await prisma.user.findMany({
    where: {
      isSeed: false,
      weeklyDigest: true,
      OR: [
        { visits: { some: {} } },
        { reviews: { some: {} } },
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

  // Get upcoming events (next 2 weeks)
  const now = new Date();
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

  let sent = 0;
  let skipped = 0;

  for (const user of eligibleUsers) {
    try {
      // Collect facility IDs the user cares about
      const facilityIds = [
        ...new Set([
          ...user.visits.map((v) => v.facilityId),
          ...user.reviews.map((r) => r.facilityId),
        ]),
      ];

      // Find new reviews on those facilities from the last week
      const newReviews = facilityIds.length > 0
        ? await prisma.review.findMany({
            where: {
              facilityId: { in: facilityIds },
              isApproved: true,
              createdAt: { gte: oneWeekAgo },
              userId: { not: user.id },
            },
            select: {
              authorName: true,
              rating: true,
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
            take: 5,
            orderBy: { createdAt: "desc" },
          })
        : [];

      // Get user's regions for event filtering
      const userRegions = [
        ...new Set(user.visits.map((v) => v.facility.location.region).filter(Boolean)),
      ];

      // Filter events by user's regions (or show all if no region data)
      const relevantEvents =
        userRegions.length > 0
          ? upcomingEvents.filter((e) => e.region && userRegions.includes(e.region))
          : upcomingEvents;

      const digestData: WeeklyDigestData = {
        userName: user.name,
        newReviews: newReviews.map((r) => {
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
      };

      // Skip if nothing to show
      if (
        digestData.newReviews.length === 0 &&
        digestData.newPosts.length === 0 &&
        digestData.upcomingEvents.length === 0
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

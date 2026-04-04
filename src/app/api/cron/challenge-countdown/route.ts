import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveChallenges } from "@/lib/monthly-challenges";
import { BADGE_DEFINITIONS } from "@/lib/challenges";
import { sendChallengeCountdownEmail, type ChallengeCountdownData } from "@/lib/email";
import { getUnsubscribeToken, buildUnsubscribeUrl } from "@/lib/notifications";

const CRON_SECRET = process.env.CRON_SECRET;

// POST /api/cron/challenge-countdown
// Called daily by GitHub Actions. Protected by CRON_SECRET.
// Sends countdown emails at 7, 3, and 1 days before challenge end.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const activeChallenges = getActiveChallenges(now);
  if (activeChallenges.length === 0) {
    return NextResponse.json({ success: true, message: "No active challenges", sent: 0 });
  }

  // Filter to challenges ending in 7, 3, or 1 days
  const triggeredChallenges = activeChallenges.filter((c) => {
    const endDate = new Date(c.endDate + "T23:59:59");
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft === 7 || daysLeft === 3 || daysLeft === 1;
  });

  if (triggeredChallenges.length === 0) {
    return NextResponse.json({ success: true, message: "No countdown trigger today", sent: 0 });
  }

  // Get badge slugs for active challenges to identify users who already completed
  const challengeBadgeSlugs = triggeredChallenges.map((c) => c.badgeSlug);

  // Find users with at least one check-in in the challenge period who haven't earned the badge
  const challengeStart = triggeredChallenges.reduce(
    (earliest, c) => (c.startDate < earliest ? c.startDate : earliest),
    triggeredChallenges[0].startDate
  );
  const challengeEnd = triggeredChallenges.reduce(
    (latest, c) => (c.endDate > latest ? c.endDate : latest),
    triggeredChallenges[0].endDate
  );

  // Users with any visits in the challenge period
  const usersWithVisits = await prisma.visit.findMany({
    where: {
      createdAt: {
        gte: new Date(challengeStart),
        lt: new Date(challengeEnd + "T23:59:59"),
      },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  const userIds = usersWithVisits.map((v) => v.userId);
  if (userIds.length === 0) {
    return NextResponse.json({ success: true, message: "No participating users", sent: 0 });
  }

  // Get users with email preferences
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      isSeed: false,
      emailNotifications: true,
    },
    select: { id: true, email: true, name: true },
  });

  // Get users who already earned challenge badges (exclude from email)
  const earnedBadges = await prisma.userBadge.findMany({
    where: {
      userId: { in: users.map((u) => u.id) },
      badgeSlug: { in: challengeBadgeSlugs },
    },
    select: { userId: true, badgeSlug: true },
  });
  const earnedByUser = new Map<string, Set<string>>();
  for (const eb of earnedBadges) {
    if (!earnedByUser.has(eb.userId)) earnedByUser.set(eb.userId, new Set());
    earnedByUser.get(eb.userId)!.add(eb.badgeSlug);
  }

  // Count how many users have already completed each challenge
  const completedCounts = new Map<string, number>();
  for (const slug of challengeBadgeSlugs) {
    const count = await prisma.userBadge.count({
      where: { badgeSlug: slug },
    });
    completedCounts.set(slug, count);
  }

  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      const userEarned = earnedByUser.get(user.id) ?? new Set();
      const challengeData: ChallengeCountdownData["challenges"] = [];

      for (const challenge of triggeredChallenges) {
        // Skip if user already earned this badge
        if (userEarned.has(challenge.badgeSlug)) continue;

        const endDate = new Date(challenge.endDate + "T23:59:59");
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Count user's visits for this challenge's sport in the period
        const progress = await prisma.visit.count({
          where: {
            userId: user.id,
            createdAt: {
              gte: new Date(challenge.startDate),
              lt: new Date(challenge.endDate + "T23:59:59"),
            },
            facility: {
              sports: { some: { sport: { slug: challenge.sportSlug } } },
            },
          },
        });

        // Only include if user has some progress but hasn't completed
        if (progress > 0 && progress < challenge.target) {
          challengeData.push({
            emoji: challenge.emoji,
            title: challenge.title,
            daysLeft,
            progress,
            target: challenge.target,
            completedCount: completedCounts.get(challenge.badgeSlug) ?? 0,
            categoryUrl: `https://www.hraju.cz/sport/${challenge.sportSlug}`,
          });
        }
      }

      if (challengeData.length === 0) {
        skipped++;
        continue;
      }

      const token = await getUnsubscribeToken(user.id);
      const unsubUrl = buildUnsubscribeUrl(token, "all");
      const didSend = await sendChallengeCountdownEmail(
        user.email,
        { userName: user.name, challenges: challengeData },
        unsubUrl
      );

      if (didSend) sent++;
      else skipped++;
    } catch (error) {
      console.error(`Failed to send countdown email to ${user.email}:`, error);
      skipped++;
    }
  }

  return NextResponse.json({
    success: true,
    activeChallenges: triggeredChallenges.map((c) => c.slug),
    eligible: users.length,
    sent,
    skipped,
  });
}

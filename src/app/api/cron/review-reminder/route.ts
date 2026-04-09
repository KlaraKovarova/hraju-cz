import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReviewReminderEmail } from "@/lib/email";
import { getUnsubscribeToken, buildUnsubscribeUrl } from "@/lib/notifications";

const CRON_SECRET = process.env.CRON_SECRET;
const MAX_EMAILS_PER_RUN = 20;

// POST /api/cron/review-reminder
// Called daily by GitHub Actions. Protected by CRON_SECRET.
// Sends review reminder emails 3+ days after check-in if no review was written.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Find visits that are 3+ days old, have no reminder sent, and no review by same user at same facility
  const eligibleVisits = await prisma.visit.findMany({
    where: {
      createdAt: { lte: threeDaysAgo },
      reviewReminderSentAt: null,
      user: {
        isSeed: false,
        emailNotifications: true,
      },
    },
    select: {
      id: true,
      userId: true,
      facilityId: true,
      user: { select: { id: true, email: true, name: true } },
      facility: { select: { name: true, slug: true } },
    },
    take: MAX_EMAILS_PER_RUN * 2, // fetch extra to account for filtering
    orderBy: { createdAt: "asc" },
  });

  if (eligibleVisits.length === 0) {
    return NextResponse.json({ success: true, message: "No eligible visits", sent: 0, skipped: 0 });
  }

  // Batch check: which of these users already wrote a review at the same facility?
  const visitKeys = eligibleVisits.map((v) => ({ userId: v.userId, facilityId: v.facilityId }));
  const existingReviews = await prisma.review.findMany({
    where: {
      OR: visitKeys.map((k) => ({
        userId: k.userId,
        facilityId: k.facilityId,
      })),
    },
    select: { userId: true, facilityId: true },
  });

  const reviewedSet = new Set(
    existingReviews.map((r) => `${r.userId}:${r.facilityId}`)
  );

  // Filter to visits with no matching review
  const toRemind = eligibleVisits
    .filter((v) => !reviewedSet.has(`${v.userId}:${v.facilityId}`))
    .slice(0, MAX_EMAILS_PER_RUN);

  let sent = 0;
  let skipped = 0;

  for (const visit of toRemind) {
    try {
      const facilityUrl = `https://www.hraju.cz/zarizeni/${visit.facility.slug}`;
      const token = await getUnsubscribeToken(visit.user.id);
      const unsubUrl = buildUnsubscribeUrl(token, "all");

      const didSend = await sendReviewReminderEmail(
        visit.user.email,
        visit.user.name,
        visit.facility.name,
        facilityUrl,
        unsubUrl
      );

      if (didSend) {
        // Mark reminder as sent so we never send again for this visit
        await prisma.visit.update({
          where: { id: visit.id },
          data: { reviewReminderSentAt: now },
        });
        sent++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`Failed to send review reminder for visit ${visit.id}:`, error);
      skipped++;
    }
  }

  // Also mark visits where user already wrote a review (no need to remind)
  const alreadyReviewedVisitIds = eligibleVisits
    .filter((v) => reviewedSet.has(`${v.userId}:${v.facilityId}`))
    .map((v) => v.id);

  if (alreadyReviewedVisitIds.length > 0) {
    await prisma.visit.updateMany({
      where: { id: { in: alreadyReviewedVisitIds } },
      data: { reviewReminderSentAt: now },
    });
  }

  return NextResponse.json({
    success: true,
    eligible: eligibleVisits.length,
    alreadyReviewed: alreadyReviewedVisitIds.length,
    sent,
    skipped,
  });
}

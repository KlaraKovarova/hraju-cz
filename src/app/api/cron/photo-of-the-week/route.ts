import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { previousWeekKey } from "@/lib/photo-week";
import { createNotification } from "@/lib/notifications";
import { getUnsubscribeToken, buildUnsubscribeUrl } from "@/lib/notifications";
import { sendPhotoOfTheWeekEmail } from "@/lib/email";

// SIL-666 — Weekly "Foto týdne" winner selection.
// Fires every Monday 09:00 UTC via GitHub Actions.
// Tally votes from the ISO week that just ended, pick a winner, notify them,
// award badge "foto-tydne". Idempotent: if a winner exists for weekKey, no-op.
//
// Query flag:
//   ?dryRun=1  — log the would-be winner without writing state. Auth still required.

const CRON_SECRET = process.env.CRON_SECRET;
const WINNER_BADGE = "foto-tydne";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const weekKey = request.nextUrl.searchParams.get("weekKey") || previousWeekKey();

  // Idempotency: if already awarded, bail
  const existing = await prisma.photoOfTheWeek.findUnique({ where: { weekKey } });
  if (existing && !dryRun) {
    return NextResponse.json({
      success: true,
      message: "Week already awarded",
      weekKey,
      photoId: existing.photoId,
      voteCount: existing.voteCount,
    });
  }

  // Tally: count votes per photo for this week.
  const grouped = await prisma.photoVote.groupBy({
    by: ["photoId"],
    where: { weekKey },
    _count: { photoId: true },
    orderBy: [{ _count: { photoId: "desc" } }],
  });

  if (grouped.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No votes this week, skipping",
      weekKey,
      dryRun,
    });
  }

  // Deterministic tiebreak: among photos sharing the top count, pick oldest createdAt.
  const topCount = grouped[0]._count.photoId;
  const topPhotoIds = grouped
    .filter((g) => g._count.photoId === topCount)
    .map((g) => g.photoId);

  const candidates = await prisma.userPhoto.findMany({
    where: { id: { in: topPhotoIds }, isHidden: false },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      url: true,
      userId: true,
      createdAt: true,
      user: { select: { id: true, email: true, name: true, emailNotifications: true, isSeed: true } },
      facility: {
        select: {
          name: true,
          slug: true,
          sports: { take: 1, select: { sport: { select: { slug: true } } } },
        },
      },
    },
  });

  const winner = candidates[0];
  if (!winner) {
    return NextResponse.json({
      success: true,
      message: "No eligible winner (photos hidden or deleted)",
      weekKey,
      dryRun,
    });
  }

  const summary = {
    weekKey,
    photoId: winner.id,
    winnerUserId: winner.userId,
    voteCount: topCount,
    totalPhotosWithVotes: grouped.length,
    dryRun,
  };

  if (dryRun) {
    console.log("[photo-of-the-week dryRun]", summary);
    return NextResponse.json({ success: true, ...summary });
  }

  // 1) Record winner
  await prisma.photoOfTheWeek.create({
    data: {
      weekKey,
      photoId: winner.id,
      voteCount: topCount,
    },
  });

  // 2) Count user's total POTW awards (including this one) for the badge slug.
  const awardIndex = await prisma.photoOfTheWeek.count({
    where: { photo: { userId: winner.userId } },
  });

  // Badge slug scheme: first win = "foto-tydne", subsequent = "foto-tydne-2", "foto-tydne-3", ...
  const badgeSlug = awardIndex === 1 ? WINNER_BADGE : `${WINNER_BADGE}-${awardIndex}`;

  try {
    await prisma.userBadge.create({
      data: { userId: winner.userId, badgeSlug },
    });
  } catch {
    // Unique constraint — user already has this badge; ignore.
  }

  // 3) In-app + email notification (skip if seed user)
  if (!winner.user.isSeed) {
    try {
      await createNotification(
        winner.userId,
        "photo_of_the_week",
        `\uD83C\uDF86 Vaše foto bylo zvoleno fotem týdne!`,
        {
          body: `Z ${winner.facility.name} — ${topCount} ${topCount === 1 ? "hlas" : topCount < 5 ? "hlasy" : "hlasů"}`,
          linkUrl: "/foto-tydne",
          icon: "\uD83C\uDF86",
        }
      );
    } catch (err) {
      console.error("Failed to create in-app notification for POTW winner:", err);
    }

    if (winner.user.emailNotifications && winner.user.email) {
      try {
        const token = await getUnsubscribeToken(winner.userId);
        const unsubUrl = buildUnsubscribeUrl(token, "all");
        const base = process.env.NEXT_PUBLIC_BASE_URL || "https://www.hraju.cz";
        await sendPhotoOfTheWeekEmail(
          winner.user.email,
          winner.user.name,
          winner.facility.name,
          winner.url,
          `${base}/foto-tydne`,
          topCount,
          unsubUrl
        );
      } catch (err) {
        console.error("Failed to send POTW email:", err);
      }
    }
  }

  return NextResponse.json({
    success: true,
    ...summary,
    badgeSlug,
  });
}

// Convenience GET for ops visibility — protected by same secret.
export async function GET(request: NextRequest) {
  return POST(request);
}

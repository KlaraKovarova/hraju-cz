import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendConditionsDigestEmail,
  excerptComment,
  buildConditionsDigestSubject,
  type ConditionsDigestFacility,
} from "@/lib/email/conditions-digest";
import type { ConditionRating } from "@/lib/conditions";
import { getUnsubscribeToken, buildUnsubscribeUrl } from "@/lib/notifications";

const CRON_SECRET = process.env.CRON_SECRET;
const FRESH_DAYS = 7;

// POST /api/cron/conditions-digest
// Weekly Friday email digest to users about new condition reports on their favorited facilities.
// Auth: Bearer CRON_SECRET. Pass ?dryRun=1 to log without sending (no auth required for dry-run from localhost).
export async function POST(request: NextRequest) {
  return runDigest(request);
}

// GET supported only for dry-run convenience (e.g. local testing). Always requires ?dryRun=1.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("dryRun") !== "1") {
    return NextResponse.json({ error: "Use POST with CRON_SECRET, or GET with ?dryRun=1" }, { status: 405 });
  }
  return runDigest(request);
}

async function runDigest(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dryRun") === "1";

  if (!dryRun) {
    const authHeader = request.headers.get("authorization");
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const since = new Date(now.getTime() - FRESH_DAYS * 24 * 60 * 60 * 1000);

  // Step 1: load all eligible users (real users with at least one favorite + opted in).
  const users = await prisma.user.findMany({
    where: {
      isSeed: false,
      emailNotifications: true,
      conditionsDigest: true,
      favorites: { some: {} },
    },
    select: {
      id: true,
      email: true,
      name: true,
      favorites: { select: { facilityId: true } },
    },
  });

  if (users.length === 0) {
    return NextResponse.json({ success: true, eligible: 0, sent: 0, skipped: 0, dryRun });
  }

  // Step 2: collect facility IDs across users to batch-fetch fresh reports.
  const allFacilityIds = new Set<string>();
  for (const u of users) for (const f of u.favorites) allFacilityIds.add(f.facilityId);

  const reports = await prisma.conditionReport.findMany({
    where: {
      facilityId: { in: [...allFacilityIds] },
      isHidden: false,
      createdAt: { gte: since },
    },
    select: {
      id: true,
      facilityId: true,
      rating: true,
      comment: true,
      createdAt: true,
      facility: {
        select: {
          name: true,
          slug: true,
          sports: {
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { sport: { select: { slug: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Step 3: index by facility — keep the latest report + total count.
  const byFacility = new Map<string, { latest: typeof reports[number]; count: number }>();
  for (const r of reports) {
    const entry = byFacility.get(r.facilityId);
    if (!entry) {
      byFacility.set(r.facilityId, { latest: r, count: 1 });
    } else {
      entry.count += 1;
      // reports already sorted desc by createdAt, so first one stays latest
    }
  }

  let sent = 0;
  let skipped = 0;
  let totalFacilitiesIncluded = 0;
  const dryRunPreviews: Array<{ to: string; subject: string; facilities: number; reports: number }> = [];

  for (const user of users) {
    try {
      const facilityIds = user.favorites.map((f) => f.facilityId);
      const items: ConditionsDigestFacility[] = [];
      let totalUserReports = 0;

      for (const fid of facilityIds) {
        const entry = byFacility.get(fid);
        if (!entry) continue;
        const sportSlug = entry.latest.facility.sports[0]?.sport.slug || "fitness";
        items.push({
          facilityName: entry.latest.facility.name,
          facilityUrl: `https://www.hraju.cz/sport/${sportSlug}/${entry.latest.facility.slug}`,
          rating: entry.latest.rating as ConditionRating,
          commentExcerpt: excerptComment(entry.latest.comment),
          reportedAt: entry.latest.createdAt,
          reportCount: entry.count,
        });
        totalUserReports += entry.count;
      }

      if (items.length === 0) {
        skipped++;
        continue;
      }

      // Sort facilities by recency of latest report
      items.sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
      totalFacilitiesIncluded += items.length;

      const data = {
        userName: user.name,
        facilities: items,
        totalReports: totalUserReports,
      };

      if (dryRun) {
        dryRunPreviews.push({
          to: user.email,
          subject: buildConditionsDigestSubject(totalUserReports),
          facilities: items.length,
          reports: totalUserReports,
        });
        sent++;
        continue;
      }

      const token = await getUnsubscribeToken(user.id);
      const unsubUrl = buildUnsubscribeUrl(token, "conditions");
      const didSend = await sendConditionsDigestEmail(user.email, data, unsubUrl, now);
      if (didSend) sent++;
      else skipped++;
    } catch (error) {
      console.error(`Failed to send conditions digest to ${user.email}:`, error);
      skipped++;
    }
  }

  return NextResponse.json({
    success: true,
    eligible: users.length,
    sent,
    skipped,
    facilitiesIncluded: totalFacilitiesIncluded,
    reportsConsidered: reports.length,
    dryRun,
    ...(dryRun ? { previews: dryRunPreviews.slice(0, 10) } : {}),
  });
}

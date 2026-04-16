import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendPhotoFeaturedEmail } from "@/lib/email";
import { getUnsubscribeToken, buildUnsubscribeUrl } from "@/lib/notifications";

// SIL-671 — Weekly "your photo is now the lead photo on a facility page" notification.
// Fires every Monday after the Foto týdne winner cron via GitHub Actions.
// For each facility, finds the current lead (most recent, non-hidden) UserPhoto
// and — if that photo has never been flagged as "featured" before
// (featuredNotifiedAt IS NULL) — notifies its author and stamps the row.
//
// Idempotent: once a photo is stamped, it will not re-trigger. When a newer
// photo supersedes the lead, only the new photo triggers its own notification.
//
// Query flags:
//   ?dryRun=1 — return the plan without writing state
//   ?limit=N  — cap processed facilities (safety net / manual run)

const CRON_SECRET = process.env.CRON_SECRET;

interface LeadCandidate {
  id: string;
  userId: string;
  facilityId: string;
  url: string;
  facilityName: string;
  facilitySlug: string;
  sportSlug: string | null;
  userName: string | null;
  userEmail: string | null;
  isSeedUser: boolean;
  emailNotifications: boolean;
}

function facilityHref(sportSlug: string | null, slug: string): string {
  return sportSlug ? `/sport/${sportSlug}/${slug}` : `/${slug}`;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.max(1, Math.min(5000, Number(limitParam) || 0)) : 2000;

  // One row per facility: the most recent non-hidden UserPhoto that has
  // never been notified as the lead. Prisma `distinct` maps to
  // Postgres DISTINCT ON, keeping the first occurrence per facilityId under
  // the given ordering.
  const candidates = await prisma.userPhoto.findMany({
    where: { isHidden: false, featuredNotifiedAt: null },
    distinct: ["facilityId"],
    orderBy: [{ facilityId: "asc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      userId: true,
      facilityId: true,
      url: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isSeed: true,
          emailNotifications: true,
        },
      },
      facility: {
        select: {
          name: true,
          slug: true,
          sports: { take: 1, select: { sport: { select: { slug: true } } } },
        },
      },
    },
  });

  // For every candidate, verify it is still the true lead photo right now.
  // (A newer photo may already exist whose featuredNotifiedAt is non-null —
  // unlikely but possible if we ever backfill the column.)
  const verified: LeadCandidate[] = [];
  for (const row of candidates) {
    const currentLead = await prisma.userPhoto.findFirst({
      where: { facilityId: row.facilityId, isHidden: false },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!currentLead || currentLead.id !== row.id) continue;
    verified.push({
      id: row.id,
      userId: row.userId,
      facilityId: row.facilityId,
      url: row.url,
      facilityName: row.facility.name,
      facilitySlug: row.facility.slug,
      sportSlug: row.facility.sports[0]?.sport.slug ?? null,
      userName: row.user.name,
      userEmail: row.user.email,
      isSeedUser: row.user.isSeed,
      emailNotifications: row.user.emailNotifications,
    });
  }

  if (dryRun) {
    return NextResponse.json({
      success: true,
      dryRun: true,
      totalCandidates: candidates.length,
      wouldNotify: verified.length,
      sample: verified.slice(0, 10).map((v) => ({
        photoId: v.id,
        userId: v.userId,
        facilityName: v.facilityName,
      })),
    });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://www.hraju.cz";
  let notified = 0;
  let emailed = 0;
  let errors = 0;

  for (const v of verified) {
    const href = facilityHref(v.sportSlug, v.facilitySlug);

    // In-app notification (skip seed users, they don't consume notifications)
    if (!v.isSeedUser) {
      try {
        await createNotification(
          v.userId,
          "photo_featured",
          `Tvoje foto je na úvodu ${v.facilityName}`,
          {
            body: "Díky, že sdílíš svoje snímky — zvyšuje to důvěru ostatních sportovců.",
            linkUrl: href,
            icon: "\uD83D\uDCF8",
          }
        );
      } catch (err) {
        console.error("[notify-photo-features] in-app failed", err);
        errors += 1;
      }

      // Email — only if user still opts in and has an email.
      if (v.emailNotifications && v.userEmail) {
        try {
          const token = await getUnsubscribeToken(v.userId);
          const unsubUrl = buildUnsubscribeUrl(token, "all");
          const sent = await sendPhotoFeaturedEmail(
            v.userEmail,
            v.userName,
            v.facilityName,
            v.url,
            `${base}${href}`,
            unsubUrl
          );
          if (sent) emailed += 1;
        } catch (err) {
          console.error("[notify-photo-features] email failed", err);
          errors += 1;
        }
      }
    }

    // Stamp the photo so subsequent cron runs skip it.
    try {
      await prisma.userPhoto.update({
        where: { id: v.id },
        data: { featuredNotifiedAt: new Date() },
      });
      notified += 1;
    } catch (err) {
      console.error("[notify-photo-features] stamp failed", err);
      errors += 1;
    }
  }

  return NextResponse.json({
    success: true,
    totalCandidates: candidates.length,
    notified,
    emailed,
    errors,
  });
}

// Convenience GET for ops visibility — protected by same secret.
export async function GET(request: NextRequest) {
  return POST(request);
}

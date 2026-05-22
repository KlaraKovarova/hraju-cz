import { prisma } from "@/lib/prisma";

export type PhotoContext = "review" | "checkin" | "condition" | "trip-report";

export interface FacilityPhoto {
  id: string;
  url: string;
  alt: string | null;
  createdAt: Date;
  user: { id: string; name: string | null };
  context: PhotoContext | null;
  reviewId: string | null;
  visitId: string | null;
  conditionReportId: string | null;
  tripReportId: string | null;
}

export interface GetFacilityPhotosOpts {
  context?: PhotoContext;
  /** 0-based page index (page 0 = first page). */
  page?: number;
  /** Page size; default 48. */
  pageSize?: number;
  /** Convenience: take N photos from the start, ignoring pagination. */
  take?: number;
}

export interface UserPhoto {
  id: string;
  url: string;
  alt: string | null;
  createdAt: Date;
  context: PhotoContext | null;
  reviewId: string | null;
  visitId: string | null;
  conditionReportId: string | null;
  tripReportId: string | null;
  facility: {
    id: string;
    name: string;
    slug: string;
    sportSlug: string;
    sportName: string;
    city: string | null;
  };
}

export interface GetUserPhotosOpts {
  /** 0-based page index (page 0 = first page). */
  page?: number;
  /** Page size; default 48. */
  pageSize?: number;
  /** Convenience: take N photos from the start, ignoring pagination. */
  take?: number;
}

export interface RecentHomePhoto {
  id: string;
  url: string;
  alt: string | null;
  createdAt: Date;
  context: PhotoContext | null;
  reviewId: string | null;
  visitId: string | null;
  conditionReportId: string | null;
  tripReportId: string | null;
  user: { id: string; name: string | null };
  facility: {
    id: string;
    name: string;
    slug: string;
    sportSlug: string | null;
    sportName: string | null;
  };
}

const DEFAULT_PAGE_SIZE = 48;

function inferContext(p: {
  reviewId: string | null;
  visitId: string | null;
  conditionReportId: string | null;
  tripReportId: string | null;
}): PhotoContext | null {
  if (p.reviewId) return "review";
  if (p.visitId) return "checkin";
  if (p.conditionReportId) return "condition";
  if (p.tripReportId) return "trip-report";
  return null;
}

/**
 * getFacilityPhotos — return user-uploaded photos for a facility, joined with
 * author info and source-context (review / check-in / condition report).
 *
 * Always filters out hidden photos. Sorted by createdAt DESC.
 */
export async function getFacilityPhotos(
  facilityId: string,
  opts: GetFacilityPhotosOpts = {}
): Promise<{ photos: FacilityPhoto[]; total: number }> {
  const where: {
    facilityId: string;
    isHidden: boolean;
    reviewId?: { not: null };
    visitId?: { not: null };
    conditionReportId?: { not: null };
    tripReportId?: { not: null };
  } = { facilityId, isHidden: false };

  if (opts.context === "review") where.reviewId = { not: null };
  else if (opts.context === "checkin") where.visitId = { not: null };
  else if (opts.context === "condition") where.conditionReportId = { not: null };
  else if (opts.context === "trip-report") where.tripReportId = { not: null };

  const pageSize = opts.take ?? opts.pageSize ?? DEFAULT_PAGE_SIZE;
  const skip = opts.take ? 0 : (opts.page ?? 0) * pageSize;

  // Degrade gracefully to an empty result when DB is unavailable so server
  // components that call this don't crash the whole page.
  let rows: Array<{
    id: string;
    url: string;
    alt: string | null;
    createdAt: Date;
    reviewId: string | null;
    visitId: string | null;
    conditionReportId: string | null;
    tripReportId: string | null;
    user: { id: string; name: string | null };
  }> = [];
  let total = 0;
  try {
    [rows, total] = await Promise.all([
      prisma.userPhoto.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          url: true,
          alt: true,
          createdAt: true,
          reviewId: true,
          visitId: true,
          conditionReportId: true,
          tripReportId: true,
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.userPhoto.count({ where }),
    ]);
  } catch (err) {
    console.error("[getFacilityPhotos] DB query failed:", err);
    return { photos: [], total: 0 };
  }

  const photos: FacilityPhoto[] = rows.map((r) => ({
    id: r.id,
    url: r.url,
    alt: r.alt,
    createdAt: r.createdAt,
    user: r.user,
    context: inferContext(r),
    reviewId: r.reviewId,
    visitId: r.visitId,
    conditionReportId: r.conditionReportId,
    tripReportId: r.tripReportId,
  }));

  return { photos, total };
}

/**
 * getUserPhotos — return a user's uploaded photos across all facilities, joined
 * with facility name / slug / sport for per-tile context.
 *
 * Always filters out hidden photos. Sorted by createdAt DESC.
 */
export async function getUserPhotos(
  userId: string,
  opts: GetUserPhotosOpts = {}
): Promise<{ photos: UserPhoto[]; total: number }> {
  const where = { userId, isHidden: false };

  const pageSize = opts.take ?? opts.pageSize ?? DEFAULT_PAGE_SIZE;
  const skip = opts.take ? 0 : (opts.page ?? 0) * pageSize;

  const [rows, total] = await Promise.all([
    prisma.userPhoto.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        url: true,
        alt: true,
        createdAt: true,
        reviewId: true,
        visitId: true,
        conditionReportId: true,
        tripReportId: true,
        facility: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: { select: { city: true } },
            sports: {
              take: 1,
              select: { sport: { select: { slug: true, nameCs: true } } },
            },
          },
        },
      },
    }),
    prisma.userPhoto.count({ where }),
  ]);

  const photos: UserPhoto[] = rows.map((r) => ({
    id: r.id,
    url: r.url,
    alt: r.alt,
    createdAt: r.createdAt,
    context: inferContext(r),
    reviewId: r.reviewId,
    visitId: r.visitId,
    conditionReportId: r.conditionReportId,
    tripReportId: r.tripReportId,
    facility: {
      id: r.facility.id,
      name: r.facility.name,
      slug: r.facility.slug,
      sportSlug: r.facility.sports[0]?.sport.slug ?? "",
      sportName: r.facility.sports[0]?.sport.nameCs ?? "",
      city: r.facility.location?.city ?? null,
    },
  }));

  return { photos, total };
}

/**
 * getRecentPhotos — return the most recent user-uploaded photos across ALL
 * active facilities, for homepage / site-wide rails.
 *
 * Always filters out hidden photos and facilities without sports.
 * Sorted by createdAt DESC, limited to the given days window.
 */
export async function getRecentPhotos(
  limit: number = 6,
  days: number = 14
): Promise<RecentHomePhoto[]> {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await prisma.userPhoto.findMany({
      where: {
        isHidden: false,
        createdAt: { gte: since },
        facility: { isActive: true, sports: { some: {} } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        url: true,
        alt: true,
        createdAt: true,
        reviewId: true,
        visitId: true,
        conditionReportId: true,
        tripReportId: true,
        user: { select: { id: true, name: true } },
        facility: {
          select: {
            id: true,
            name: true,
            slug: true,
            sports: {
              take: 1,
              select: { sport: { select: { slug: true, nameCs: true } } },
            },
          },
        },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      url: r.url,
      alt: r.alt,
      createdAt: r.createdAt,
      context: inferContext(r),
      reviewId: r.reviewId,
      visitId: r.visitId,
      conditionReportId: r.conditionReportId,
      tripReportId: r.tripReportId,
      user: r.user,
      facility: {
        id: r.facility.id,
        name: r.facility.name,
        slug: r.facility.slug,
        sportSlug: r.facility.sports[0]?.sport.slug ?? null,
        sportName: r.facility.sports[0]?.sport.nameCs ?? null,
      },
    }));
  } catch {
    return [];
  }
}

const CONTEXT_LABEL_CS: Record<PhotoContext, string> = {
  review: "z recenze",
  checkin: "z check-inu",
  condition: "z reportu",
  "trip-report": "ze záznamu výstupu",
};

export function contextLabel(ctx: PhotoContext | null): string {
  if (!ctx) return "od návštěvníka";
  return CONTEXT_LABEL_CS[ctx];
}

/**
 * Build a source-page link for a photo. Returns the facility URL if no
 * specific source can be determined (defensive default).
 */
export function photoSourceHref(
  photo: Pick<FacilityPhoto, "context" | "reviewId" | "visitId" | "conditionReportId" | "tripReportId">,
  facilityHref: string
): string {
  if (photo.context === "review" && photo.reviewId) {
    return `${facilityHref}#recenze`;
  }
  if (photo.context === "condition" && photo.conditionReportId) {
    return `${facilityHref}#podminky`;
  }
  if (photo.context === "checkin" && photo.visitId) {
    return `${facilityHref}#recenze`;
  }
  if (photo.context === "trip-report" && photo.tripReportId) {
    return `${facilityHref}/zaznam-vystupu`;
  }
  return facilityHref;
}

export interface PhotoOfTheWeekWinner {
  weekKey: string;
  voteCount: number;
  awardedAt: Date;
  photo: {
    id: string;
    url: string;
    alt: string | null;
    createdAt: Date;
  };
  user: {
    id: string;
    name: string | null;
  };
  facility: {
    id: string;
    name: string;
    slug: string;
    sportSlug: string | null;
    sportName: string | null;
  };
}

/**
 * getLatestPhotoOfTheWeek — fetch the most recently awarded winner.
 * Returns null if no winners exist yet (first weeks after launch).
 */
export async function getLatestPhotoOfTheWeek(): Promise<PhotoOfTheWeekWinner | null> {
  try {
    const row = await prisma.photoOfTheWeek.findFirst({
      orderBy: { awardedAt: "desc" },
      select: {
        weekKey: true,
        voteCount: true,
        awardedAt: true,
        photo: {
          select: {
            id: true,
            url: true,
            alt: true,
            createdAt: true,
            isHidden: true,
            user: { select: { id: true, name: true } },
            facility: {
              select: {
                id: true,
                name: true,
                slug: true,
                sports: {
                  take: 1,
                  select: { sport: { select: { slug: true, nameCs: true } } },
                },
              },
            },
          },
        },
      },
    });
    if (!row || !row.photo || row.photo.isHidden) return null;
    return {
      weekKey: row.weekKey,
      voteCount: row.voteCount,
      awardedAt: row.awardedAt,
      photo: {
        id: row.photo.id,
        url: row.photo.url,
        alt: row.photo.alt,
        createdAt: row.photo.createdAt,
      },
      user: row.photo.user,
      facility: {
        id: row.photo.facility.id,
        name: row.photo.facility.name,
        slug: row.photo.facility.slug,
        sportSlug: row.photo.facility.sports[0]?.sport.slug ?? null,
        sportName: row.photo.facility.sports[0]?.sport.nameCs ?? null,
      },
    };
  } catch {
    return null;
  }
}

/**
 * getPhotoOfTheWeekArchive — list all awarded winners, newest first.
 * Used by /foto-tydne archive page. ISR-safe: deterministic order, no auth.
 */
export async function getPhotoOfTheWeekArchive(limit = 100): Promise<PhotoOfTheWeekWinner[]> {
  try {
    const rows = await prisma.photoOfTheWeek.findMany({
      orderBy: { awardedAt: "desc" },
      take: limit,
      select: {
        weekKey: true,
        voteCount: true,
        awardedAt: true,
        photo: {
          select: {
            id: true,
            url: true,
            alt: true,
            createdAt: true,
            isHidden: true,
            user: { select: { id: true, name: true } },
            facility: {
              select: {
                id: true,
                name: true,
                slug: true,
                sports: {
                  take: 1,
                  select: { sport: { select: { slug: true, nameCs: true } } },
                },
              },
            },
          },
        },
      },
    });
    return rows
      .filter((r) => r.photo && !r.photo.isHidden)
      .map((row) => ({
        weekKey: row.weekKey,
        voteCount: row.voteCount,
        awardedAt: row.awardedAt,
        photo: {
          id: row.photo.id,
          url: row.photo.url,
          alt: row.photo.alt,
          createdAt: row.photo.createdAt,
        },
        user: row.photo.user,
        facility: {
          id: row.photo.facility.id,
          name: row.photo.facility.name,
          slug: row.photo.facility.slug,
          sportSlug: row.photo.facility.sports[0]?.sport.slug ?? null,
          sportName: row.photo.facility.sports[0]?.sport.nameCs ?? null,
        },
      }));
  } catch {
    return [];
  }
}

/** Build deterministic alt text for a facility photo. */
export function buildPhotoAlt(args: {
  facilityName: string;
  sportName: string;
  authorName: string | null;
  fallback?: string | null;
}): string {
  if (args.fallback && args.fallback.trim().length > 0) return args.fallback;
  const author = args.authorName?.trim() || "uživatele hraju.cz";
  return `${args.facilityName} — ${args.sportName} — foto od ${author}`;
}

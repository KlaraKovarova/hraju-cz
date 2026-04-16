import { prisma } from "@/lib/prisma";

export type PhotoContext = "review" | "checkin" | "condition";

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

const DEFAULT_PAGE_SIZE = 48;

function inferContext(p: {
  reviewId: string | null;
  visitId: string | null;
  conditionReportId: string | null;
}): PhotoContext | null {
  if (p.reviewId) return "review";
  if (p.visitId) return "checkin";
  if (p.conditionReportId) return "condition";
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
  } = { facilityId, isHidden: false };

  if (opts.context === "review") where.reviewId = { not: null };
  else if (opts.context === "checkin") where.visitId = { not: null };
  else if (opts.context === "condition") where.conditionReportId = { not: null };

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
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.userPhoto.count({ where }),
  ]);

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
  }));

  return { photos, total };
}

const CONTEXT_LABEL_CS: Record<PhotoContext, string> = {
  review: "z recenze",
  checkin: "z check-inu",
  condition: "z reportu",
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
  photo: Pick<FacilityPhoto, "context" | "reviewId" | "visitId" | "conditionReportId">,
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
  return facilityHref;
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

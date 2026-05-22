/**
 * Pure utilities and types shared between server- and client-side photo code.
 *
 * Lives separately from `@/lib/photos` because that module imports `@/lib/prisma`,
 * which transitively pulls in `pg` (Node-only: `dns`, `net`, `tls`, `fs`).
 * Bundling `pg` into a client component breaks the Next.js build.
 *
 * Client components must import from `@/lib/photos-shared`, never from
 * `@/lib/photos`.
 */

export type PhotoContext = "review" | "checkin" | "condition" | "trip-report";

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

/** Minimal photo shape used by photoSourceHref. */
export interface PhotoSourceFields {
  context: PhotoContext | null;
  reviewId: string | null;
  visitId: string | null;
  conditionReportId: string | null;
  tripReportId: string | null;
}

/**
 * Build a source-page link for a photo. Returns the facility URL if no
 * specific source can be determined (defensive default).
 */
export function photoSourceHref(
  photo: PhotoSourceFields,
  facilityHref: string,
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

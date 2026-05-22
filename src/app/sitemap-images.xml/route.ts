import { prisma } from "@/lib/prisma";
import { SPORTS } from "@/lib/sports";
import { buildPhotoAlt } from "@/lib/photos";

/**
 * Google image sitemap — SIL-663.
 *
 * Surfaces user-uploaded facility photos to Google Images. One <url> entry per
 * facility (canonical sport slug chosen alphabetically for determinism), with
 * up to 10 nested <image:image> children. Each image carries the absolute CDN
 * URL, a deterministic <image:title> (alt text), and an optional
 * <image:caption> drawn from the review/check-in/condition-report source.
 *
 * SIL-677: also emits one <url> per trip report with photos, parented at the
 * per-trip-report deep-link page (`/sport/{sport}/{slug}/vystup/{id}`) so
 * trip-report photos surface in Google Images alongside the facility gallery.
 *
 * Capped at the Google-spec 50,000 <url> per sitemap. Pagination would go in
 * sitemap-images-1.xml, sitemap-images-2.xml — not needed at current scale.
 */

const BASE_URL = "https://www.hraju.cz";
const MAX_IMAGES_PER_URL = 10;
const MAX_URLS = 50000;
const CAPTION_MAX_LEN = 200;

// Force dynamic rendering so `next build` doesn't try to pre-fetch the DB.
// On Hostinger the build environment may not see DATABASE_URL, which would
// previously fail the entire build with a Postgres auth error. Rendered on
// every request at runtime; sitemaps aren't hit frequently enough to matter.
export const dynamic = "force-dynamic";
export const revalidate = 86400;

type SportMeta = { slug: string; nameCs: string };

const SPORT_BY_SLUG: Map<string, SportMeta> = new Map(
  SPORTS.map((s) => [s.slug, { slug: s.slug, nameCs: s.nameCs }])
);

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncateCaption(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const collapsed = raw.replace(/\s+/g, " ").trim();
  if (collapsed.length === 0) return null;
  if (collapsed.length <= CAPTION_MAX_LEN) return collapsed;
  return `${collapsed.slice(0, CAPTION_MAX_LEN - 1).trimEnd()}…`;
}

function pickCanonicalSportSlug(sportSlugs: string[]): string | null {
  const visible = sportSlugs.filter((s) => SPORT_BY_SLUG.has(s));
  if (visible.length === 0) return null;
  return [...visible].sort()[0];
}

export async function GET() {
  // Wrap the facility query so a DB outage (or missing DATABASE_URL during
  // build) produces an empty-but-valid sitemap instead of a hard 500.
  const facilitiesQuery = prisma.facility.findMany({
    where: {
      isActive: true,
      userPhotos: { some: { isHidden: false } },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      updatedAt: true,
      sports: { select: { sport: { select: { slug: true } } } },
      userPhotos: {
        where: { isHidden: false },
        orderBy: { createdAt: "desc" },
        take: MAX_IMAGES_PER_URL,
        select: {
          id: true,
          url: true,
          alt: true,
          createdAt: true,
          user: { select: { name: true } },
          review: { select: { text: true } },
          visit: { select: { note: true } },
          conditionReport: { select: { comment: true } },
        },
      },
    },
    take: MAX_URLS,
  });
  const facilities: Awaited<typeof facilitiesQuery> = await facilitiesQuery.catch((err) => {
    console.error("[sitemap-images] facility.findMany failed:", err);
    return [];
  });

  const urls: string[] = [];

  for (const facility of facilities) {
    const sportSlugs = facility.sports.map((fs) => fs.sport.slug);
    const canonicalSlug = pickCanonicalSportSlug(sportSlugs);
    if (!canonicalSlug) continue;
    const sportMeta = SPORT_BY_SLUG.get(canonicalSlug)!;

    const imageNodes: string[] = [];
    for (const photo of facility.userPhotos) {
      if (!photo.url) continue;
      const title = escapeXml(
        buildPhotoAlt({
          facilityName: facility.name,
          sportName: sportMeta.nameCs,
          authorName: photo.user?.name ?? null,
          fallback: photo.alt,
        })
      );
      const captionRaw =
        photo.review?.text ?? photo.visit?.note ?? photo.conditionReport?.comment ?? null;
      const captionTrimmed = truncateCaption(captionRaw);

      const parts = [
        `    <image:image>`,
        `      <image:loc>${escapeXml(photo.url)}</image:loc>`,
        `      <image:title>${title}</image:title>`,
      ];
      if (captionTrimmed) {
        parts.push(`      <image:caption>${escapeXml(captionTrimmed)}</image:caption>`);
      }
      parts.push(`    </image:image>`);
      imageNodes.push(parts.join("\n"));
    }

    if (imageNodes.length === 0) continue;

    const pageUrl = `${BASE_URL}/sport/${canonicalSlug}/${facility.slug}`;
    const lastmod = facility.updatedAt?.toISOString();

    const block = [
      `  <url>`,
      `    <loc>${escapeXml(pageUrl)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      ...imageNodes,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n");

    urls.push(block);
  }

  // SIL-677 — per-trip-report <url> entries. Each trip report with at least
  // one visible photo becomes its own sitemap URL, with nested <image:image>
  // children for every photo on that report.
  if (urls.length < MAX_URLS) {
    const remaining = MAX_URLS - urls.length;
    const tripReportsQuery = prisma.tripReport.findMany({
      where: {
        isHidden: false,
        photos: { some: { isHidden: false } },
      },
      orderBy: { createdAt: "desc" },
      take: remaining,
      select: {
        id: true,
        dateClimbed: true,
        updatedAt: true,
        facility: {
          select: {
            slug: true,
            name: true,
            sports: { select: { sport: { select: { slug: true } } } },
          },
        },
        photos: {
          where: { isHidden: false },
          orderBy: { createdAt: "asc" },
          take: MAX_IMAGES_PER_URL,
          select: { id: true, url: true, alt: true },
        },
      },
    });
    const tripReports: Awaited<typeof tripReportsQuery> = await tripReportsQuery.catch((err) => {
      console.error("[sitemap-images] tripReport.findMany failed:", err);
      return [];
    });

    for (const report of tripReports) {
      const sportSlugs = report.facility.sports.map((fs) => fs.sport.slug);
      const canonicalSlug = pickCanonicalSportSlug(sportSlugs);
      if (!canonicalSlug) continue;

      const dateIso = report.dateClimbed.toISOString().slice(0, 10);
      const imageTitle = escapeXml(`${report.facility.name} — ${dateIso}`);

      const imageNodes: string[] = [];
      for (const photo of report.photos) {
        if (!photo.url) continue;
        const parts = [
          `    <image:image>`,
          `      <image:loc>${escapeXml(photo.url)}</image:loc>`,
          `      <image:title>${imageTitle}</image:title>`,
          `    </image:image>`,
        ];
        imageNodes.push(parts.join("\n"));
      }
      if (imageNodes.length === 0) continue;

      const pageUrl = `${BASE_URL}/sport/${canonicalSlug}/${report.facility.slug}/vystup/${report.id}`;
      const lastmod = report.updatedAt?.toISOString();

      const block = [
        `  <url>`,
        `    <loc>${escapeXml(pageUrl)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        ...imageNodes,
        `  </url>`,
      ]
        .filter(Boolean)
        .join("\n");

      urls.push(block);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}

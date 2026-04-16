// SIL-656 — Weekly auto-curated "nejlepší podmínky tento víkend" scoring.
//
// Selects facilities (ferraty + lezení MVP) with recent, predominantly positive
// condition reports and ranks them for the /nejlepsi-podminky page.
//
// Keep this module framework-free (pure data + Prisma) so it can be reused by
// email digests (Phase 3) and the homepage rail without UI coupling.

import { prisma } from "@/lib/prisma";
import {
  ALLOWED_CONDITION_RATINGS,
  CONDITION_RATING_META,
  type ConditionRating,
} from "@/lib/conditions";

/** Sports curated in this MVP. Ferraty + lezení only until volume grows. */
export const CURATED_SPORT_SLUGS: readonly string[] = ["ferraty", "lezeni"] as const;

/** Look-back window for "recent" reports — matches the spec (this weekend). */
export const CURATION_WINDOW_DAYS = 7;

/** Minimum non-hidden reports a facility needs to qualify. */
export const CURATION_MIN_REPORTS = 2;

/** Positive-share threshold: 70% of reports must be `excellent` or `good`. */
export const CURATION_POSITIVE_RATIO = 0.7;

/** Max ranking rows rendered on the page. */
export const CURATION_LIMIT = 10;

/** Warm-empty-state threshold — under this, we show the encouragement copy. */
export const CURATION_EMPTY_STATE_MIN = 5;

export type RatingDistribution = Record<ConditionRating, number>;

export type CurationRow = {
  rank: number;
  facility: {
    id: string;
    name: string;
    slug: string;
    sportSlug: string;
    sportNameCs: string;
    city: string;
    region: string | null;
  };
  reportCount: number;
  positiveCount: number;
  positiveRatio: number; // 0–1
  score: number; // positiveRatio * reportCount
  distribution: RatingDistribution;
  latestExcerpt: {
    text: string;
    rating: ConditionRating;
    createdAt: Date;
  } | null;
};

/**
 * Derive an ISO-week label `"<year>-tyden-<ww>"` for a given date.
 * Used for hero copy + sitemap hints; route itself stays at `/nejlepsi-podminky`.
 */
export function isoWeekLabel(date: Date = new Date()): { year: number; week: number; slug: string } {
  // Thursday-in-current-week determines the ISO year (ISO 8601 §2.4).
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const year = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const slug = `${year}-tyden-${String(week).padStart(2, "0")}`;
  return { year, week, slug };
}

function emptyDistribution(): RatingDistribution {
  return ALLOWED_CONDITION_RATINGS.reduce((acc, r) => {
    acc[r] = 0;
    return acc;
  }, {} as RatingDistribution);
}

function excerpt(text: string | null, max = 160): string | null {
  if (!text) return null;
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + "…";
}

/**
 * Fetch recent reports for the curated sports and aggregate per facility.
 *
 * We deliberately do this in app code (not raw SQL) so the scoring is easy to
 * tune and test without another migration. Volume is tiny (days × reports),
 * so a single `findMany` is cheaper than multiple aggregate queries.
 */
export async function getWeekendConditionsRanking(
  now: Date = new Date()
): Promise<CurationRow[]> {
  const since = new Date(now.getTime() - CURATION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  try {
    const reports = await prisma.conditionReport.findMany({
      where: {
        isHidden: false,
        createdAt: { gte: since },
        facility: {
          isActive: true,
          sports: { some: { sport: { slug: { in: [...CURATED_SPORT_SLUGS] } } } },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        facility: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: { select: { city: true, region: true } },
            sports: {
              select: { sport: { select: { slug: true, nameCs: true } } },
            },
          },
        },
      },
    });

    // Bucket by facility
    type Bucket = {
      facility: (typeof reports)[number]["facility"];
      reports: (typeof reports)[number][];
    };
    const byFacility = new Map<string, Bucket>();
    for (const r of reports) {
      const fid = r.facility.id;
      let bucket = byFacility.get(fid);
      if (!bucket) {
        bucket = { facility: r.facility, reports: [] };
        byFacility.set(fid, bucket);
      }
      bucket.reports.push(r);
    }

    const rows: Omit<CurationRow, "rank">[] = [];
    for (const { facility, reports: items } of byFacility.values()) {
      if (items.length < CURATION_MIN_REPORTS) continue;

      const distribution = emptyDistribution();
      for (const r of items) {
        const rating = r.rating as ConditionRating;
        if (rating in distribution) distribution[rating] += 1;
      }
      const positiveCount = distribution.excellent + distribution.good;
      const positiveRatio = positiveCount / items.length;
      if (positiveRatio < CURATION_POSITIVE_RATIO) continue;

      // Pick the primary curated sport (prefer ferraty, then lezení, then first).
      const curatedSport =
        facility.sports.find((s) => s.sport.slug === "ferraty")?.sport ??
        facility.sports.find((s) => s.sport.slug === "lezeni")?.sport ??
        facility.sports[0]?.sport;
      if (!curatedSport) continue;

      // Latest non-empty excerpt (items are already sorted desc by createdAt).
      let latestExcerpt: CurationRow["latestExcerpt"] = null;
      for (const r of items) {
        const text = excerpt(r.comment);
        if (text) {
          latestExcerpt = {
            text,
            rating: r.rating as ConditionRating,
            createdAt: r.createdAt,
          };
          break;
        }
      }

      rows.push({
        facility: {
          id: facility.id,
          name: facility.name,
          slug: facility.slug,
          sportSlug: curatedSport.slug,
          sportNameCs: curatedSport.nameCs,
          city: facility.location?.city ?? "",
          region: facility.location?.region ?? null,
        },
        reportCount: items.length,
        positiveCount,
        positiveRatio,
        score: positiveRatio * items.length,
        distribution,
        latestExcerpt,
      });
    }

    // Sort: score desc, then reportCount desc, then name asc as deterministic tiebreaker.
    rows.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.reportCount !== a.reportCount) return b.reportCount - a.reportCount;
      return a.facility.name.localeCompare(b.facility.name, "cs");
    });

    return rows.slice(0, CURATION_LIMIT).map((row, i) => ({ rank: i + 1, ...row }));
  } catch {
    return [];
  }
}

/** Schema.org `ItemList` payload for the top facilities. */
export function buildItemListJsonLd(rows: CurationRow[], baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nejlepší podmínky tento víkend — ferraty a lezení",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: rows.length,
    itemListElement: rows.map((row) => ({
      "@type": "ListItem",
      position: row.rank,
      url: `${baseUrl}/sport/${row.facility.sportSlug}/${row.facility.slug}#podminky`,
      name: row.facility.name,
    })),
  };
}

/** Pretty label for the rating meta (re-exported for UI convenience). */
export function ratingLabel(rating: ConditionRating): string {
  return CONDITION_RATING_META[rating].labelCs;
}

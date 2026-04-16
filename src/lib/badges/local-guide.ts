import { prisma } from "@/lib/prisma";

// ─── "Místní průvodce" (Local Guide) tier system ──────────────────────────
//
// Three tiers, each backed by its own UserBadge slug so the existing badge
// catalog (challenges.ts) and notification pipeline can award them without
// any new infra. Tiers are *retained* once earned (UserBadge has a unique
// constraint per slug); the "current display tier" is computed at render
// time from the highest-earned slug.
//
// Criteria (see SIL-659):
//   - bronze (Průvodce):       5+ ConditionReports in last 90 days
//   - silver (Zkušený průvodce): 15+ ConditionReports + 50+ helpful votes
//   - gold   (Expert průvodce):  30+ ConditionReports + 150+ helpful votes
//                                + at least 3 distinct facilities

export type LocalGuideTier = "bronze" | "silver" | "gold";

export const LOCAL_GUIDE_BADGE_SLUGS: Record<LocalGuideTier, string> = {
  bronze: "mistni-pruvodce-bronze",
  silver: "mistni-pruvodce-silver",
  gold: "mistni-pruvodce-gold",
};

export const LOCAL_GUIDE_TIER_LABELS: Record<LocalGuideTier, string> = {
  bronze: "Průvodce",
  silver: "Zkušený průvodce",
  gold: "Expert průvodce",
};

export const LOCAL_GUIDE_TIER_EMOJI = "🗺️";

// Threshold definitions used by both badge.check() and progress display.
export const LOCAL_GUIDE_THRESHOLDS = {
  bronze: { reports: 5, helpful: 0, facilities: 0, windowDays: 90 },
  silver: { reports: 15, helpful: 50, facilities: 0, windowDays: null },
  gold: { reports: 30, helpful: 150, facilities: 3, windowDays: null },
} as const;

const SLUG_TO_TIER = new Map<string, LocalGuideTier>([
  [LOCAL_GUIDE_BADGE_SLUGS.bronze, "bronze"],
  [LOCAL_GUIDE_BADGE_SLUGS.silver, "silver"],
  [LOCAL_GUIDE_BADGE_SLUGS.gold, "gold"],
]);

const TIER_RANK: Record<LocalGuideTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

function pickHighestTier(tiers: LocalGuideTier[]): LocalGuideTier | null {
  if (tiers.length === 0) return null;
  return tiers.reduce((best, t) => (TIER_RANK[t] > TIER_RANK[best] ? t : best));
}

/** Per-user condition-report stats used for both eligibility checks and progress display. */
export interface LocalGuideStats {
  reportsLast90Days: number;
  reportsTotal: number;
  helpfulTotal: number;
  distinctFacilities: number;
}

export async function getLocalGuideStats(userId: string): Promise<LocalGuideStats> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const [reportsLast90Days, reportsTotal, helpfulAgg, distinctFacilities] = await Promise.all([
    prisma.conditionReport.count({
      where: { userId, isHidden: false, createdAt: { gte: ninetyDaysAgo } },
    }),
    prisma.conditionReport.count({
      where: { userId, isHidden: false },
    }),
    prisma.conditionReport.aggregate({
      where: { userId, isHidden: false },
      _sum: { helpful: true },
    }),
    prisma.conditionReport.findMany({
      where: { userId, isHidden: false },
      select: { facilityId: true },
      distinct: ["facilityId"],
    }),
  ]);

  return {
    reportsLast90Days,
    reportsTotal,
    helpfulTotal: helpfulAgg._sum.helpful ?? 0,
    distinctFacilities: distinctFacilities.length,
  };
}

export function tierQualifiesFromStats(
  tier: LocalGuideTier,
  stats: LocalGuideStats
): boolean {
  const t = LOCAL_GUIDE_THRESHOLDS[tier];
  if (tier === "bronze") return stats.reportsLast90Days >= t.reports;
  if (tier === "silver") {
    return stats.reportsTotal >= t.reports && stats.helpfulTotal >= t.helpful;
  }
  // gold
  return (
    stats.reportsTotal >= t.reports &&
    stats.helpfulTotal >= t.helpful &&
    stats.distinctFacilities >= t.facilities
  );
}

/**
 * Resolve the highest local-guide tier currently held by each user id.
 * Used by the conditions API to render badges next to author names without
 * an N+1 query.
 */
export async function batchLocalGuideTiers(
  userIds: string[]
): Promise<Map<string, LocalGuideTier>> {
  const result = new Map<string, LocalGuideTier>();
  if (userIds.length === 0) return result;
  const unique = Array.from(new Set(userIds));
  const badges = await prisma.userBadge.findMany({
    where: {
      userId: { in: unique },
      badgeSlug: {
        in: [
          LOCAL_GUIDE_BADGE_SLUGS.bronze,
          LOCAL_GUIDE_BADGE_SLUGS.silver,
          LOCAL_GUIDE_BADGE_SLUGS.gold,
        ],
      },
    },
    select: { userId: true, badgeSlug: true },
  });
  const byUser = new Map<string, LocalGuideTier[]>();
  for (const b of badges) {
    const tier = SLUG_TO_TIER.get(b.badgeSlug);
    if (!tier) continue;
    const arr = byUser.get(b.userId) ?? [];
    arr.push(tier);
    byUser.set(b.userId, arr);
  }
  for (const [uid, tiers] of byUser) {
    const best = pickHighestTier(tiers);
    if (best) result.set(uid, best);
  }
  return result;
}

export interface LocalGuideProgressSummary {
  currentTier: LocalGuideTier | null;
  currentTierLabel: string | null;
  nextTier: LocalGuideTier | null;
  nextTierLabel: string | null;
  /** Short Czech hint, e.g. "Ještě 2 reporty do úrovně Zkušený průvodce". null if maxed. */
  nextTierHint: string | null;
  stats: LocalGuideStats;
}

function pluralizeReports(n: number): string {
  if (n === 1) return "report";
  if (n >= 2 && n <= 4) return "reporty";
  return "reportů";
}

function pluralizeVotes(n: number): string {
  if (n === 1) return "hlas";
  if (n >= 2 && n <= 4) return "hlasy";
  return "hlasů";
}

function pluralizeFacilities(n: number): string {
  if (n === 1) return "sportoviště";
  if (n >= 2 && n <= 4) return "sportoviště";
  return "sportovišť";
}

function nextTierOf(t: LocalGuideTier | null): LocalGuideTier | null {
  if (t === null) return "bronze";
  if (t === "bronze") return "silver";
  if (t === "silver") return "gold";
  return null;
}

function buildHint(target: LocalGuideTier, stats: LocalGuideStats): string | null {
  const t = LOCAL_GUIDE_THRESHOLDS[target];
  const label = LOCAL_GUIDE_TIER_LABELS[target];
  const parts: string[] = [];
  if (target === "bronze") {
    const remaining = Math.max(0, t.reports - stats.reportsLast90Days);
    if (remaining > 0) {
      parts.push(`${remaining} ${pluralizeReports(remaining)} (za 90 dní)`);
    }
  } else {
    const reportsRemaining = Math.max(0, t.reports - stats.reportsTotal);
    if (reportsRemaining > 0) {
      parts.push(`${reportsRemaining} ${pluralizeReports(reportsRemaining)}`);
    }
    const helpfulRemaining = Math.max(0, t.helpful - stats.helpfulTotal);
    if (helpfulRemaining > 0) {
      parts.push(`${helpfulRemaining} ${pluralizeVotes(helpfulRemaining)} „užitečné“`);
    }
    if (target === "gold") {
      const facilityRemaining = Math.max(0, t.facilities - stats.distinctFacilities);
      if (facilityRemaining > 0) {
        parts.push(`${facilityRemaining} další ${pluralizeFacilities(facilityRemaining)}`);
      }
    }
  }
  if (parts.length === 0) return null;
  return `Ještě ${parts.join(" + ")} do úrovně ${label}`;
}

/** Build progress summary for /muj-ucet "Místní průvodce" row. */
export async function getLocalGuideProgress(userId: string): Promise<LocalGuideProgressSummary> {
  const stats = await getLocalGuideStats(userId);

  // Determine highest tier currently *qualifying* (used as display tier even if
  // the badge row hasn't been written yet — covers the moment between report
  // creation and the fire-and-forget badge check completing).
  const currentTier = (["gold", "silver", "bronze"] as LocalGuideTier[]).find((t) =>
    tierQualifiesFromStats(t, stats)
  ) ?? null;

  const nextTier = nextTierOf(currentTier);
  return {
    currentTier,
    currentTierLabel: currentTier ? LOCAL_GUIDE_TIER_LABELS[currentTier] : null,
    nextTier,
    nextTierLabel: nextTier ? LOCAL_GUIDE_TIER_LABELS[nextTier] : null,
    nextTierHint: nextTier ? buildHint(nextTier, stats) : null,
    stats,
  };
}

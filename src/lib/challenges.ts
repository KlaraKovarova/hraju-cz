import { prisma } from "./prisma";

// ─── Badge definitions ───────────────────────────────────────────────────
export interface BadgeDefinition {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  /** Sport slug required (null = any sport) */
  sportSlug: string | null;
  /** Badge category for grouping */
  category: "sport" | "review" | "community";
  /** Check function returns true if user qualifies */
  check: (ctx: BadgeCheckContext) => Promise<boolean>;
}

export interface BadgeCheckContext {
  userId: string;
}

export interface EarnedBadge {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  earnedAt: Date;
}

// ─── Badge catalog ───────────────────────────────────────────────────────
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    slug: "ferratovy-pruzkumnik",
    name: "Ferratový Průzkumník",
    description: "Check-in na 3+ ferratách",
    emoji: "⛰️",
    sportSlug: "ferraty",
    category: "sport",
    check: async (ctx) => {
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          facility: { sports: { some: { sport: { slug: "ferraty" } } } },
        },
      });
      return count >= 3;
    },
  },
  {
    slug: "lezec",
    name: "Lezec",
    description: "Check-in na 3+ lezeckých stěnách",
    emoji: "🧗",
    sportSlug: "lezeni",
    category: "sport",
    check: async (ctx) => {
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          facility: { sports: { some: { sport: { slug: "lezeni" } } } },
        },
      });
      return count >= 3;
    },
  },
  {
    slug: "recenzent-sezony",
    name: "Recenzent sezóny",
    description: "5+ recenzí za aktuální sezónu",
    emoji: "📝",
    sportSlug: null,
    category: "review",
    check: async (ctx) => {
      const now = new Date();
      const month = now.getMonth(); // 0-11
      // Seasons: spring 3-5, summer 6-8, autumn 9-11, winter 0-2
      let seasonStart: Date;
      if (month >= 3 && month <= 5) {
        seasonStart = new Date(now.getFullYear(), 3, 1);
      } else if (month >= 6 && month <= 8) {
        seasonStart = new Date(now.getFullYear(), 6, 1);
      } else if (month >= 9 && month <= 11) {
        seasonStart = new Date(now.getFullYear(), 9, 1);
      } else {
        // Winter: Dec belongs to this year's winter, Jan-Feb to previous year's
        seasonStart = month === 0 || month <= 2
          ? new Date(now.getFullYear() - (month < 3 ? 0 : 1), 12, 1)
          : new Date(now.getFullYear(), 0, 1);
        // Simpler: Jan-Feb → Dec 1 of prev year
        seasonStart = new Date(now.getFullYear() - 1, 11, 1);
      }

      const count = await prisma.review.count({
        where: {
          userId: ctx.userId,
          isApproved: true,
          createdAt: { gte: seasonStart },
        },
      });
      return count >= 5;
    },
  },
  {
    slug: "pruvodce",
    name: "Průvodce",
    description: "Recenze s 5+ hlasy \u201Eu\u017Eite\u010Dn\u00E9\u201C",
    emoji: "🌟",
    sportSlug: null,
    category: "community",
    check: async (ctx) => {
      const review = await prisma.review.findFirst({
        where: {
          userId: ctx.userId,
          isApproved: true,
          helpful: { gte: 5 },
        },
        select: { id: true },
      });
      return !!review;
    },
  },
];

const BADGE_MAP = new Map(BADGE_DEFINITIONS.map((b) => [b.slug, b]));

export function getBadgeDefinition(slug: string): BadgeDefinition | undefined {
  return BADGE_MAP.get(slug);
}

// ─── Badge operations ────────────────────────────────────────────────────

/** Check all badges for a user and award any newly earned ones. Returns newly earned badge slugs. */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const existing = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeSlug: true },
  });
  const earned = new Set(existing.map((b) => b.badgeSlug));
  const ctx: BadgeCheckContext = { userId };
  const newBadges: string[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (earned.has(badge.slug)) continue;
    const qualifies = await badge.check(ctx);
    if (qualifies) {
      await prisma.userBadge.create({
        data: { userId, badgeSlug: badge.slug },
      });
      newBadges.push(badge.slug);
    }
  }

  return newBadges;
}

/** Check specific badge categories (e.g. only sport badges after check-in). */
export async function checkBadgesByCategory(
  userId: string,
  category: BadgeDefinition["category"]
): Promise<string[]> {
  const existing = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeSlug: true },
  });
  const earned = new Set(existing.map((b) => b.badgeSlug));
  const ctx: BadgeCheckContext = { userId };
  const newBadges: string[] = [];

  for (const badge of BADGE_DEFINITIONS.filter((b) => b.category === category)) {
    if (earned.has(badge.slug)) continue;
    const qualifies = await badge.check(ctx);
    if (qualifies) {
      await prisma.userBadge.create({
        data: { userId, badgeSlug: badge.slug },
      });
      newBadges.push(badge.slug);
    }
  }

  return newBadges;
}

/** Get all earned badges for a user, enriched with definitions. */
export async function getUserBadges(userId: string): Promise<EarnedBadge[]> {
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: "desc" },
  });

  const result: EarnedBadge[] = [];
  for (const ub of userBadges) {
    const def = BADGE_MAP.get(ub.badgeSlug);
    if (!def) continue;
    result.push({
      slug: def.slug,
      name: def.name,
      description: def.description,
      emoji: def.emoji,
      category: def.category,
      earnedAt: ub.earnedAt,
    });
  }
  return result;
}

/** Get badge progress for a user (for challenge display). */
export async function getUserBadgeProgress(userId: string): Promise<
  { slug: string; name: string; description: string; emoji: string; category: string; earned: boolean; progress: number; target: number }[]
> {
  const existing = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeSlug: true },
  });
  const earnedSet = new Set(existing.map((b) => b.badgeSlug));

  // Get season start for Recenzent sezóny
  const now = new Date();
  const month = now.getMonth();
  let seasonStart: Date;
  if (month >= 3 && month <= 5) seasonStart = new Date(now.getFullYear(), 3, 1);
  else if (month >= 6 && month <= 8) seasonStart = new Date(now.getFullYear(), 6, 1);
  else if (month >= 9 && month <= 11) seasonStart = new Date(now.getFullYear(), 9, 1);
  else seasonStart = new Date(now.getFullYear() - 1, 11, 1);

  const [ferratyVisits, lezeniVisits, seasonReviews, maxHelpful] = await Promise.all([
    prisma.visit.count({
      where: { userId, facility: { sports: { some: { sport: { slug: "ferraty" } } } } },
    }),
    prisma.visit.count({
      where: { userId, facility: { sports: { some: { sport: { slug: "lezeni" } } } } },
    }),
    prisma.review.count({
      where: { userId, isApproved: true, createdAt: { gte: seasonStart } },
    }),
    prisma.review.findFirst({
      where: { userId, isApproved: true },
      orderBy: { helpful: "desc" },
      select: { helpful: true },
    }),
  ]);

  return [
    {
      slug: "ferratovy-pruzkumnik",
      name: "Ferratový Průzkumník",
      description: "Check-in na 3+ ferratách",
      emoji: "⛰️",
      category: "sport",
      earned: earnedSet.has("ferratovy-pruzkumnik"),
      progress: Math.min(ferratyVisits, 3),
      target: 3,
    },
    {
      slug: "lezec",
      name: "Lezec",
      description: "Check-in na 3+ lezeckých stěnách",
      emoji: "🧗",
      category: "sport",
      earned: earnedSet.has("lezec"),
      progress: Math.min(lezeniVisits, 3),
      target: 3,
    },
    {
      slug: "recenzent-sezony",
      name: "Recenzent sezóny",
      description: "5+ recenzí za aktuální sezónu",
      emoji: "📝",
      category: "review",
      earned: earnedSet.has("recenzent-sezony"),
      progress: Math.min(seasonReviews, 5),
      target: 5,
    },
    {
      slug: "pruvodce",
      name: "Průvodce",
      description: "Recenze s 5+ hlasy \u201Eu\u017Eite\u010Dn\u00E9\u201C",
      emoji: "🌟",
      category: "community",
      earned: earnedSet.has("pruvodce"),
      progress: Math.min(maxHelpful?.helpful ?? 0, 5),
      target: 5,
    },
  ];
}

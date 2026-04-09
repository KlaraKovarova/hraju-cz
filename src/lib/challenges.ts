import { prisma } from "./prisma";
import { createBadgeNotification, createChallengeNotification, getUnsubscribeToken, buildUnsubscribeUrl } from "./notifications";
import { MONTHLY_CHALLENGES } from "./monthly-challenges";
import { sendBadgeProximityNudgeEmail } from "./email";

// ─── Badge definitions ───────────────────────────────────────────────────
export interface BadgeDefinition {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  /** Sport slug required (null = any sport) */
  sportSlug: string | null;
  /** Badge category for grouping */
  category: "sport" | "review" | "community" | "streak" | "seasonal";
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

  // ─── Sport badges (new) ─────────────────────────────────────────────────
  {
    slug: "plavec",
    name: "Plavec",
    description: "Check-in na 3+ bazénech",
    emoji: "🏊",
    sportSlug: "plavani",
    category: "sport",
    check: async (ctx) => {
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          facility: { sports: { some: { sport: { slug: "plavani" } } } },
        },
      });
      return count >= 3;
    },
  },
  {
    slug: "fitness-guru",
    name: "Fitness Guru",
    description: "Check-in v 5+ fitness centrech",
    emoji: "💪",
    sportSlug: "fitness",
    category: "sport",
    check: async (ctx) => {
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          facility: { sports: { some: { sport: { slug: "fitness" } } } },
        },
      });
      return count >= 5;
    },
  },

  // ─── Community badges (new) ─────────────────────────────────────────────
  {
    slug: "hvezdny-recenzent",
    name: "Hvězdný recenzent",
    description: "10+ schválených recenzí",
    emoji: "⭐",
    sportSlug: null,
    category: "review",
    check: async (ctx) => {
      const count = await prisma.review.count({
        where: { userId: ctx.userId, isApproved: true },
      });
      return count >= 10;
    },
  },
  {
    slug: "pomocnik",
    name: "Pomocník",
    description: "Celkem 10+ hlas\u016F \u201Eu\u017Eite\u010Dn\u00E9\u201C na va\u0161ich recenz\u00EDch",
    emoji: "🤝",
    sportSlug: null,
    category: "community",
    check: async (ctx) => {
      const result = await prisma.review.aggregate({
        where: { userId: ctx.userId, isApproved: true },
        _sum: { helpful: true },
      });
      return (result._sum.helpful ?? 0) >= 10;
    },
  },

  // ─── Streak badges ─────────────────────────────────────────────────────
  {
    slug: "tydenni-serie",
    name: "Týdenní série",
    description: "Check-in ve 3 různé dny v jednom týdnu",
    emoji: "🔥",
    sportSlug: null,
    category: "streak",
    check: async (ctx) => {
      // Check if user has visits on 3+ distinct dates within any Mon-Sun week
      const visits = await prisma.visit.findMany({
        where: { userId: ctx.userId },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      if (visits.length < 3) return false;

      // Group visits by ISO week (Mon-Sun)
      const weekMap = new Map<string, Set<string>>();
      for (const v of visits) {
        const d = new Date(v.createdAt);
        // Get Monday of this week
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        const weekKey = monday.toISOString().slice(0, 10);
        const dateKey = d.toISOString().slice(0, 10);
        if (!weekMap.has(weekKey)) weekMap.set(weekKey, new Set());
        weekMap.get(weekKey)!.add(dateKey);
      }
      return Array.from(weekMap.values()).some((dates) => dates.size >= 3);
    },
  },
  {
    slug: "aktivni-mesic",
    name: "Aktivní měsíc",
    description: "10+ check-inů nebo recenzí za jeden měsíc",
    emoji: "📅",
    sportSlug: null,
    category: "streak",
    check: async (ctx) => {
      // Check if any calendar month has 10+ combined activities
      const [visits, reviews] = await Promise.all([
        prisma.visit.findMany({
          where: { userId: ctx.userId },
          select: { createdAt: true },
        }),
        prisma.review.findMany({
          where: { userId: ctx.userId, isApproved: true },
          select: { createdAt: true },
        }),
      ]);

      const monthCounts = new Map<string, number>();
      for (const v of visits) {
        const key = v.createdAt.toISOString().slice(0, 7); // YYYY-MM
        monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
      }
      for (const r of reviews) {
        const key = r.createdAt.toISOString().slice(0, 7);
        monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
      }
      return Array.from(monthCounts.values()).some((count) => count >= 10);
    },
  },

  // ─── Seasonal badges ────────────────────────────────────────────────────
  {
    slug: "jarni-pruzkumnik",
    name: "Jarní průzkumník",
    description: "5+ různých sportovišť navštívených na jaře 2026",
    emoji: "🌸",
    sportSlug: null,
    category: "seasonal",
    check: async (ctx) => {
      const springStart = new Date(2026, 2, 1); // March 1, 2026
      const springEnd = new Date(2026, 5, 1); // June 1, 2026
      const visits = await prisma.visit.findMany({
        where: {
          userId: ctx.userId,
          createdAt: { gte: springStart, lt: springEnd },
        },
        select: { facilityId: true },
        distinct: ["facilityId"],
      });
      return visits.length >= 5;
    },
  },

  // ─── Summer seasonal badge ─────────────────────────────────────────────
  {
    slug: "letni-pruzkumnik",
    name: "Letní průzkumník",
    description: "5+ různých sportovišť navštívených v létě 2026",
    emoji: "☀️",
    sportSlug: null,
    category: "seasonal",
    check: async (ctx) => {
      const summerStart = new Date(2026, 5, 1); // June 1, 2026
      const summerEnd = new Date(2026, 8, 1); // September 1, 2026
      const visits = await prisma.visit.findMany({
        where: {
          userId: ctx.userId,
          createdAt: { gte: summerStart, lt: summerEnd },
        },
        select: { facilityId: true },
        distinct: ["facilityId"],
      });
      return visits.length >= 5;
    },
  },

  // ─── Monthly challenge badges (April 2026) ──────────────────────────────
  {
    slug: "dubnovy-ferratista",
    name: "Dubnov\u00FD Ferratista",
    description: "3 ferraty navštívené v dubnu 2026",
    emoji: "\u26F0\uFE0F",
    sportSlug: "ferraty",
    category: "seasonal",
    check: async (ctx) => {
      const aprilStart = new Date(2026, 3, 1);
      const aprilEnd = new Date(2026, 4, 1);
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          createdAt: { gte: aprilStart, lt: aprilEnd },
          facility: { sports: { some: { sport: { slug: "ferraty" } } } },
        },
      });
      return count >= 3;
    },
  },
  {
    slug: "dubnovy-lezec",
    name: "Dubnov\u00FD Lezec",
    description: "2 lezeck\u00E9 st\u011Bny nav\u0161t\u00EDven\u00E9 v dubnu 2026",
    emoji: "\uD83E\uDDD7",
    sportSlug: "lezeni",
    category: "seasonal",
    check: async (ctx) => {
      const aprilStart = new Date(2026, 3, 1);
      const aprilEnd = new Date(2026, 4, 1);
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          createdAt: { gte: aprilStart, lt: aprilEnd },
          facility: { sports: { some: { sport: { slug: "lezeni" } } } },
        },
      });
      return count >= 2;
    },
  },

  // ─── Monthly challenge badges (May 2026) ───────────────────────────────
  {
    slug: "kvetnovy-ferratista",
    name: "Kv\u011Btnov\u00FD Ferratista",
    description: "5 ferrat nav\u0161t\u00EDven\u00FDch v kv\u011Btnu 2026",
    emoji: "\u26F0\uFE0F",
    sportSlug: "ferraty",
    category: "seasonal",
    check: async (ctx) => {
      const mayStart = new Date(2026, 4, 1);
      const mayEnd = new Date(2026, 5, 1);
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          createdAt: { gte: mayStart, lt: mayEnd },
          facility: { sports: { some: { sport: { slug: "ferraty" } } } },
        },
      });
      return count >= 5;
    },
  },
  {
    slug: "kvetnovy-lezec",
    name: "Kv\u011Btnov\u00FD Lezec",
    description: "3 lezeck\u00E9 st\u011Bny nav\u0161t\u00EDven\u00E9 v kv\u011Btnu 2026",
    emoji: "\uD83E\uDDD7",
    sportSlug: "lezeni",
    category: "seasonal",
    check: async (ctx) => {
      const mayStart = new Date(2026, 4, 1);
      const mayEnd = new Date(2026, 5, 1);
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          createdAt: { gte: mayStart, lt: mayEnd },
          facility: { sports: { some: { sport: { slug: "lezeni" } } } },
        },
      });
      return count >= 3;
    },
  },

  // ─── Monthly challenge badges (June 2026) ──────────────────────────────
  {
    slug: "cervnovy-ferratista",
    name: "\u010Cervnov\u00FD Ferratista",
    description: "5 ferrat zdolan\u00FDch v \u010Dervnu 2026",
    emoji: "\u26F0\uFE0F",
    sportSlug: "ferraty",
    category: "seasonal",
    check: async (ctx) => {
      const juneStart = new Date(2026, 5, 1);
      const juneEnd = new Date(2026, 6, 1);
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          createdAt: { gte: juneStart, lt: juneEnd },
          facility: { sports: { some: { sport: { slug: "ferraty" } } } },
        },
      });
      return count >= 5;
    },
  },
  {
    slug: "cervnovy-lezec",
    name: "\u010Cervnov\u00FD Lezec",
    description: "3 lezeck\u00E9 st\u011Bny nav\u0161t\u00EDven\u00E9 v \u010Dervnu 2026",
    emoji: "\uD83E\uDDD7",
    sportSlug: "lezeni",
    category: "seasonal",
    check: async (ctx) => {
      const juneStart = new Date(2026, 5, 1);
      const juneEnd = new Date(2026, 6, 1);
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          createdAt: { gte: juneStart, lt: juneEnd },
          facility: { sports: { some: { sport: { slug: "lezeni" } } } },
        },
      });
      return count >= 3;
    },
  },

  // ─── Monthly challenge badges (July 2026) ─────────────────────────────
  {
    slug: "cervencovy-ferratista",
    name: "\u010Cervencov\u00FD Ferratista",
    description: "5 ferrat zdolan\u00FDch v \u010Dervenci 2026",
    emoji: "\u26F0\uFE0F",
    sportSlug: "ferraty",
    category: "seasonal",
    check: async (ctx) => {
      const julyStart = new Date(2026, 6, 1);
      const julyEnd = new Date(2026, 7, 1);
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          createdAt: { gte: julyStart, lt: julyEnd },
          facility: { sports: { some: { sport: { slug: "ferraty" } } } },
        },
      });
      return count >= 5;
    },
  },
  {
    slug: "cervencovy-lezec",
    name: "\u010Cervencov\u00FD Lezec",
    description: "4 lezeck\u00E9 st\u011Bny nav\u0161t\u00EDven\u00E9 v \u010Dervenci 2026",
    emoji: "\uD83E\uDDD7",
    sportSlug: "lezeni",
    category: "seasonal",
    check: async (ctx) => {
      const julyStart = new Date(2026, 6, 1);
      const julyEnd = new Date(2026, 7, 1);
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          createdAt: { gte: julyStart, lt: julyEnd },
          facility: { sports: { some: { sport: { slug: "lezeni" } } } },
        },
      });
      return count >= 4;
    },
  },

  // ─── Monthly challenge badges (August 2026) ───────────────────────────
  {
    slug: "srpnovy-ferratista",
    name: "Srpnov\u00FD Ferratista",
    description: "5 ferrat zdolan\u00FDch v srpnu 2026",
    emoji: "\u26F0\uFE0F",
    sportSlug: "ferraty",
    category: "seasonal",
    check: async (ctx) => {
      const augStart = new Date(2026, 7, 1);
      const augEnd = new Date(2026, 8, 1);
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          createdAt: { gte: augStart, lt: augEnd },
          facility: { sports: { some: { sport: { slug: "ferraty" } } } },
        },
      });
      return count >= 5;
    },
  },
  {
    slug: "srpnovy-lezec",
    name: "Srpnov\u00FD Lezec",
    description: "4 lezeck\u00E9 st\u011Bny nav\u0161t\u00EDven\u00E9 v srpnu 2026",
    emoji: "\uD83E\uDDD7",
    sportSlug: "lezeni",
    category: "seasonal",
    check: async (ctx) => {
      const augStart = new Date(2026, 7, 1);
      const augEnd = new Date(2026, 8, 1);
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          createdAt: { gte: augStart, lt: augEnd },
          facility: { sports: { some: { sport: { slug: "lezeni" } } } },
        },
      });
      return count >= 4;
    },
  },

  // ─── Monthly challenge badges (September 2026) ────────────────────────
  {
    slug: "zarijovy-ferratista",
    name: "Z\u00E1\u0159ijov\u00FD Ferratista",
    description: "4 ferraty nav\u0161t\u00EDven\u00E9 v z\u00E1\u0159\u00ED 2026",
    emoji: "\u26F0\uFE0F",
    sportSlug: "ferraty",
    category: "seasonal",
    check: async (ctx) => {
      const septStart = new Date(2026, 8, 1);
      const septEnd = new Date(2026, 9, 1);
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          createdAt: { gte: septStart, lt: septEnd },
          facility: { sports: { some: { sport: { slug: "ferraty" } } } },
        },
      });
      return count >= 4;
    },
  },
  {
    slug: "zarijovy-lezec",
    name: "Z\u00E1\u0159ijov\u00FD Lezec",
    description: "4 lezeck\u00E9 st\u011Bny nav\u0161t\u00EDven\u00E9 v z\u00E1\u0159\u00ED 2026",
    emoji: "\uD83E\uDDD7",
    sportSlug: "lezeni",
    category: "seasonal",
    check: async (ctx) => {
      const septStart = new Date(2026, 8, 1);
      const septEnd = new Date(2026, 9, 1);
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          createdAt: { gte: septStart, lt: septEnd },
          facility: { sports: { some: { sport: { slug: "lezeni" } } } },
        },
      });
      return count >= 4;
    },
  },

  // ─── Monthly challenge badges (October 2026) ──────────────────────────
  {
    slug: "rijnovy-ferratista",
    name: "\u0158\u00EDjnov\u00FD Ferratista",
    description: "3 ferraty nav\u0161t\u00EDven\u00E9 v \u0159\u00EDjnu 2026",
    emoji: "\u26F0\uFE0F",
    sportSlug: "ferraty",
    category: "seasonal",
    check: async (ctx) => {
      const octStart = new Date(2026, 9, 1);
      const octEnd = new Date(2026, 10, 1);
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          createdAt: { gte: octStart, lt: octEnd },
          facility: { sports: { some: { sport: { slug: "ferraty" } } } },
        },
      });
      return count >= 3;
    },
  },
  {
    slug: "rijnovy-lezec",
    name: "\u0158\u00EDjnov\u00FD Lezec",
    description: "3 lezeck\u00E9 st\u011Bny nav\u0161t\u00EDven\u00E9 v \u0159\u00EDjnu 2026",
    emoji: "\uD83E\uDDD7",
    sportSlug: "lezeni",
    category: "seasonal",
    check: async (ctx) => {
      const octStart = new Date(2026, 9, 1);
      const octEnd = new Date(2026, 10, 1);
      const count = await prisma.visit.count({
        where: {
          userId: ctx.userId,
          createdAt: { gte: octStart, lt: octEnd },
          facility: { sports: { some: { sport: { slug: "lezeni" } } } },
        },
      });
      return count >= 3;
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

      const challenge = MONTHLY_CHALLENGES.find((c) => c.badgeSlug === badge.slug);
      if (challenge) {
        createChallengeNotification(userId, challenge.title, badge.emoji).catch(() => {});
      } else {
        createBadgeNotification(userId, badge.name, badge.emoji).catch(() => {});
      }
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

      // Fire-and-forget notifications
      const challenge = MONTHLY_CHALLENGES.find((c) => c.badgeSlug === badge.slug);
      if (challenge) {
        createChallengeNotification(userId, challenge.title, badge.emoji).catch(() => {});
      } else {
        createBadgeNotification(userId, badge.name, badge.emoji).catch(() => {});
      }
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
  { slug: string; name: string; description: string; emoji: string; category: string; sportSlug: string | null; earned: boolean; progress: number; target: number }[]
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

  // Spring 2026 dates for seasonal badge
  const springStart = new Date(2026, 2, 1);
  const springEnd = new Date(2026, 5, 1);

  // Summer 2026 dates for seasonal badge
  const summerStart = new Date(2026, 5, 1);
  const summerEnd = new Date(2026, 8, 1);

  const [
    ferratyVisits, lezeniVisits, plavaniVisits, fitnessVisits,
    seasonReviews, totalReviews, maxHelpful, totalHelpful,
    allVisits, approvedReviews, springVisits, summerVisits,
    aprilFerratyVisits, aprilLezeniVisits,
    mayFerratyVisits, mayLezeniVisits,
    juneFerratyVisits, juneLezeniVisits,
    julyFerratyVisits, julyLezeniVisits,
    augFerratyVisits, augLezeniVisits,
    septFerratyVisits, septLezeniVisits,
    octFerratyVisits, octLezeniVisits,
  ] = await Promise.all([
    prisma.visit.count({
      where: { userId, facility: { sports: { some: { sport: { slug: "ferraty" } } } } },
    }),
    prisma.visit.count({
      where: { userId, facility: { sports: { some: { sport: { slug: "lezeni" } } } } },
    }),
    prisma.visit.count({
      where: { userId, facility: { sports: { some: { sport: { slug: "plavani" } } } } },
    }),
    prisma.visit.count({
      where: { userId, facility: { sports: { some: { sport: { slug: "fitness" } } } } },
    }),
    prisma.review.count({
      where: { userId, isApproved: true, createdAt: { gte: seasonStart } },
    }),
    prisma.review.count({
      where: { userId, isApproved: true },
    }),
    prisma.review.findFirst({
      where: { userId, isApproved: true },
      orderBy: { helpful: "desc" },
      select: { helpful: true },
    }),
    prisma.review.aggregate({
      where: { userId, isApproved: true },
      _sum: { helpful: true },
    }),
    // For streak badges: recent visits with dates
    prisma.visit.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    // For streak: monthly review count
    prisma.review.findMany({
      where: { userId, isApproved: true },
      select: { createdAt: true },
    }),
    // Seasonal: distinct spring facilities
    prisma.visit.findMany({
      where: { userId, createdAt: { gte: springStart, lt: springEnd } },
      select: { facilityId: true },
      distinct: ["facilityId"],
    }),
    // Seasonal: distinct summer facilities
    prisma.visit.findMany({
      where: { userId, createdAt: { gte: summerStart, lt: summerEnd } },
      select: { facilityId: true },
      distinct: ["facilityId"],
    }),
    // Monthly challenges: April 2026
    prisma.visit.count({
      where: {
        userId,
        createdAt: { gte: new Date(2026, 3, 1), lt: new Date(2026, 4, 1) },
        facility: { sports: { some: { sport: { slug: "ferraty" } } } },
      },
    }),
    prisma.visit.count({
      where: {
        userId,
        createdAt: { gte: new Date(2026, 3, 1), lt: new Date(2026, 4, 1) },
        facility: { sports: { some: { sport: { slug: "lezeni" } } } },
      },
    }),
    // Monthly challenges: May 2026
    prisma.visit.count({
      where: {
        userId,
        createdAt: { gte: new Date(2026, 4, 1), lt: new Date(2026, 5, 1) },
        facility: { sports: { some: { sport: { slug: "ferraty" } } } },
      },
    }),
    prisma.visit.count({
      where: {
        userId,
        createdAt: { gte: new Date(2026, 4, 1), lt: new Date(2026, 5, 1) },
        facility: { sports: { some: { sport: { slug: "lezeni" } } } },
      },
    }),
    // Monthly challenges: June 2026
    prisma.visit.count({
      where: {
        userId,
        createdAt: { gte: new Date(2026, 5, 1), lt: new Date(2026, 6, 1) },
        facility: { sports: { some: { sport: { slug: "ferraty" } } } },
      },
    }),
    prisma.visit.count({
      where: {
        userId,
        createdAt: { gte: new Date(2026, 5, 1), lt: new Date(2026, 6, 1) },
        facility: { sports: { some: { sport: { slug: "lezeni" } } } },
      },
    }),
    // Monthly challenges: July 2026
    prisma.visit.count({
      where: {
        userId,
        createdAt: { gte: new Date(2026, 6, 1), lt: new Date(2026, 7, 1) },
        facility: { sports: { some: { sport: { slug: "ferraty" } } } },
      },
    }),
    prisma.visit.count({
      where: {
        userId,
        createdAt: { gte: new Date(2026, 6, 1), lt: new Date(2026, 7, 1) },
        facility: { sports: { some: { sport: { slug: "lezeni" } } } },
      },
    }),
    // Monthly challenges: August 2026
    prisma.visit.count({
      where: {
        userId,
        createdAt: { gte: new Date(2026, 7, 1), lt: new Date(2026, 8, 1) },
        facility: { sports: { some: { sport: { slug: "ferraty" } } } },
      },
    }),
    prisma.visit.count({
      where: {
        userId,
        createdAt: { gte: new Date(2026, 7, 1), lt: new Date(2026, 8, 1) },
        facility: { sports: { some: { sport: { slug: "lezeni" } } } },
      },
    }),
    // Monthly challenges: September 2026
    prisma.visit.count({
      where: {
        userId,
        createdAt: { gte: new Date(2026, 8, 1), lt: new Date(2026, 9, 1) },
        facility: { sports: { some: { sport: { slug: "ferraty" } } } },
      },
    }),
    prisma.visit.count({
      where: {
        userId,
        createdAt: { gte: new Date(2026, 8, 1), lt: new Date(2026, 9, 1) },
        facility: { sports: { some: { sport: { slug: "lezeni" } } } },
      },
    }),
    // Monthly challenges: October 2026
    prisma.visit.count({
      where: {
        userId,
        createdAt: { gte: new Date(2026, 9, 1), lt: new Date(2026, 10, 1) },
        facility: { sports: { some: { sport: { slug: "ferraty" } } } },
      },
    }),
    prisma.visit.count({
      where: {
        userId,
        createdAt: { gte: new Date(2026, 9, 1), lt: new Date(2026, 10, 1) },
        facility: { sports: { some: { sport: { slug: "lezeni" } } } },
      },
    }),
  ]);

  // Compute streak: max distinct days in any Mon-Sun week
  let maxWeekDays = 0;
  {
    const weekMap = new Map<string, Set<string>>();
    for (const v of allVisits) {
      const d = new Date(v.createdAt);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      const weekKey = monday.toISOString().slice(0, 10);
      const dateKey = d.toISOString().slice(0, 10);
      if (!weekMap.has(weekKey)) weekMap.set(weekKey, new Set());
      weekMap.get(weekKey)!.add(dateKey);
    }
    for (const dates of weekMap.values()) {
      if (dates.size > maxWeekDays) maxWeekDays = dates.size;
    }
  }

  // Compute best month activity count
  let bestMonth = 0;
  {
    const monthCounts = new Map<string, number>();
    for (const v of allVisits) {
      const key = v.createdAt.toISOString().slice(0, 7);
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    }
    for (const r of approvedReviews) {
      const key = r.createdAt.toISOString().slice(0, 7);
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    }
    for (const count of monthCounts.values()) {
      if (count > bestMonth) bestMonth = count;
    }
  }

  const badgeSportMap = new Map(BADGE_DEFINITIONS.map(b => [b.slug, b.sportSlug]));
  const progress = [
    // Sport badges
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
      slug: "plavec",
      name: "Plavec",
      description: "Check-in na 3+ bazénech",
      emoji: "🏊",
      category: "sport",
      earned: earnedSet.has("plavec"),
      progress: Math.min(plavaniVisits, 3),
      target: 3,
    },
    {
      slug: "fitness-guru",
      name: "Fitness Guru",
      description: "Check-in v 5+ fitness centrech",
      emoji: "💪",
      category: "sport",
      earned: earnedSet.has("fitness-guru"),
      progress: Math.min(fitnessVisits, 5),
      target: 5,
    },
    // Review badges
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
      slug: "hvezdny-recenzent",
      name: "Hvězdný recenzent",
      description: "10+ schválených recenzí",
      emoji: "⭐",
      category: "review",
      earned: earnedSet.has("hvezdny-recenzent"),
      progress: Math.min(totalReviews, 10),
      target: 10,
    },
    // Community badges
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
    {
      slug: "pomocnik",
      name: "Pomocník",
      description: "Celkem 10+ hlas\u016F \u201Eu\u017Eite\u010Dn\u00E9\u201C na va\u0161ich recenz\u00EDch",
      emoji: "🤝",
      category: "community",
      earned: earnedSet.has("pomocnik"),
      progress: Math.min(totalHelpful._sum.helpful ?? 0, 10),
      target: 10,
    },
    // Streak badges
    {
      slug: "tydenni-serie",
      name: "Týdenní série",
      description: "Check-in ve 3 různé dny v jednom týdnu",
      emoji: "🔥",
      category: "streak",
      earned: earnedSet.has("tydenni-serie"),
      progress: Math.min(maxWeekDays, 3),
      target: 3,
    },
    {
      slug: "aktivni-mesic",
      name: "Aktivní měsíc",
      description: "10+ check-inů nebo recenzí za jeden měsíc",
      emoji: "📅",
      category: "streak",
      earned: earnedSet.has("aktivni-mesic"),
      progress: Math.min(bestMonth, 10),
      target: 10,
    },
    // Seasonal badges
    {
      slug: "jarni-pruzkumnik",
      name: "Jarní průzkumník",
      description: "5+ různých sportovišť navštívených na jaře 2026",
      emoji: "🌸",
      category: "seasonal",
      earned: earnedSet.has("jarni-pruzkumnik"),
      progress: Math.min(springVisits.length, 5),
      target: 5,
    },
    {
      slug: "letni-pruzkumnik",
      name: "Letní průzkumník",
      description: "5+ různých sportovišť navštívených v létě 2026",
      emoji: "☀️",
      category: "seasonal",
      earned: earnedSet.has("letni-pruzkumnik"),
      progress: Math.min(summerVisits.length, 5),
      target: 5,
    },
    // Monthly challenge badges (April 2026)
    {
      slug: "dubnovy-ferratista",
      name: "Dubnov\u00FD Ferratista",
      description: "3 ferraty navštívené v dubnu 2026",
      emoji: "\u26F0\uFE0F",
      category: "seasonal",
      earned: earnedSet.has("dubnovy-ferratista"),
      progress: Math.min(aprilFerratyVisits, 3),
      target: 3,
    },
    {
      slug: "dubnovy-lezec",
      name: "Dubnov\u00FD Lezec",
      description: "2 lezeck\u00E9 st\u011Bny nav\u0161t\u00EDven\u00E9 v dubnu 2026",
      emoji: "\uD83E\uDDD7",
      category: "seasonal",
      earned: earnedSet.has("dubnovy-lezec"),
      progress: Math.min(aprilLezeniVisits, 2),
      target: 2,
    },
    // Monthly challenge badges (May 2026)
    {
      slug: "kvetnovy-ferratista",
      name: "Kv\u011Btnov\u00FD Ferratista",
      description: "5 ferrat nav\u0161t\u00EDven\u00FDch v kv\u011Btnu 2026",
      emoji: "\u26F0\uFE0F",
      category: "seasonal",
      earned: earnedSet.has("kvetnovy-ferratista"),
      progress: Math.min(mayFerratyVisits, 5),
      target: 5,
    },
    {
      slug: "kvetnovy-lezec",
      name: "Kv\u011Btnov\u00FD Lezec",
      description: "3 lezeck\u00E9 st\u011Bny nav\u0161t\u00EDven\u00E9 v kv\u011Btnu 2026",
      emoji: "\uD83E\uDDD7",
      category: "seasonal",
      earned: earnedSet.has("kvetnovy-lezec"),
      progress: Math.min(mayLezeniVisits, 3),
      target: 3,
    },
    // Monthly challenge badges (June 2026)
    {
      slug: "cervnovy-ferratista",
      name: "\u010Cervnov\u00FD Ferratista",
      description: "5 ferrat zdolan\u00FDch v \u010Dervnu 2026",
      emoji: "\u26F0\uFE0F",
      category: "seasonal",
      earned: earnedSet.has("cervnovy-ferratista"),
      progress: Math.min(juneFerratyVisits, 5),
      target: 5,
    },
    {
      slug: "cervnovy-lezec",
      name: "\u010Cervnov\u00FD Lezec",
      description: "3 lezeck\u00E9 st\u011Bny nav\u0161t\u00EDven\u00E9 v \u010Dervnu 2026",
      emoji: "\uD83E\uDDD7",
      category: "seasonal",
      earned: earnedSet.has("cervnovy-lezec"),
      progress: Math.min(juneLezeniVisits, 3),
      target: 3,
    },
    // Monthly challenge badges (July 2026)
    {
      slug: "cervencovy-ferratista",
      name: "\u010Cervencov\u00FD Ferratista",
      description: "5 ferrat zdolan\u00FDch v \u010Dervenci 2026",
      emoji: "\u26F0\uFE0F",
      category: "seasonal",
      earned: earnedSet.has("cervencovy-ferratista"),
      progress: Math.min(julyFerratyVisits, 5),
      target: 5,
    },
    {
      slug: "cervencovy-lezec",
      name: "\u010Cervencov\u00FD Lezec",
      description: "4 lezeck\u00E9 st\u011Bny nav\u0161t\u00EDven\u00E9 v \u010Dervenci 2026",
      emoji: "\uD83E\uDDD7",
      category: "seasonal",
      earned: earnedSet.has("cervencovy-lezec"),
      progress: Math.min(julyLezeniVisits, 4),
      target: 4,
    },
    // Monthly challenge badges (August 2026)
    {
      slug: "srpnovy-ferratista",
      name: "Srpnov\u00FD Ferratista",
      description: "5 ferrat zdolan\u00FDch v srpnu 2026",
      emoji: "\u26F0\uFE0F",
      category: "seasonal",
      earned: earnedSet.has("srpnovy-ferratista"),
      progress: Math.min(augFerratyVisits, 5),
      target: 5,
    },
    {
      slug: "srpnovy-lezec",
      name: "Srpnov\u00FD Lezec",
      description: "4 lezeck\u00E9 st\u011Bny nav\u0161t\u00EDven\u00E9 v srpnu 2026",
      emoji: "\uD83E\uDDD7",
      category: "seasonal",
      earned: earnedSet.has("srpnovy-lezec"),
      progress: Math.min(augLezeniVisits, 4),
      target: 4,
    },
    // Monthly challenge badges (September 2026)
    {
      slug: "zarijovy-ferratista",
      name: "Z\u00E1\u0159ijov\u00FD Ferratista",
      description: "4 ferraty nav\u0161t\u00EDven\u00E9 v z\u00E1\u0159\u00ED 2026",
      emoji: "\u26F0\uFE0F",
      category: "seasonal",
      earned: earnedSet.has("zarijovy-ferratista"),
      progress: Math.min(septFerratyVisits, 4),
      target: 4,
    },
    {
      slug: "zarijovy-lezec",
      name: "Z\u00E1\u0159ijov\u00FD Lezec",
      description: "4 lezeck\u00E9 st\u011Bny nav\u0161t\u00EDven\u00E9 v z\u00E1\u0159\u00ED 2026",
      emoji: "\uD83E\uDDD7",
      category: "seasonal",
      earned: earnedSet.has("zarijovy-lezec"),
      progress: Math.min(septLezeniVisits, 4),
      target: 4,
    },
    // Monthly challenge badges (October 2026)
    {
      slug: "rijnovy-ferratista",
      name: "\u0158\u00EDjnov\u00FD Ferratista",
      description: "3 ferraty nav\u0161t\u00EDven\u00E9 v \u0159\u00EDjnu 2026",
      emoji: "\u26F0\uFE0F",
      category: "seasonal",
      earned: earnedSet.has("rijnovy-ferratista"),
      progress: Math.min(octFerratyVisits, 3),
      target: 3,
    },
    {
      slug: "rijnovy-lezec",
      name: "\u0158\u00EDjnov\u00FD Lezec",
      description: "3 lezeck\u00E9 st\u011Bny nav\u0161t\u00EDven\u00E9 v \u0159\u00EDjnu 2026",
      emoji: "\uD83E\uDDD7",
      category: "seasonal",
      earned: earnedSet.has("rijnovy-lezec"),
      progress: Math.min(octLezeniVisits, 3),
      target: 3,
    },
  ];
  return progress.map(p => ({ ...p, sportSlug: badgeSportMap.get(p.slug) ?? null }));
}

export interface BadgeProximityNudge {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  progress: number;
  target: number;
  remaining: number;
}

/**
 * Get badges the user is close to earning (within 1-2 actions, with some progress).
 * Returns the most actionable badges (max 3).
 */
export async function getCloseToEarningBadges(userId: string): Promise<BadgeProximityNudge[]> {
  const all = await getUserBadgeProgress(userId);
  return all
    .filter((b) => !b.earned && b.progress > 0 && b.target - b.progress <= 2)
    .map((b) => ({
      slug: b.slug,
      name: b.name,
      emoji: b.emoji,
      description: b.description,
      progress: b.progress,
      target: b.target,
      remaining: b.target - b.progress,
    }))
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 3);
}

/**
 * After a review or check-in, check if the user is close to earning a badge.
 * If so, send a nudge email (max 1 per user per week).
 * Fire-and-forget — never throws.
 */
export async function triggerBadgeProximityNudge(userId: string): Promise<void> {
  try {
    // Check rate limit: max 1 nudge per user per 7 days
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        emailNotifications: true,
        isSeed: true,
        lastBadgeNudgeAt: true,
      },
    });
    if (!user || !user.emailNotifications || user.isSeed) return;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (user.lastBadgeNudgeAt && user.lastBadgeNudgeAt > sevenDaysAgo) return;

    // Get close-to-earning badges
    const nudges = await getCloseToEarningBadges(userId);
    if (nudges.length === 0) return;

    // Build unsubscribe URL
    const token = await getUnsubscribeToken(userId);
    const unsubscribeUrl = buildUnsubscribeUrl(token, "all");

    // Send email
    const sent = await sendBadgeProximityNudgeEmail(
      user.email,
      user.name,
      nudges,
      unsubscribeUrl
    );

    // Update rate limit timestamp
    if (sent) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastBadgeNudgeAt: new Date() },
      });
    }
  } catch {
    // Fire-and-forget — don't propagate errors
  }
}

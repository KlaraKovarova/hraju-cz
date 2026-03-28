/** Monthly challenge definitions — hardcoded config for time-limited challenges. */

export interface MonthlyChallenge {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  sportSlug: string;
  /** Badge slug awarded on completion */
  badgeSlug: string;
  /** Number of check-ins required */
  target: number;
  /** Challenge period */
  startDate: string; // ISO date
  endDate: string; // ISO date
}

/** Active monthly challenges. Update this array each month. */
export const MONTHLY_CHALLENGES: MonthlyChallenge[] = [
  {
    slug: "duben-2026-ferraty",
    title: "Ferratov\u00E1 v\u00FDzva: Duben",
    description: "Navštiv 3 ferraty v dubnu 2026",
    emoji: "\u26F0\uFE0F",
    sportSlug: "ferraty",
    badgeSlug: "dubnovy-ferratista",
    target: 3,
    startDate: "2026-04-01",
    endDate: "2026-04-30",
  },
  {
    slug: "duben-2026-lezeni",
    title: "Lezeck\u00E1 v\u00FDzva: Duben",
    description: "Vyzkou\u0161ej 2 nov\u00E9 lezeck\u00E9 st\u011Bny v dubnu",
    emoji: "\uD83E\uDDD7",
    sportSlug: "lezeni",
    badgeSlug: "dubnovy-lezec",
    target: 2,
    startDate: "2026-04-01",
    endDate: "2026-04-30",
  },
  {
    slug: "kveten-2026-ferraty",
    title: "Ferratov\u00E1 v\u00FDzva: Kv\u011Bten",
    description: "Navštiv 5 ferrat v kv\u011Btnu 2026 \u2014 vrchol sez\u00F3ny!",
    emoji: "\u26F0\uFE0F",
    sportSlug: "ferraty",
    badgeSlug: "kvetnovy-ferratista",
    target: 5,
    startDate: "2026-05-01",
    endDate: "2026-05-31",
  },
  {
    slug: "kveten-2026-lezeni",
    title: "Lezeck\u00E1 v\u00FDzva: Kv\u011Bten",
    description: "Vyzkou\u0161ej 3 lezeck\u00E9 st\u011Bny v kv\u011Btnu",
    emoji: "\uD83E\uDDD7",
    sportSlug: "lezeni",
    badgeSlug: "kvetnovy-lezec",
    target: 3,
    startDate: "2026-05-01",
    endDate: "2026-05-31",
  },
];

/** Get challenges active for a given date (defaults to now). */
export function getActiveChallenges(date?: Date): MonthlyChallenge[] {
  const now = date ?? new Date();
  const today = now.toISOString().slice(0, 10);
  return MONTHLY_CHALLENGES.filter(
    (c) => today >= c.startDate && today <= c.endDate
  );
}

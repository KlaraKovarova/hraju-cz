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
  {
    slug: "cerven-2026-ferraty",
    title: "Ferratov\u00E1 v\u00FDzva: \u010Cerven",
    description: "Zdolej 5 ferrat v \u010Dervnu 2026 \u2014 l\u00E9to na sk\u00E1le!",
    emoji: "\u26F0\uFE0F",
    sportSlug: "ferraty",
    badgeSlug: "cervnovy-ferratista",
    target: 5,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
  },
  {
    slug: "cerven-2026-lezeni",
    title: "Lezeck\u00E1 v\u00FDzva: \u010Cerven",
    description: "Vyzkou\u0161ej 3 lezeck\u00E9 st\u011Bny v \u010Dervnu \u2014 venku i uvnit\u0159!",
    emoji: "\uD83E\uDDD7",
    sportSlug: "lezeni",
    badgeSlug: "cervnovy-lezec",
    target: 3,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
  },
  {
    slug: "cervenec-2026-ferraty",
    title: "Ferratov\u00E1 v\u00FDzva: \u010Cervenec",
    description: "Zdolej 5 ferrat v \u010Dervenci \u2014 vrchol letn\u00ED sez\u00F3ny!",
    emoji: "\u26F0\uFE0F",
    sportSlug: "ferraty",
    badgeSlug: "cervencovy-ferratista",
    target: 5,
    startDate: "2026-07-01",
    endDate: "2026-07-31",
  },
  {
    slug: "cervenec-2026-lezeni",
    title: "Lezeck\u00E1 v\u00FDzva: \u010Cervenec",
    description: "Vyzkou\u0161ej 4 lezeck\u00E9 st\u011Bny v \u010Dervenci \u2014 venkovn\u00ED i indoor!",
    emoji: "\uD83E\uDDD7",
    sportSlug: "lezeni",
    badgeSlug: "cervencovy-lezec",
    target: 4,
    startDate: "2026-07-01",
    endDate: "2026-07-31",
  },
  {
    slug: "srpen-2026-ferraty",
    title: "Ferratov\u00E1 v\u00FDzva: Srpen",
    description: "Zdolej 5 ferrat v srpnu \u2014 posledn\u00ED m\u011Bs\u00EDc letn\u00ED v\u00FDzvy!",
    emoji: "\u26F0\uFE0F",
    sportSlug: "ferraty",
    badgeSlug: "srpnovy-ferratista",
    target: 5,
    startDate: "2026-08-01",
    endDate: "2026-08-31",
  },
  {
    slug: "srpen-2026-lezeni",
    title: "Lezeck\u00E1 v\u00FDzva: Srpen",
    description: "Vyzkou\u0161ej 4 lezeck\u00E9 st\u011Bny v srpnu \u2014 udr\u017E si tempo!",
    emoji: "\uD83E\uDDD7",
    sportSlug: "lezeni",
    badgeSlug: "srpnovy-lezec",
    target: 4,
    startDate: "2026-08-01",
    endDate: "2026-08-31",
  },
  {
    slug: "zari-2026-ferraty",
    title: "Ferratov\u00E1 v\u00FDzva: Z\u00E1\u0159\u00ED",
    description: "Navštiv 4 ferraty v z\u00E1\u0159\u00ED \u2014 podzimn\u00ED sez\u00F3na!",
    emoji: "\u26F0\uFE0F",
    sportSlug: "ferraty",
    badgeSlug: "zarijovy-ferratista",
    target: 4,
    startDate: "2026-09-01",
    endDate: "2026-09-30",
  },
  {
    slug: "zari-2026-lezeni",
    title: "Lezeck\u00E1 v\u00FDzva: Z\u00E1\u0159\u00ED",
    description: "Vyzkou\u0161ej 4 lezeck\u00E9 st\u011Bny v z\u00E1\u0159\u00ED",
    emoji: "\uD83E\uDDD7",
    sportSlug: "lezeni",
    badgeSlug: "zarijovy-lezec",
    target: 4,
    startDate: "2026-09-01",
    endDate: "2026-09-30",
  },
  {
    slug: "rijen-2026-ferraty",
    title: "Ferratov\u00E1 v\u00FDzva: \u0158\u00EDjen",
    description: "Zdolej 3 ferraty v \u0159\u00EDjnu \u2014 konec sez\u00F3ny!",
    emoji: "\u26F0\uFE0F",
    sportSlug: "ferraty",
    badgeSlug: "rijnovy-ferratista",
    target: 3,
    startDate: "2026-10-01",
    endDate: "2026-10-31",
  },
  {
    slug: "rijen-2026-lezeni",
    title: "Lezeck\u00E1 v\u00FDzva: \u0158\u00EDjen",
    description: "Vyzkou\u0161ej 3 lezeck\u00E9 st\u011Bny v \u0159\u00EDjnu \u2014 za\u010D\u00EDn\u00E1 indoor sez\u00F3na!",
    emoji: "\uD83E\uDDD7",
    sportSlug: "lezeni",
    badgeSlug: "rijnovy-lezec",
    target: 3,
    startDate: "2026-10-01",
    endDate: "2026-10-31",
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

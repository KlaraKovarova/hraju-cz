import { SPORTS } from "./sports";
import { REGIONS } from "./regions";

export type GuideType = "top-v-kraji" | "nejlepe-hodnocene" | "pro-zacatecniky";

export type GuideDefinition = {
  slug: string;
  type: GuideType;
  /** Region slug — only for "top-v-kraji" guides */
  regionSlug?: string;
  /** Human-readable title for the guide */
  title: (sportNameCs: string) => string;
  /** Meta description */
  description: (sportNameCs: string, facilityType: string, count: number) => string;
  /** Short heading shown on the page */
  heading: (sportNameCs: string) => string;
  /** Intro paragraph */
  intro: (sportNameCs: string, facilityType: string, count: number) => string;
};

const REGION_NAME_FOR_TITLE: Record<string, string> = {
  "hlavni-mesto-praha": "Praze",
  "stredocesky-kraj": "Středočeském kraji",
  "jihocesky-kraj": "Jihočeském kraji",
  "plzensky-kraj": "Plzeňském kraji",
  "karlovarsky-kraj": "Karlovarském kraji",
  "ustecky-kraj": "Ústeckém kraji",
  "liberecky-kraj": "Libereckém kraji",
  "kralovehradecky-kraj": "Královéhradeckém kraji",
  "pardubicky-kraj": "Pardubickém kraji",
  "kraj-vysocina": "kraji Vysočina",
  "jihomoravsky-kraj": "Jihomoravském kraji",
  "olomoucky-kraj": "Olomouckém kraji",
  "zlinsky-kraj": "Zlínském kraji",
  "moravskoslezsky-kraj": "Moravskoslezském kraji",
};

function regionTitle(regionSlug: string): string {
  return REGION_NAME_FOR_TITLE[regionSlug] ?? regionSlug;
}

/** Generate all guide definitions for a given sport */
export function getGuideDefinitions(sportSlug: string): GuideDefinition[] {
  const guides: GuideDefinition[] = [];

  // 1. Top facilities by region (14 regions × sport)
  for (const region of REGIONS) {
    const rTitle = regionTitle(region.slug);
    guides.push({
      slug: `nejlepsi-v-${region.slug}`,
      type: "top-v-kraji",
      regionSlug: region.slug,
      title: (nameCs) => `Nejlepší ${nameCs.toLowerCase()} v ${rTitle}`,
      description: (nameCs, facilityType, count) =>
        `${count} nejlepších ${facilityType} v ${rTitle}. Přehled s hodnocením, recenzemi a mapou na hraju.cz.`,
      heading: (nameCs) => `Nejlepší ${nameCs.toLowerCase()} v ${rTitle}`,
      intro: (nameCs, facilityType, count) =>
        `Vybíráme ${count} nejlepších ${facilityType} v ${rTitle} podle hodnocení a recenzí od komunity hraju.cz.`,
    });
  }

  // 2. Best rated overall
  guides.push({
    slug: "nejlepe-hodnocene",
    type: "nejlepe-hodnocene",
    title: (nameCs) => `Nejlépe hodnocené ${nameCs.toLowerCase()} v ČR`,
    description: (nameCs, facilityType, count) =>
      `Top ${count} nejlépe hodnocených ${facilityType} v České republice. Žebříček podle recenzí komunity hraju.cz.`,
    heading: (nameCs) => `Nejlépe hodnocené ${nameCs.toLowerCase()} v ČR`,
    intro: (nameCs, facilityType, count) =>
      `Žebříček ${count} nejlépe hodnocených ${facilityType} v České republice podle průměrného hodnocení a počtu recenzí od komunity hraju.cz.`,
  });

  // 3. For beginners (ferraty + lezeni only)
  if (sportSlug === "ferraty" || sportSlug === "lezeni") {
    guides.push({
      slug: "pro-zacatecniky",
      type: "pro-zacatecniky",
      title: (nameCs) => `${nameCs} pro začátečníky v ČR`,
      description: (nameCs, facilityType, count) =>
        `${count} ${facilityType} vhodných pro začátečníky v České republice. Tipy kam jít poprvé.`,
      heading: (nameCs) => `${nameCs} pro začátečníky v ČR`,
      intro: (nameCs, facilityType, count) =>
        `Přehled ${count} ${facilityType} v České republice, které jsou ideální pro začátečníky. Vybráno na základě recenzí a zkušeností komunity.`,
    });
  }

  return guides;
}

/** Find a specific guide definition by sport and slug */
export function getGuideBySlug(sportSlug: string, guideSlug: string): GuideDefinition | undefined {
  return getGuideDefinitions(sportSlug).find((g) => g.slug === guideSlug);
}

/** Get all guide slugs across all sports (for sitemap + static params) */
export function getAllGuideSlugs(): { sport: string; slug: string }[] {
  const result: { sport: string; slug: string }[] = [];
  for (const sport of SPORTS) {
    for (const guide of getGuideDefinitions(sport.slug)) {
      result.push({ sport: sport.slug, slug: guide.slug });
    }
  }
  return result;
}

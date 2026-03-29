import type { SportSlug } from "./sports";

export interface SportLink {
  title: string;
  url: string;
  description: string;
  category: "rules" | "tournaments" | "events" | "associations" | "other";
}

export interface SportLinkGroup {
  sportSlug: SportSlug;
  links: SportLink[];
}

export const LINK_CATEGORIES = {
  associations: "Asociace a svazy",
  rules: "Pravidla",
  tournaments: "Turnaje",
  events: "Kalendář akcí",
  other: "Další",
} as const;

export type LinkCategory = keyof typeof LINK_CATEGORIES;

export const SPORT_LINKS: SportLinkGroup[] = [
  {
    sportSlug: "squash",
    links: [
      {
        title: "Česká asociace squashe",
        url: "https://czechsquash.cz/asociace/",
        description: "Oficiální stránky České asociace squashe.",
        category: "associations",
      },
      {
        title: "Pravidla squashe",
        url: "https://czechsquash.cz/ke-stazeni/pravidla/",
        description: "Pravidla squashe pro hráče všech úrovní.",
        category: "rules",
      },
      {
        title: "Squashové turnaje",
        url: "https://czechsquash.cz/turnaje/",
        description: "Přehled squashových turnajů v České republice.",
        category: "tournaments",
      },
      {
        title: "Kalendář akcí",
        url: "https://czechsquash.cz/kalendar-akci/",
        description: "Kalendář squashových akcí a turnajů v ČR.",
        category: "events",
      },
    ],
  },
  {
    sportSlug: "plavani",
    links: [
      {
        title: "Český svaz plaveckých sportů",
        url: "https://www.czechswimming.cz",
        description: "Oficiální stránky Českého svazu plaveckých sportů.",
        category: "associations",
      },
      {
        title: "Pravidla plavání",
        url: "https://www.czechswimming.cz/index.php/dokumenty/pravidla",
        description: "Pravidla závodního i rekreačního plavání.",
        category: "rules",
      },
      {
        title: "Výsledkový servis",
        url: "https://vysledky.czechswimming.cz/prehled",
        description: "Výsledky a přehled plaveckých závodů v ČR.",
        category: "events",
      },
    ],
  },
  {
    sportSlug: "fitness",
    links: [
      {
        title: "Český svaz kulturistiky a fitness",
        url: "https://www.cskf.cz",
        description: "Oficiální stránky Českého svazu kulturistiky a fitness.",
        category: "associations",
      },
      {
        title: "Soutěže ČSKF",
        url: "https://www.cskf.cz/souteze",
        description: "Přehled soutěží v kulturistice a fitness.",
        category: "tournaments",
      },
      {
        title: "Fitness tipy a cvičení",
        url: "https://www.ronnie.cz",
        description: "Největší český fitness portál s návody na cvičení.",
        category: "other",
      },
    ],
  },
];

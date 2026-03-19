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
    sportSlug: "tenis",
    links: [
      {
        title: "Český tenisový svaz",
        url: "https://www.cztenis.cz",
        description: "Oficiální stránky Českého tenisového svazu.",
        category: "associations",
      },
      {
        title: "Pravidla tenisu",
        url: "https://www.cztenis.cz/pravidla",
        description: "Kompletní pravidla tenisu v češtině.",
        category: "rules",
      },
      {
        title: "Tenisové turnaje ČTS",
        url: "https://www.cztenis.cz/turnaje",
        description: "Kalendář tenisových turnajů v ČR.",
        category: "tournaments",
      },
    ],
  },
  {
    sportSlug: "squash",
    links: [
      {
        title: "Česká asociace squashe",
        url: "https://www.czsquash.cz",
        description: "Oficiální stránky České asociace squashe.",
        category: "associations",
      },
      {
        title: "Pravidla squashe",
        url: "https://www.czsquash.cz/pravidla",
        description: "Pravidla squashe pro hráče všech úrovní.",
        category: "rules",
      },
      {
        title: "Squashové turnaje",
        url: "https://www.czsquash.cz/turnaje",
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
    sportSlug: "badminton",
    links: [
      {
        title: "Český badmintonový svaz",
        url: "https://www.czechbadminton.cz",
        description: "Oficiální stránky Českého badmintonového svazu.",
        category: "associations",
      },
      {
        title: "Pravidla badmintonu",
        url: "https://www.czechbadminton.cz/pravidla",
        description: "Pravidla badmintonu a herní řád.",
        category: "rules",
      },
      {
        title: "Turnaje a soutěže",
        url: "https://www.czechbadminton.cz/souteze",
        description: "Kalendář badmintonových soutěží a turnajů.",
        category: "tournaments",
      },
      {
        title: "Termínový kalendář turnajů",
        url: "https://www.czechbadminton.cz/turnaje/kalendar",
        description: "Termínový kalendář badmintonových turnajů v ČR.",
        category: "events",
      },
    ],
  },
  {
    sportSlug: "volejbal",
    links: [
      {
        title: "Český volejbalový svaz",
        url: "https://www.cvf.cz",
        description: "Oficiální stránky Českého volejbalového svazu.",
        category: "associations",
      },
      {
        title: "Pravidla volejbalu",
        url: "https://www.cvf.cz/pravidla",
        description: "Pravidla volejbalu a beachvolejbalu.",
        category: "rules",
      },
      {
        title: "Volejbalové soutěže",
        url: "https://www.cvf.cz/souteze",
        description: "Přehled volejbalových soutěží v ČR.",
        category: "tournaments",
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
        url: "https://www.czechswimming.cz/pravidla",
        description: "Pravidla závodního i rekreačního plavání.",
        category: "rules",
      },
      {
        title: "Plavecké závody",
        url: "https://www.czechswimming.cz/zavody",
        description: "Kalendář plaveckých závodů a akcí.",
        category: "events",
      },
    ],
  },
  {
    sportSlug: "golf",
    links: [
      {
        title: "Česká golfová federace",
        url: "https://www.cgf.cz",
        description: "Oficiální stránky České golfové federace.",
        category: "associations",
      },
      {
        title: "Pravidla golfu",
        url: "https://www.cgf.cz/pravidla",
        description: "Pravidla golfu a golfová etiketa.",
        category: "rules",
      },
      {
        title: "Golfové turnaje",
        url: "https://www.cgf.cz/turnaje",
        description: "Kalendář golfových turnajů v České republice.",
        category: "tournaments",
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

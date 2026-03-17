export const SPORTS = [
  {
    slug: "tenis",
    name: "Tennis",
    nameCs: "Tenis",
    subdomain: "tenis",
    description: "Tenisové kurty v České republice",
    icon: "🎾",
  },
  {
    slug: "squash",
    name: "Squash",
    nameCs: "Squash",
    subdomain: "squash",
    description: "Squashové kurty v České republice",
    icon: "🏸",
  },
  {
    slug: "badminton",
    name: "Badminton",
    nameCs: "Badminton",
    subdomain: "badminton",
    description: "Badmintonové kurty v České republice",
    icon: "🏸",
  },
  {
    slug: "volejbal",
    name: "Volleyball",
    nameCs: "Volejbal",
    subdomain: "volejbal",
    description: "Volejbalové kurty v České republice",
    icon: "🏐",
  },
  {
    slug: "plavani",
    name: "Swimming",
    nameCs: "Plavání",
    subdomain: "plavani",
    description: "Plavecké bazény v České republice",
    icon: "🏊",
  },
] as const;

export type SportSlug = (typeof SPORTS)[number]["slug"];

export const SPORT_SUBDOMAINS = SPORTS.map((s) => s.subdomain);

export function getSportBySubdomain(subdomain: string) {
  return SPORTS.find((s) => s.subdomain === subdomain);
}

export function getSportBySlug(slug: string) {
  return SPORTS.find((s) => s.slug === slug);
}

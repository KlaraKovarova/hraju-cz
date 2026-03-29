const SPORT_FACILITY_TYPES: Record<
  string,
  {
    singular: string;
    plural: string;
    pluralGenitive: string;
    instrumental: string;
    titleSuffix: string;
  }
> = {
  tenis: {
    singular: "tenisový kurt",
    plural: "tenisové kurty",
    pluralGenitive: "tenisových kurtů",
    instrumental: "tenisovými kurty",
    titleSuffix: "sportoviště a haly v celé ČR",
  },
  squash: {
    singular: "squashový kurt",
    plural: "squashové kurty",
    pluralGenitive: "squashových kurtů",
    instrumental: "squashovými kurty",
    titleSuffix: "sportoviště a haly v celé ČR",
  },
  badminton: {
    singular: "badmintonový kurt",
    plural: "badmintonové kurty",
    pluralGenitive: "badmintonových kurtů",
    instrumental: "badmintonovými kurty",
    titleSuffix: "sportoviště a haly v celé ČR",
  },
  plavani: {
    singular: "bazén",
    plural: "bazény a plavecké areály",
    pluralGenitive: "bazénů",
    instrumental: "bazény",
    titleSuffix: "bazény a plavecké areály v celé ČR",
  },
  fitness: {
    singular: "fitness centrum",
    plural: "posilovny a fitness centra",
    pluralGenitive: "fitness center a posiloven",
    instrumental: "fitness centry",
    titleSuffix: "posilovny a centra v celé ČR",
  },
  lezeni: {
    singular: "lezecké centrum",
    plural: "lezecká centra a bouldery",
    pluralGenitive: "lezeckých center",
    instrumental: "lezeckými centry",
    titleSuffix: "lezecká centra a bouldery v celé ČR",
  },
  ferraty: {
    singular: "ferrata",
    plural: "ferraty a zajištěné cesty",
    pluralGenitive: "ferrat",
    instrumental: "ferratami",
    titleSuffix: "ferraty a zajištěné cesty v celé ČR",
  },
  bowling: {
    singular: "bowlingová dráha",
    plural: "bowlingové dráhy a herny",
    pluralGenitive: "bowlingových drah",
    instrumental: "bowlingovými dráhami",
    titleSuffix: "bowlingové dráhy a herny v celé ČR",
  },
  "stolni-tenis": {
    singular: "herna stolního tenisu",
    plural: "herny stolního tenisu",
    pluralGenitive: "heren stolního tenisu",
    instrumental: "hernami stolního tenisu",
    titleSuffix: "stolní tenis a pingpong v celé ČR",
  },
  florbal: {
    singular: "florbalová hala",
    plural: "florbalové haly",
    pluralGenitive: "florbalových hal",
    instrumental: "florbalovými halami",
    titleSuffix: "florbalové haly a sportoviště v celé ČR",
  },
};

export function getSportFacilityType(slug: string): string {
  return SPORT_FACILITY_TYPES[slug]?.singular ?? "sportoviště";
}

export function getSportFacilityTypePlural(slug: string): string {
  return SPORT_FACILITY_TYPES[slug]?.plural ?? "sportovišť";
}

export function getSportFacilityTypePluralGenitive(slug: string): string {
  return SPORT_FACILITY_TYPES[slug]?.pluralGenitive ?? "sportovišť";
}

export function getSportFacilityTypeInstrumental(slug: string): string {
  return SPORT_FACILITY_TYPES[slug]?.instrumental ?? "sportovišti";
}

export function getSportTitleSuffix(slug: string): string {
  return SPORT_FACILITY_TYPES[slug]?.titleSuffix ?? "sportoviště a haly v celé ČR";
}

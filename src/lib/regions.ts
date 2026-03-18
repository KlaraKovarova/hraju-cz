export type Region = {
  name: string;
  slug: string;
};

export const REGIONS: Region[] = [
  { name: "Hlavní město Praha", slug: "hlavni-mesto-praha" },
  { name: "Středočeský kraj", slug: "stredocesky-kraj" },
  { name: "Jihočeský kraj", slug: "jihocesky-kraj" },
  { name: "Plzeňský kraj", slug: "plzensky-kraj" },
  { name: "Karlovarský kraj", slug: "karlovarsky-kraj" },
  { name: "Ústecký kraj", slug: "ustecky-kraj" },
  { name: "Liberecký kraj", slug: "liberecky-kraj" },
  { name: "Královéhradecký kraj", slug: "kralovehradecky-kraj" },
  { name: "Pardubický kraj", slug: "pardubicky-kraj" },
  { name: "Kraj Vysočina", slug: "kraj-vysocina" },
  { name: "Jihomoravský kraj", slug: "jihomoravsky-kraj" },
  { name: "Olomoucký kraj", slug: "olomoucky-kraj" },
  { name: "Zlínský kraj", slug: "zlinsky-kraj" },
  { name: "Moravskoslezský kraj", slug: "moravskoslezsky-kraj" },
];

const regionBySlug = new Map(REGIONS.map((r) => [r.slug, r]));
const regionByName = new Map(REGIONS.map((r) => [r.name, r]));

export function getRegionBySlug(slug: string): Region | undefined {
  return regionBySlug.get(slug);
}

export function getRegionByName(name: string): Region | undefined {
  return regionByName.get(name);
}

export function getRegionSlug(regionName: string): string | null {
  return regionByName.get(regionName)?.slug ?? null;
}

/** Map 2-digit postal code prefix to region name */
const POSTAL_PREFIX_TO_REGION: Record<string, string> = {
  "10": "Hlavní město Praha", "11": "Hlavní město Praha", "12": "Hlavní město Praha",
  "13": "Hlavní město Praha", "14": "Hlavní město Praha", "15": "Hlavní město Praha",
  "16": "Hlavní město Praha", "17": "Hlavní město Praha", "18": "Hlavní město Praha",
  "19": "Hlavní město Praha",
  "20": "Středočeský kraj", "21": "Středočeský kraj", "22": "Středočeský kraj",
  "23": "Středočeský kraj", "24": "Středočeský kraj", "25": "Středočeský kraj",
  "26": "Středočeský kraj", "27": "Středočeský kraj", "28": "Středočeský kraj",
  "29": "Středočeský kraj",
  "30": "Plzeňský kraj", "31": "Plzeňský kraj", "32": "Plzeňský kraj",
  "33": "Plzeňský kraj", "34": "Plzeňský kraj",
  "35": "Karlovarský kraj", "36": "Karlovarský kraj",
  "37": "Jihočeský kraj", "38": "Jihočeský kraj", "39": "Jihočeský kraj",
  "40": "Ústecký kraj", "41": "Ústecký kraj", "42": "Ústecký kraj",
  "43": "Ústecký kraj", "44": "Ústecký kraj", "45": "Ústecký kraj",
  "46": "Liberecký kraj", "47": "Liberecký kraj", "48": "Liberecký kraj",
  "49": "Liberecký kraj",
  "50": "Královéhradecký kraj", "51": "Královéhradecký kraj", "52": "Královéhradecký kraj",
  "54": "Královéhradecký kraj",
  "53": "Pardubický kraj", "55": "Pardubický kraj", "56": "Pardubický kraj",
  "57": "Kraj Vysočina", "58": "Kraj Vysočina", "59": "Kraj Vysočina",
  "60": "Jihomoravský kraj", "61": "Jihomoravský kraj", "62": "Jihomoravský kraj",
  "63": "Jihomoravský kraj", "64": "Jihomoravský kraj", "65": "Jihomoravský kraj",
  "66": "Jihomoravský kraj", "69": "Jihomoravský kraj",
  "67": "Kraj Vysočina", "68": "Kraj Vysočina",
  "70": "Moravskoslezský kraj", "71": "Moravskoslezský kraj", "72": "Moravskoslezský kraj",
  "73": "Moravskoslezský kraj", "74": "Moravskoslezský kraj",
  "75": "Olomoucký kraj", "77": "Olomoucký kraj", "78": "Olomoucký kraj",
  "79": "Olomoucký kraj",
  "76": "Zlínský kraj",
};

export function regionFromPostalCode(postalCode: string): string | null {
  const prefix = postalCode.replace(/\s/g, "").slice(0, 2);
  return POSTAL_PREFIX_TO_REGION[prefix] ?? null;
}

/** Create a URL-safe slug from a city name */
export function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Reverse: find original city name from slug (requires the city list) */
export function findCityBySlug(cities: string[], slug: string): string | undefined {
  return cities.find((c) => cityToSlug(c) === slug);
}

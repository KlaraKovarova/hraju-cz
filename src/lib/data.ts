import { prisma } from "./prisma";
import exportData from "@/data/facilities-export.json";
import { getRegionByName, getRegionBySlug, cityToSlug, findCityBySlug, type Region } from "./regions";

const DB_QUERY_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`DB query timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export type FacilityWithDetails = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  postalCode: string | null;
  lat: number | null;
  lng: number | null;
  googlePlaceId: string | null;
  courtsLanes: number | null;
  pricing: string | null;
  openingHours: Record<string, string> | null;
  website: string | null;
  isActive: boolean;
  isPremium: boolean;
  isClaimed: boolean;
  location: { city: string; region: string | null };
  sports: { sport: { slug: string; nameCs: string; icon: string | null } }[];
  amenities: { amenity: { slug: string; nameCs: string; icon: string | null } }[];
  contacts: {
    id: string;
    type: string;
    value: string;
    label: string | null;
    isPrimary: boolean;
  }[];
  images: { url: string; alt: string | null; isPrimary: boolean }[];
};

// --- Static data from JSON export (pre-indexed) ---

type ExportData = typeof exportData;

const locationById = new Map(exportData.locations.map((l) => [l.id, l]));
const sportById = new Map(exportData.sports.map((s) => [s.id, s]));

// Index: sportSlug -> set of facilityIds
const facilitiesBySportSlug = new Map<string, Set<string>>();
for (const fs of exportData.facilitySports) {
  const sport = sportById.get(fs.sportId);
  if (!sport) continue;
  let set = facilitiesBySportSlug.get(sport.slug);
  if (!set) {
    set = new Set();
    facilitiesBySportSlug.set(sport.slug, set);
  }
  set.add(fs.facilityId);
}

// Index: facilityId -> sportIds
const sportsByFacilityId = new Map<string, string[]>();
for (const fs of exportData.facilitySports) {
  const arr = sportsByFacilityId.get(fs.facilityId) || [];
  arr.push(fs.sportId);
  sportsByFacilityId.set(fs.facilityId, arr);
}

// Index: facilityId -> contacts
const contactsByFacilityId = new Map<string, ExportData["contacts"]>();
for (const c of exportData.contacts) {
  const arr = contactsByFacilityId.get(c.facilityId) || [];
  arr.push(c);
  contactsByFacilityId.set(c.facilityId, arr);
}

// Slug -> facility index
const facilityBySlug = new Map(exportData.facilities.map((f) => [f.slug, f]));

function toFacilityWithDetails(f: ExportData["facilities"][number]): FacilityWithDetails {
  const loc = locationById.get(f.locationId);
  const fSportIds = sportsByFacilityId.get(f.id) || [];
  const fContacts = contactsByFacilityId.get(f.id) || [];

  return {
    id: f.id,
    name: f.name,
    slug: f.slug,
    description: f.description,
    address: f.address,
    postalCode: f.postalCode,
    lat: f.lat,
    lng: f.lng,
    googlePlaceId: null,
    courtsLanes: f.courtsLanes,
    pricing: f.pricing,
    openingHours: f.openingHours as Record<string, string> | null,
    website: f.website,
    isActive: f.isActive,
    isPremium: f.isPremium,
    isClaimed: f.isClaimed,
    location: { city: loc?.city ?? "", region: loc?.region ?? null },
    sports: fSportIds
      .map((sid) => sportById.get(sid))
      .filter(Boolean)
      .map((s) => ({ sport: { slug: s!.slug, nameCs: s!.nameCs, icon: s!.icon } })),
    amenities: [],
    contacts: fContacts.map((c) => ({
      id: c.id,
      type: c.type,
      value: c.value,
      label: c.label,
      isPrimary: c.isPrimary,
    })),
    images: [],
  };
}

function staticFacilitiesBySport(sportSlug: string, cityFilter?: string): FacilityWithDetails[] {
  const facilityIds = facilitiesBySportSlug.get(sportSlug);
  if (!facilityIds) return [];

  let results = exportData.facilities.filter((f) => facilityIds.has(f.id));

  if (cityFilter) {
    const lower = cityFilter.toLowerCase();
    results = results.filter((f) => {
      const loc = locationById.get(f.locationId);
      return loc?.city.toLowerCase().includes(lower);
    });
  }

  return results.map(toFacilityWithDetails);
}

function staticFacilityBySlug(slug: string): FacilityWithDetails | null {
  const f = facilityBySlug.get(slug);
  return f ? toFacilityWithDetails(f) : null;
}

function staticCities(): string[] {
  const cities = new Set<string>();
  for (const loc of exportData.locations) {
    cities.add(loc.city);
  }
  return [...cities].sort();
}

// Index: region -> set of locationIds
const locationIdsByRegion = new Map<string, Set<string>>();
for (const loc of exportData.locations) {
  if (!loc.region) continue;
  let set = locationIdsByRegion.get(loc.region);
  if (!set) {
    set = new Set();
    locationIdsByRegion.set(loc.region, set);
  }
  set.add(loc.id);
}

export type RegionWithCount = {
  region: Region;
  facilityCount: number;
  cities: string[];
};

function staticRegionsBySport(sportSlug: string): RegionWithCount[] {
  const facilityIds = facilitiesBySportSlug.get(sportSlug);
  if (!facilityIds) return [];

  const regionCounts = new Map<string, { count: number; cities: Set<string> }>();

  for (const f of exportData.facilities) {
    if (!facilityIds.has(f.id)) continue;
    const loc = locationById.get(f.locationId);
    if (!loc?.region) continue;

    let entry = regionCounts.get(loc.region);
    if (!entry) {
      entry = { count: 0, cities: new Set() };
      regionCounts.set(loc.region, entry);
    }
    entry.count++;
    entry.cities.add(loc.city);
  }

  const results: RegionWithCount[] = [];
  for (const [regionName, data] of regionCounts) {
    const region = getRegionByName(regionName);
    if (!region) continue;
    results.push({
      region,
      facilityCount: data.count,
      cities: [...data.cities].sort(),
    });
  }

  return results.sort((a, b) => b.facilityCount - a.facilityCount);
}

export type CityWithCount = {
  city: string;
  citySlug: string;
  facilityCount: number;
};

function staticCitiesByRegionAndSport(regionSlug: string, sportSlug: string): CityWithCount[] {
  const region = getRegionBySlug(regionSlug);
  if (!region) return [];

  const facilityIds = facilitiesBySportSlug.get(sportSlug);
  if (!facilityIds) return [];

  const locIds = locationIdsByRegion.get(region.name);
  if (!locIds) return [];

  const cityCounts = new Map<string, number>();

  for (const f of exportData.facilities) {
    if (!facilityIds.has(f.id)) continue;
    if (!locIds.has(f.locationId)) continue;
    const loc = locationById.get(f.locationId);
    if (!loc) continue;
    cityCounts.set(loc.city, (cityCounts.get(loc.city) || 0) + 1);
  }

  return [...cityCounts.entries()]
    .map(([city, count]) => ({
      city,
      citySlug: cityToSlug(city),
      facilityCount: count,
    }))
    .sort((a, b) => b.facilityCount - a.facilityCount);
}

function staticFacilitiesByRegionCityAndSport(
  regionSlug: string,
  citySlug: string,
  sportSlug: string
): { facilities: FacilityWithDetails[]; cityName: string | null } {
  const region = getRegionBySlug(regionSlug);
  if (!region) return { facilities: [], cityName: null };

  const facilityIds = facilitiesBySportSlug.get(sportSlug);
  if (!facilityIds) return { facilities: [], cityName: null };

  const locIds = locationIdsByRegion.get(region.name);
  if (!locIds) return { facilities: [], cityName: null };

  // Find all cities in this region to resolve citySlug
  const regionCities = exportData.locations
    .filter((l) => locIds.has(l.id))
    .map((l) => l.city);
  const cityName = findCityBySlug(regionCities, citySlug);
  if (!cityName) return { facilities: [], cityName: null };

  const results = exportData.facilities.filter((f) => {
    if (!facilityIds.has(f.id)) return false;
    if (!locIds.has(f.locationId)) return false;
    const loc = locationById.get(f.locationId);
    return loc?.city === cityName;
  });

  return {
    facilities: results.map(toFacilityWithDetails),
    cityName,
  };
}

// --- DB queries (used when DATABASE_URL is reachable) ---

async function dbFacilitiesBySport(
  sportSlug: string,
  cityFilter?: string
): Promise<FacilityWithDetails[]> {
  return prisma.facility.findMany({
    where: {
      isActive: true,
      sports: { some: { sport: { slug: sportSlug } } },
      ...(cityFilter ? { location: { city: { contains: cityFilter } } } : {}),
    },
    include: {
      location: { select: { city: true, region: true } },
      sports: { include: { sport: { select: { slug: true, nameCs: true, icon: true } } } },
      amenities: { include: { amenity: { select: { slug: true, nameCs: true, icon: true } } } },
      contacts: { select: { id: true, type: true, value: true, label: true, isPrimary: true } },
      images: { select: { url: true, alt: true, isPrimary: true }, orderBy: { order: "asc" } },
    },
    orderBy: [{ isPremium: "desc" }, { name: "asc" }],
  }) as unknown as FacilityWithDetails[];
}

async function dbFacilityBySlug(slug: string): Promise<FacilityWithDetails | null> {
  return prisma.facility.findUnique({
    where: { slug },
    include: {
      location: { select: { city: true, region: true } },
      sports: { include: { sport: { select: { slug: true, nameCs: true, icon: true } } } },
      amenities: { include: { amenity: { select: { slug: true, nameCs: true, icon: true } } } },
      contacts: { select: { id: true, type: true, value: true, label: true, isPrimary: true } },
      images: { select: { url: true, alt: true, isPrimary: true }, orderBy: { order: "asc" } },
    },
  }) as unknown as FacilityWithDetails | null;
}

// --- Public API: try DB first, fall back to static JSON export ---

export async function getFacilitiesBySport(
  sportSlug: string,
  cityFilter?: string
): Promise<{ facilities: FacilityWithDetails[]; isLive: boolean }> {
  try {
    const facilities = await withTimeout(dbFacilitiesBySport(sportSlug, cityFilter), DB_QUERY_TIMEOUT_MS);
    return { facilities, isLive: true };
  } catch {
    return { facilities: staticFacilitiesBySport(sportSlug, cityFilter), isLive: true };
  }
}

export async function getFacilityBySlug(
  slug: string
): Promise<{ facility: FacilityWithDetails | null; isLive: boolean }> {
  try {
    const facility = await withTimeout(dbFacilityBySlug(slug), DB_QUERY_TIMEOUT_MS);
    return { facility, isLive: true };
  } catch {
    return { facility: staticFacilityBySlug(slug), isLive: true };
  }
}

export async function getRegionsBySport(
  sportSlug: string
): Promise<RegionWithCount[]> {
  // For now, always use static data for region aggregation
  // (DB version would require a complex GROUP BY query)
  return staticRegionsBySport(sportSlug);
}

export async function getCitiesByRegionAndSport(
  regionSlug: string,
  sportSlug: string
): Promise<CityWithCount[]> {
  return staticCitiesByRegionAndSport(regionSlug, sportSlug);
}

export async function getFacilitiesByRegionCityAndSport(
  regionSlug: string,
  citySlug: string,
  sportSlug: string
): Promise<{ facilities: FacilityWithDetails[]; cityName: string | null; isLive: boolean }> {
  const result = staticFacilitiesByRegionCityAndSport(regionSlug, citySlug, sportSlug);
  return { ...result, isLive: true };
}

export async function getCities(): Promise<string[]> {
  try {
    const locations = await withTimeout(
      prisma.location.findMany({
        select: { city: true },
        distinct: ["city"],
        orderBy: { city: "asc" },
      }),
      DB_QUERY_TIMEOUT_MS
    );
    return locations.map((l) => l.city);
  } catch {
    return staticCities();
  }
}

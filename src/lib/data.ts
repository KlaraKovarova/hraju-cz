import { prisma } from "./prisma";
import exportData from "@/data/facilities-export.json";
import { getRegionByName, getRegionBySlug, cityToSlug, findCityBySlug, type Region } from "./regions";
import { SPORTS } from "./sports";

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
  bookingUrl: string | null;
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

// Visible sports: only those in the SPORTS config array
const visibleSportSlugs: Set<string> = new Set(SPORTS.map((s) => s.slug));
const visibleSportIds = new Set(
  exportData.sports.filter((s) => visibleSportSlugs.has(s.slug)).map((s) => s.id)
);
// Facilities that belong to at least one visible sport
const visibleFacilityIds = new Set<string>();
for (const fs of exportData.facilitySports) {
  if (visibleSportIds.has(fs.sportId)) visibleFacilityIds.add(fs.facilityId);
}

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
    bookingUrl: (f as Record<string, unknown>).bookingUrl as string | null ?? null,
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

  let results = exportData.facilities.filter((f) => facilityIds.has(f.id) && f.isActive);

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
  return f && f.isActive ? toFacilityWithDetails(f) : null;
}

/**
 * Look up an inactive facility's location info by slug (for redirect purposes).
 * Returns null if the slug doesn't exist or the facility is active.
 */
export function getInactiveFacilityRedirectInfo(slug: string): { city: string; region: string | null } | null {
  const f = facilityBySlug.get(slug);
  if (!f || f.isActive) return null;
  const loc = locationById.get(f.locationId);
  if (!loc) return null;
  return { city: loc.city, region: loc.region };
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
    if (!facilityIds.has(f.id) || !f.isActive) continue;
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
    if (!facilityIds.has(f.id) || !f.isActive) continue;
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
    if (!facilityIds.has(f.id) || !f.isActive) return false;
    if (!locIds.has(f.locationId)) return false;
    const loc = locationById.get(f.locationId);
    return loc?.city === cityName;
  });

  return {
    facilities: results.map(toFacilityWithDetails),
    cityName,
  };
}

function staticFacilitiesByRegionAndSport(
  regionSlug: string,
  sportSlug: string
): FacilityWithDetails[] {
  const region = getRegionBySlug(regionSlug);
  if (!region) return [];

  const facilityIds = facilitiesBySportSlug.get(sportSlug);
  if (!facilityIds) return [];

  const locIds = locationIdsByRegion.get(region.name);
  if (!locIds) return [];

  const results = exportData.facilities.filter((f) => {
    if (!facilityIds.has(f.id) || !f.isActive) return false;
    return locIds.has(f.locationId);
  });

  return results.map(toFacilityWithDetails);
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
    orderBy: { name: "asc" },
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

export async function getTopFacilitiesBySport(
  sportSlug: string,
  limit: number = 10
): Promise<FacilityWithDetails[]> {
  const facilities = staticFacilitiesBySport(sportSlug);
  facilities.sort((a, b) => a.name.localeCompare(b.name, "cs"));
  return facilities.slice(0, limit);
}

export async function getTopFacilitiesByRegionAndSport(
  regionSlug: string,
  sportSlug: string,
  limit: number = 10
): Promise<FacilityWithDetails[]> {
  const facilities = staticFacilitiesByRegionAndSport(regionSlug, sportSlug);
  facilities.sort((a, b) => a.name.localeCompare(b.name, "cs"));
  return facilities.slice(0, limit);
}

// --- City landing page queries ---

export type CityForSport = {
  city: string;
  citySlug: string;
  facilityCount: number;
};

/** Check if a city name is a Praha district (e.g. "Praha 1", "Praha 10") */
function isPrahaDistrict(city: string): boolean {
  return /^Praha \d+$/.test(city);
}

export type DistrictGroup = {
  district: string;
  districtSlug: string;
  facilities: FacilityWithDetails[];
};

function staticFacilitiesByCityAndSport(
  citySlug: string,
  sportSlug: string
): { facilities: FacilityWithDetails[]; cityName: string | null; districts?: DistrictGroup[] } {
  const facilityIds = facilitiesBySportSlug.get(sportSlug);
  if (!facilityIds) return { facilities: [], cityName: null };

  // Special case: "praha" aggregates all Praha districts
  if (citySlug === "praha") {
    const results = exportData.facilities.filter((f) => {
      if (!facilityIds.has(f.id) || !f.isActive) return false;
      const loc = locationById.get(f.locationId);
      return loc ? isPrahaDistrict(loc.city) : false;
    });

    if (results.length === 0) return { facilities: [], cityName: null };

    const mapped = results.map(toFacilityWithDetails);
    // Sort: district asc, then name asc
    mapped.sort((a, b) => {
      const distA = a.location.city;
      const distB = b.location.city;
      if (distA !== distB) return distA.localeCompare(distB, "cs", { numeric: true });
      return a.name.localeCompare(b.name, "cs");
    });

    // Group by district
    const districtMap = new Map<string, FacilityWithDetails[]>();
    for (const f of mapped) {
      const d = f.location.city;
      if (!districtMap.has(d)) districtMap.set(d, []);
      districtMap.get(d)!.push(f);
    }
    const districts: DistrictGroup[] = [...districtMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "cs", { numeric: true }))
      .map(([district, facs]) => ({
        district,
        districtSlug: cityToSlug(district),
        facilities: facs,
      }));

    return { facilities: mapped, cityName: "Praha", districts };
  }

  const allCities = [...new Set(exportData.locations.map((l) => l.city))];
  const cityName = findCityBySlug(allCities, citySlug);
  if (!cityName) return { facilities: [], cityName: null };

  const results = exportData.facilities.filter((f) => {
    if (!facilityIds.has(f.id) || !f.isActive) return false;
    const loc = locationById.get(f.locationId);
    return loc?.city === cityName;
  });

  const mapped = results.map(toFacilityWithDetails);
  mapped.sort((a, b) => a.name.localeCompare(b.name, "cs"));

  return { facilities: mapped, cityName };
}

export async function getFacilitiesByCityAndSport(
  citySlug: string,
  sportSlug: string
): Promise<{ facilities: FacilityWithDetails[]; cityName: string | null; districts?: DistrictGroup[] }> {
  return staticFacilitiesByCityAndSport(citySlug, sportSlug);
}

function staticTopCitiesBySport(sportSlug: string, limit: number = 10): CityForSport[] {
  const facilityIds = facilitiesBySportSlug.get(sportSlug);
  if (!facilityIds) return [];

  const cityCounts = new Map<string, number>();
  let prahaCount = 0;
  for (const f of exportData.facilities) {
    if (!facilityIds.has(f.id) || !f.isActive) continue;
    const loc = locationById.get(f.locationId);
    if (!loc) continue;
    if (isPrahaDistrict(loc.city)) {
      prahaCount++;
    } else {
      cityCounts.set(loc.city, (cityCounts.get(loc.city) || 0) + 1);
    }
  }

  const results: CityForSport[] = [...cityCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([city, count]) => ({
      city,
      citySlug: cityToSlug(city),
      facilityCount: count,
    }));
  if (prahaCount >= 2) {
    results.push({ city: "Praha", citySlug: "praha", facilityCount: prahaCount });
  }
  return results
    .sort((a, b) => b.facilityCount - a.facilityCount)
    .slice(0, limit);
}

export async function getTopCitiesBySport(
  sportSlug: string,
  limit: number = 10
): Promise<CityForSport[]> {
  return staticTopCitiesBySport(sportSlug, limit);
}

/** Get all cities with 2+ facilities for a sport (for sitemap) */
export async function getAllCitiesForSport(
  sportSlug: string
): Promise<CityForSport[]> {
  return staticTopCitiesBySport(sportSlug, 10000);
}

// --- Homepage queries ---

export function getTotalFacilityCount(): number {
  return exportData.facilities.filter((f) => f.isActive && visibleFacilityIds.has(f.id)).length;
}

export function getTotalSportCount(): number {
  return SPORTS.length;
}

/** Featured facilities: claimed or any active, deterministic daily rotation */
export async function getFeaturedFacilities(limit: number = 6): Promise<FacilityWithDetails[]> {
  const candidates = exportData.facilities.filter(
    (f) => f.isActive && f.isClaimed
  );
  if (candidates.length === 0) {
    // Fallback to any active facilities
    const all = exportData.facilities.filter((f) => f.isActive);
    all.sort((a, b) => a.name.localeCompare(b.name, "cs"));
    return all.slice(0, limit).map(toFacilityWithDetails);
  }
  // Deterministic daily rotation based on day-of-year
  const dayOfYear = Math.floor(Date.now() / 86400000);
  const offset = dayOfYear % Math.max(1, candidates.length - limit + 1);
  const rotated = [...candidates.slice(offset), ...candidates.slice(0, offset)];
  return rotated.slice(0, limit).map(toFacilityWithDetails);
}

/** Top cities across all sports (Praha districts aggregated into one "Praha" entry) */
export async function getTopCitiesOverall(limit: number = 10): Promise<CityForSport[]> {
  const cityCounts = new Map<string, number>();
  let prahaCount = 0;
  for (const f of exportData.facilities) {
    if (!f.isActive) continue;
    const loc = locationById.get(f.locationId);
    if (!loc) continue;
    if (isPrahaDistrict(loc.city)) {
      prahaCount++;
    } else {
      cityCounts.set(loc.city, (cityCounts.get(loc.city) || 0) + 1);
    }
  }
  const results: CityForSport[] = [...cityCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([city, count]) => ({
      city,
      citySlug: cityToSlug(city),
      facilityCount: count,
    }));
  if (prahaCount >= 2) {
    results.push({ city: "Praha", citySlug: "praha", facilityCount: prahaCount });
  }
  return results
    .sort((a, b) => b.facilityCount - a.facilityCount)
    .slice(0, limit);
}

/** Recently added facilities (by createdAt descending) */
export async function getRecentFacilities(limit: number = 4): Promise<FacilityWithDetails[]> {
  const sorted = exportData.facilities
    .filter((f) => f.isActive)
    .sort((a, b) => {
      const aDate = (a as Record<string, unknown>).createdAt as string || "";
      const bDate = (b as Record<string, unknown>).createdAt as string || "";
      return bDate.localeCompare(aDate);
    });
  return sorted.slice(0, limit).map(toFacilityWithDetails);
}

/** Related facilities in same city for same sport (for "Další [sport] v [city]") */
export async function getRelatedFacilities(
  sportSlug: string,
  city: string,
  excludeSlug: string,
  limit: number = 5
): Promise<FacilityWithDetails[]> {
  const facilityIds = facilitiesBySportSlug.get(sportSlug);
  if (!facilityIds) return [];

  const results = exportData.facilities.filter((f) => {
    if (!facilityIds.has(f.id) || !f.isActive || f.slug === excludeSlug) return false;
    const loc = locationById.get(f.locationId);
    return loc?.city === city;
  });

  const mapped = results.map(toFacilityWithDetails);
  mapped.sort((a, b) => a.name.localeCompare(b.name, "cs"));
  return mapped.slice(0, limit);
}

/** Search facilities by name, city, or sport name */
export async function searchFacilities(
  query: string,
  sportSlug?: string,
  limit: number = 50
): Promise<FacilityWithDetails[]> {
  const lower = query.toLowerCase();

  let candidates = exportData.facilities.filter((f) => f.isActive);

  // Filter by sport if specified
  if (sportSlug) {
    const sportFacilityIds = facilitiesBySportSlug.get(sportSlug);
    if (!sportFacilityIds) return [];
    candidates = candidates.filter((f) => sportFacilityIds.has(f.id));
  }

  const results = candidates.filter((f) => {
    if (f.name.toLowerCase().includes(lower)) return true;
    const loc = locationById.get(f.locationId);
    if (loc?.city.toLowerCase().includes(lower)) return true;
    const fSportIds = sportsByFacilityId.get(f.id) || [];
    for (const sid of fSportIds) {
      const s = sportById.get(sid);
      if (s?.nameCs.toLowerCase().includes(lower)) return true;
    }
    return false;
  });

  // Sort: premium first, then alphabetically
  results.sort((a, b) => {
    if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
    return a.name.localeCompare(b.name, "cs");
  });

  return results.slice(0, limit).map(toFacilityWithDetails);
}

// --- Cross-sport city page queries (/mesto) ---

export type SportGroup = {
  sport: { slug: string; nameCs: string; icon: string | null };
  facilities: FacilityWithDetails[];
};

/** Get all facilities in a city across all sports, grouped by sport */
export async function getFacilitiesByCity(
  citySlug: string
): Promise<{ facilities: FacilityWithDetails[]; cityName: string | null; sportGroups: SportGroup[] }> {
  const allCities = [...new Set(exportData.locations.map((l) => l.city))];

  let matchedFacilities: FacilityWithDetails[];
  let cityName: string | null;

  // Special case: "praha" aggregates all Praha districts
  if (citySlug === "praha") {
    cityName = "Praha";
    const results = exportData.facilities.filter((f) => {
      if (!f.isActive) return false;
      const loc = locationById.get(f.locationId);
      return loc ? isPrahaDistrict(loc.city) : false;
    });
    matchedFacilities = results.map(toFacilityWithDetails);
  } else {
    cityName = findCityBySlug(allCities, citySlug) ?? null;
    if (!cityName) return { facilities: [], cityName: null, sportGroups: [] };

    const results = exportData.facilities.filter((f) => {
      if (!f.isActive) return false;
      const loc = locationById.get(f.locationId);
      return loc?.city === cityName;
    });
    matchedFacilities = results.map(toFacilityWithDetails);
  }

  matchedFacilities.sort((a, b) => a.name.localeCompare(b.name, "cs"));

  // Group by sport
  const sportMap = new Map<string, { sport: { slug: string; nameCs: string; icon: string | null }; facilities: FacilityWithDetails[] }>();
  for (const f of matchedFacilities) {
    for (const fs of f.sports) {
      const key = fs.sport.slug;
      if (!sportMap.has(key)) {
        sportMap.set(key, { sport: fs.sport, facilities: [] });
      }
      sportMap.get(key)!.facilities.push(f);
    }
  }

  // Sort sport groups by facility count descending
  const sportGroups = [...sportMap.values()].sort(
    (a, b) => b.facilities.length - a.facilities.length
  );

  return { facilities: matchedFacilities, cityName, sportGroups };
}

/** Top cities across all sports for /mesta index (Praha districts aggregated) */
export async function getTopCitiesOverallForMesto(limit: number = 20): Promise<CityForSport[]> {
  const cityCounts = new Map<string, number>();
  let prahaCount = 0;
  for (const f of exportData.facilities) {
    if (!f.isActive) continue;
    const loc = locationById.get(f.locationId);
    if (!loc) continue;
    if (isPrahaDistrict(loc.city)) {
      prahaCount++;
    } else {
      cityCounts.set(loc.city, (cityCounts.get(loc.city) || 0) + 1);
    }
  }
  const results: CityForSport[] = [...cityCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([city, count]) => ({
      city,
      citySlug: cityToSlug(city),
      facilityCount: count,
    }));
  if (prahaCount >= 2) {
    results.push({ city: "Praha", citySlug: "praha", facilityCount: prahaCount });
  }
  return results
    .sort((a, b) => b.facilityCount - a.facilityCount)
    .slice(0, limit);
}

/** Count distinct sports in a city (for meta descriptions) */
export function getSportCountInCity(citySlug: string): number {
  const allCities = [...new Set(exportData.locations.map((l) => l.city))];
  const sportSlugs = new Set<string>();

  const matchCity = citySlug === "praha"
    ? (loc: { city: string }) => isPrahaDistrict(loc.city)
    : (loc: { city: string }) => {
        const cityName = findCityBySlug(allCities, citySlug);
        return cityName ? loc.city === cityName : false;
      };

  for (const f of exportData.facilities) {
    if (!f.isActive) continue;
    const loc = locationById.get(f.locationId);
    if (!loc || !matchCity(loc)) continue;
    const fSportIds = sportsByFacilityId.get(f.id) || [];
    for (const sid of fSportIds) {
      const s = sportById.get(sid);
      if (s) sportSlugs.add(s.slug);
    }
  }
  return sportSlugs.size;
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

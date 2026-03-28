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
  averageRating: number | null;
  reviewCount: number;
  tipCount: number;
};

/** Recommended sort: premium first → facilities with reviews (by rating desc) → rest by name */
function recommendedSort(a: FacilityWithDetails, b: FacilityWithDetails): number {
  if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
  const aHas = a.reviewCount > 0 ? 1 : 0;
  const bHas = b.reviewCount > 0 ? 1 : 0;
  if (aHas !== bHas) return bHas - aHas;
  if (aHas && bHas) {
    const ra = a.averageRating ?? 0;
    const rb = b.averageRating ?? 0;
    if (rb !== ra) return rb - ra;
  }
  return a.name.localeCompare(b.name, "cs");
}

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
    averageRating: null,
    reviewCount: 0,
    tipCount: 0,
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
  const facility = await prisma.facility.findUnique({
    where: { slug },
    include: {
      location: { select: { city: true, region: true } },
      sports: { include: { sport: { select: { slug: true, nameCs: true, icon: true } } } },
      amenities: { include: { amenity: { select: { slug: true, nameCs: true, icon: true } } } },
      contacts: { select: { id: true, type: true, value: true, label: true, isPrimary: true } },
      images: { select: { url: true, alt: true, isPrimary: true }, orderBy: { order: "asc" } },
    },
  }) as unknown as FacilityWithDetails | null;
  // Hide deactivated facilities from public pages
  if (facility && !facility.isActive) return null;
  return facility;
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
  facilities.sort(recommendedSort);
  return facilities.slice(0, limit);
}

export async function getTopFacilitiesByRegionAndSport(
  regionSlug: string,
  sportSlug: string,
  limit: number = 10
): Promise<FacilityWithDetails[]> {
  const facilities = staticFacilitiesByRegionAndSport(regionSlug, sportSlug);
  facilities.sort(recommendedSort);
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
    // Sort: district asc, then recommended within each district
    mapped.sort((a, b) => {
      const distA = a.location.city;
      const distB = b.location.city;
      if (distA !== distB) return distA.localeCompare(distB, "cs", { numeric: true });
      return recommendedSort(a, b);
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
  mapped.sort(recommendedSort);

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

// --- Community / Review queries (DB only) ---

export type RecentReview = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  text: string | null;
  createdAt: Date;
  facility: { name: string; slug: string; sport: string | null };
};

export async function getRecentReviews(limit: number = 6): Promise<RecentReview[]> {
  try {
    const reviews = await withTimeout(
      prisma.review.findMany({
        where: { isApproved: true, facility: { sports: { some: {} } } },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          authorName: true,
          rating: true,
          title: true,
          text: true,
          createdAt: true,
          facility: {
            select: {
              name: true,
              slug: true,
              sports: { take: 1, select: { sport: { select: { slug: true } } } },
            },
          },
        },
      }),
      DB_QUERY_TIMEOUT_MS
    );
    return reviews.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      title: r.title,
      text: r.text,
      createdAt: r.createdAt,
      facility: {
        name: r.facility.name,
        slug: r.facility.slug,
        sport: r.facility.sports[0]?.sport.slug ?? null,
      },
    }));
  } catch {
    return [];
  }
}

export async function getTopRatedFacilities(limit: number = 6): Promise<FacilityWithDetails[]> {
  try {
    const facilities = await withTimeout(
      prisma.facility.findMany({
        where: { isActive: true, reviewCount: { gte: 1 }, averageRating: { not: null } },
        orderBy: [{ averageRating: "desc" }, { reviewCount: "desc" }],
        take: limit,
        include: {
          location: { select: { city: true, region: true } },
          sports: { include: { sport: { select: { slug: true, nameCs: true, icon: true } } } },
          amenities: { include: { amenity: { select: { slug: true, nameCs: true, icon: true } } } },
          contacts: { select: { id: true, type: true, value: true, label: true, isPrimary: true } },
          images: { select: { url: true, alt: true, isPrimary: true }, orderBy: { order: "asc" } },
        },
      }),
      DB_QUERY_TIMEOUT_MS
    );
    return facilities as unknown as FacilityWithDetails[];
  } catch {
    return [];
  }
}

export type ReviewWithFacility = {
  id: string;
  userId: string | null;
  authorName: string;
  rating: number;
  title: string | null;
  text: string | null;
  helpful: number;
  replyCount: number;
  createdAt: Date;
  facility: { id: string; name: string; slug: string; city: string; sport: string | null; sportNameCs: string | null };
};

export async function getAllApprovedReviews(opts: {
  sport?: string;
  sort?: "newest" | "oldest" | "highest" | "lowest" | "helpful";
  page?: number;
  limit?: number;
}): Promise<{ reviews: ReviewWithFacility[]; total: number }> {
  const { sport, sort = "newest", page = 1, limit = 20 } = opts;
  try {
    const where: Record<string, unknown> = { isApproved: true };
    if (sport) {
      where.facility = { sports: { some: { sport: { slug: sport } } } };
    } else {
      where.facility = { sports: { some: {} } };
    }

    const orderBy: Record<string, string> =
      sort === "oldest" ? { createdAt: "asc" }
        : sort === "highest" ? { rating: "desc" }
        : sort === "lowest" ? { rating: "asc" }
        : sort === "helpful" ? { helpful: "desc" }
        : { createdAt: "desc" };

    const [reviews, total] = await withTimeout(
      Promise.all([
        prisma.review.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            userId: true,
            authorName: true,
            rating: true,
            title: true,
            text: true,
            helpful: true,
            replyCount: true,
            createdAt: true,
            facility: {
              select: {
                id: true,
                name: true,
                slug: true,
                location: { select: { city: true } },
                sports: { take: 1, select: { sport: { select: { slug: true, nameCs: true } } } },
              },
            },
          },
        }),
        prisma.review.count({ where }),
      ]),
      DB_QUERY_TIMEOUT_MS
    );

    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        userId: r.userId,
        authorName: r.authorName,
        rating: r.rating,
        title: r.title,
        text: r.text,
        helpful: r.helpful,
        replyCount: r.replyCount,
        createdAt: r.createdAt,
        facility: {
          id: r.facility.id,
          name: r.facility.name,
          slug: r.facility.slug,
          city: r.facility.location.city,
          sport: r.facility.sports[0]?.sport.slug ?? null,
          sportNameCs: r.facility.sports[0]?.sport.nameCs ?? null,
        },
      })),
      total,
    };
  } catch {
    return { reviews: [], total: 0 };
  }
}

export async function getReviewStats(): Promise<{
  totalReviews: number;
  totalFacilitiesReviewed: number;
  averageRating: number;
}> {
  try {
    const [total, facilitiesReviewed, avgResult] = await withTimeout(
      Promise.all([
        prisma.review.count({ where: { isApproved: true } }),
        prisma.review.groupBy({
          by: ["facilityId"],
          where: { isApproved: true },
        }).then((g) => g.length),
        prisma.review.aggregate({
          where: { isApproved: true },
          _avg: { rating: true },
        }),
      ]),
      DB_QUERY_TIMEOUT_MS
    );
    return {
      totalReviews: total,
      totalFacilitiesReviewed: facilitiesReviewed,
      averageRating: Math.round((avgResult._avg.rating ?? 0) * 10) / 10,
    };
  } catch {
    return { totalReviews: 0, totalFacilitiesReviewed: 0, averageRating: 0 };
  }
}

export async function getCommunityStats(): Promise<{ totalReviews: number; totalUsers: number }> {
  try {
    const [reviews, users] = await withTimeout(
      Promise.all([
        prisma.review.count({ where: { isApproved: true } }),
        prisma.user.count(),
      ]),
      DB_QUERY_TIMEOUT_MS
    );
    return { totalReviews: reviews, totalUsers: users };
  } catch {
    return { totalReviews: 0, totalUsers: 0 };
  }
}

export interface TopReviewer {
  id: string;
  name: string;
  reviewCount: number;
  helpfulVotes: number;
}

export async function getTopReviewers(limit: number = 10, sport?: string): Promise<TopReviewer[]> {
  try {
    const sportReviewFilter = sport
      ? { facility: { sports: { some: { sport: { slug: sport } } } } }
      : {};
    const reviewers = await withTimeout(
      prisma.user.findMany({
        where: {
          isSeed: false,
          ...(sport
            ? { reviews: { some: { isApproved: true, ...sportReviewFilter } } }
            : {}),
        },
        select: {
          id: true,
          name: true,
          reviews: {
            where: { isApproved: true, ...sportReviewFilter },
            select: { helpful: true },
          },
        },
      }),
      DB_QUERY_TIMEOUT_MS
    );
    return reviewers
      .map((u) => ({
        id: u.id,
        name: u.name || "Sportovec",
        reviewCount: u.reviews.length,
        helpfulVotes: u.reviews.reduce((sum, r) => sum + r.helpful, 0),
      }))
      .filter((u) => u.reviewCount > 0)
      .sort((a, b) => b.helpfulVotes - a.helpfulVotes || b.reviewCount - a.reviewCount)
      .slice(0, limit);
  } catch {
    return [];
  }
}

/** Top reviews for a specific sport (for sport category pages) */
export async function getTopReviewsBySport(
  sportSlug: string,
  limit: number = 3
): Promise<ReviewWithFacility[]> {
  try {
    const reviews = await withTimeout(
      prisma.review.findMany({
        where: {
          isApproved: true,
          facility: { sports: { some: { sport: { slug: sportSlug } } } },
        },
        orderBy: [{ rating: "desc" }, { helpful: "desc" }, { createdAt: "desc" }],
        take: limit,
        select: {
          id: true,
          userId: true,
          authorName: true,
          rating: true,
          title: true,
          text: true,
          helpful: true,
          replyCount: true,
          createdAt: true,
          facility: {
            select: {
              id: true,
              name: true,
              slug: true,
              location: { select: { city: true } },
              sports: { take: 1, select: { sport: { select: { slug: true, nameCs: true } } } },
            },
          },
        },
      }),
      DB_QUERY_TIMEOUT_MS
    );
    return reviews.map((r) => ({
      id: r.id,
      userId: r.userId,
      authorName: r.authorName,
      rating: r.rating,
      title: r.title,
      text: r.text,
      helpful: r.helpful,
      replyCount: r.replyCount,
      createdAt: r.createdAt,
      facility: {
        id: r.facility.id,
        name: r.facility.name,
        slug: r.facility.slug,
        city: r.facility.location.city,
        sport: r.facility.sports[0]?.sport.slug ?? null,
        sportNameCs: r.facility.sports[0]?.sport.nameCs ?? null,
      },
    }));
  } catch {
    return [];
  }
}

/** Review count + average for a sport (for sport category hero stats) */
export async function getSportReviewStats(sportSlug: string): Promise<{
  totalReviews: number;
  averageRating: number;
}> {
  try {
    const [total, avgResult] = await withTimeout(
      Promise.all([
        prisma.review.count({
          where: {
            isApproved: true,
            facility: { sports: { some: { sport: { slug: sportSlug } } } },
          },
        }),
        prisma.review.aggregate({
          where: {
            isApproved: true,
            facility: { sports: { some: { sport: { slug: sportSlug } } } },
          },
          _avg: { rating: true },
        }),
      ]),
      DB_QUERY_TIMEOUT_MS
    );
    return {
      totalReviews: total,
      averageRating: Math.round((avgResult._avg.rating ?? 0) * 10) / 10,
    };
  } catch {
    return { totalReviews: 0, averageRating: 0 };
  }
}

/** Review stats for a sport in a specific region */
export async function getRegionSportReviewStats(
  regionSlug: string,
  sportSlug: string
): Promise<{ totalReviews: number; averageRating: number }> {
  const region = getRegionBySlug(regionSlug);
  if (!region) return { totalReviews: 0, averageRating: 0 };
  try {
    const [total, avgResult] = await withTimeout(
      Promise.all([
        prisma.review.count({
          where: {
            isApproved: true,
            facility: {
              isActive: true,
              sports: { some: { sport: { slug: sportSlug } } },
              location: { region: region.name },
            },
          },
        }),
        prisma.review.aggregate({
          where: {
            isApproved: true,
            facility: {
              isActive: true,
              sports: { some: { sport: { slug: sportSlug } } },
              location: { region: region.name },
            },
          },
          _avg: { rating: true },
        }),
      ]),
      DB_QUERY_TIMEOUT_MS
    );
    return {
      totalReviews: total,
      averageRating: Math.round((avgResult._avg.rating ?? 0) * 10) / 10,
    };
  } catch {
    return { totalReviews: 0, averageRating: 0 };
  }
}

/** Map markers for facilities with coordinates in a sport × region */
export function getFacilityMapMarkersByRegionAndSport(
  regionSlug: string,
  sportSlug: string
): { lat: number; lng: number; name: string; address: string; url: string }[] {
  const facilities = staticFacilitiesByRegionAndSport(regionSlug, sportSlug);
  return facilities
    .filter((f) => f.lat != null && f.lng != null)
    .map((f) => ({
      lat: f.lat!,
      lng: f.lng!,
      name: f.name,
      address: f.address,
      url: `/sport/${sportSlug}/${f.slug}`,
    }));
}

/** Map markers for all facilities with coordinates in a sport */
export function getFacilityMapMarkersBySport(sportSlug: string): {
  lat: number;
  lng: number;
  name: string;
  address: string;
  url: string;
}[] {
  const facilityIds = facilitiesBySportSlug.get(sportSlug);
  if (!facilityIds) return [];

  return exportData.facilities
    .filter((f) => facilityIds.has(f.id) && f.isActive && f.lat != null && f.lng != null)
    .map((f) => {
      const loc = locationById.get(f.locationId);
      return {
        lat: f.lat!,
        lng: f.lng!,
        name: f.name,
        address: loc ? `${f.address}, ${loc.city}` : f.address,
        url: `/sport/${sportSlug}/${f.slug}`,
      };
    });
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

/** Haversine distance in km between two GPS coordinates */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type NearbyFacility = FacilityWithDetails & { distanceKm: number | null };

/** Related facilities for same sport, sorted by GPS distance when coordinates available */
export async function getRelatedFacilities(
  sportSlug: string,
  city: string,
  region: string | null,
  excludeSlug: string,
  limit: number = 6,
  originLat?: number | null,
  originLng?: number | null,
): Promise<{ facilities: NearbyFacility[]; isMixed: boolean }> {
  const facilityIds = facilitiesBySportSlug.get(sportSlug);
  if (!facilityIds) return { facilities: [], isMixed: false };

  const candidates = exportData.facilities.filter((f) => {
    return facilityIds.has(f.id) && f.isActive && f.slug !== excludeSlug;
  });

  const hasOrigin = originLat != null && originLng != null;

  // Attach distance to each candidate
  type CandidateWithDist = { raw: ExportData["facilities"][number]; distKm: number | null };
  const withDist: CandidateWithDist[] = candidates.map((f) => ({
    raw: f,
    distKm: hasOrigin && f.lat && f.lng ? haversineKm(originLat!, originLng!, f.lat, f.lng) : null,
  }));

  if (hasOrigin) {
    // GPS-based: sort all candidates by distance, take closest
    const withCoords = withDist.filter((c) => c.distKm != null);
    withCoords.sort((a, b) => a.distKm! - b.distKm!);

    // Also include candidates without coords (appended at end, sorted by city match then rating)
    const noCoords = withDist.filter((c) => c.distKm == null);
    noCoords.sort((a, b) => {
      const locA = locationById.get(a.raw.locationId);
      const locB = locationById.get(b.raw.locationId);
      const aCityMatch = locA?.city === city ? 0 : 1;
      const bCityMatch = locB?.city === city ? 0 : 1;
      if (aCityMatch !== bCityMatch) return aCityMatch - bCityMatch;
      return a.raw.name.localeCompare(b.raw.name, "cs");
    });

    const sorted = [...withCoords, ...noCoords].slice(0, limit);
    const results: NearbyFacility[] = sorted.map((c) => ({
      ...toFacilityWithDetails(c.raw),
      distanceKm: c.distKm,
    }));
    return { facilities: results, isMixed: results.some((f) => f.location.city !== city) };
  }

  // Fallback: city/region grouping (no GPS available)
  // 1. Same city
  const sameCity = withDist.filter((c) => {
    const loc = locationById.get(c.raw.locationId);
    return loc?.city === city;
  });

  let results: NearbyFacility[] = sameCity.map((c) => ({
    ...toFacilityWithDetails(c.raw),
    distanceKm: null,
  }));
  results.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0) || a.name.localeCompare(b.name, "cs"));

  if (results.length >= limit) {
    return { facilities: results.slice(0, limit), isMixed: false };
  }

  // 2. Expand to same region
  if (region) {
    const sameCitySlugs = new Set(sameCity.map((c) => c.raw.slug));
    const sameRegion = withDist.filter((c) => {
      if (sameCitySlugs.has(c.raw.slug)) return false;
      const loc = locationById.get(c.raw.locationId);
      return loc?.region === region;
    });
    const regionMapped: NearbyFacility[] = sameRegion.map((c) => ({
      ...toFacilityWithDetails(c.raw),
      distanceKm: null,
    }));
    regionMapped.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0) || a.name.localeCompare(b.name, "cs"));
    results = [...results, ...regionMapped];
  }

  if (results.length >= limit) {
    return { facilities: results.slice(0, limit), isMixed: results.some((f) => f.location.city !== city) };
  }

  // 3. Fill remaining from any city
  const usedSlugs = new Set(results.map((f) => f.slug));
  const remaining: NearbyFacility[] = withDist
    .filter((c) => !usedSlugs.has(c.raw.slug))
    .map((c) => ({ ...toFacilityWithDetails(c.raw), distanceKm: null }));
  remaining.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
  results = [...results, ...remaining.slice(0, limit - results.length)];

  return { facilities: results.slice(0, limit), isMixed: results.some((f) => f.location.city !== city) };
}

/** Search facilities by name, city, or sport name */
export async function searchFacilities(
  query: string,
  sportSlug?: string,
  limit: number = 50
): Promise<FacilityWithDetails[]> {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  if (tokens.length === 0) return [];

  let candidates = exportData.facilities.filter((f) => f.isActive);

  // Filter by sport if specified
  if (sportSlug) {
    const sportFacilityIds = facilitiesBySportSlug.get(sportSlug);
    if (!sportFacilityIds) return [];
    candidates = candidates.filter((f) => sportFacilityIds.has(f.id));
  }

  const results = candidates.filter((f) => {
    const nameLower = f.name.toLowerCase();
    const loc = locationById.get(f.locationId);
    const cityLower = loc?.city.toLowerCase() ?? "";
    const fSportIds = sportsByFacilityId.get(f.id) || [];
    const sportNames = fSportIds.map(
      (sid) => sportById.get(sid)?.nameCs.toLowerCase() ?? ""
    );

    // Every token must match at least one field (name, city, or a sport)
    return tokens.every(
      (token) =>
        nameLower.includes(token) ||
        cityLower.includes(token) ||
        sportNames.some((sn) => sn.includes(token))
    );
  });

  const mapped = results.map(toFacilityWithDetails);
  mapped.sort(recommendedSort);

  return mapped.slice(0, limit);
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

// --- Community Activity Feed ---

export type ActivityItem = {
  type: "review" | "checkin" | "tip" | "photo";
  id: string;
  date: string;
  user: { name: string; id: string | null };
  facility: { name: string; slug: string; sport: string | null; city: string };
  data: Record<string, unknown>;
};

export async function getRecentActivity(opts: {
  sport?: string;
  limit?: number;
} = {}): Promise<ActivityItem[]> {
  const { sport, limit = 20 } = opts;
  const take = Math.min(limit, 50);

  const sportFilter = sport
    ? { facility: { isActive: true, sports: { some: { sport: { slug: sport } } } } }
    : { facility: { isActive: true, sports: { some: {} } } };

  try {
    const [reviews, visits, tips] = await withTimeout(
      Promise.all([
        prisma.review.findMany({
          where: { isApproved: true, ...sportFilter },
          orderBy: { createdAt: "desc" },
          take,
          select: {
            id: true,
            authorName: true,
            userId: true,
            rating: true,
            title: true,
            createdAt: true,
            facility: {
              select: {
                name: true,
                slug: true,
                location: { select: { city: true } },
                sports: { take: 1, select: { sport: { select: { slug: true } } } },
              },
            },
          },
        }),
        prisma.visit.findMany({
          where: sportFilter,
          orderBy: { createdAt: "desc" },
          take,
          select: {
            id: true,
            userId: true,
            note: true,
            createdAt: true,
            user: { select: { name: true } },
            facility: {
              select: {
                name: true,
                slug: true,
                location: { select: { city: true } },
                sports: { take: 1, select: { sport: { select: { slug: true } } } },
              },
            },
          },
        }),
        prisma.facilityTip.findMany({
          where: { isApproved: true, ...sportFilter },
          orderBy: { createdAt: "desc" },
          take,
          select: {
            id: true,
            userId: true,
            text: true,
            createdAt: true,
            user: { select: { name: true } },
            facility: {
              select: {
                name: true,
                slug: true,
                location: { select: { city: true } },
                sports: { take: 1, select: { sport: { select: { slug: true } } } },
              },
            },
          },
        }),
      ]),
      DB_QUERY_TIMEOUT_MS
    );

    const items: ActivityItem[] = [];

    for (const r of reviews) {
      items.push({
        type: "review",
        id: r.id,
        date: r.createdAt.toISOString(),
        user: { name: r.authorName, id: r.userId },
        facility: {
          name: r.facility.name,
          slug: r.facility.slug,
          sport: r.facility.sports[0]?.sport.slug ?? null,
          city: r.facility.location.city,
        },
        data: { rating: r.rating, title: r.title },
      });
    }

    for (const v of visits) {
      items.push({
        type: "checkin",
        id: v.id,
        date: v.createdAt.toISOString(),
        user: { name: v.user.name || "Sportovec", id: v.userId },
        facility: {
          name: v.facility.name,
          slug: v.facility.slug,
          sport: v.facility.sports[0]?.sport.slug ?? null,
          city: v.facility.location.city,
        },
        data: { note: v.note },
      });
    }

    for (const t of tips) {
      items.push({
        type: "tip",
        id: t.id,
        date: t.createdAt.toISOString(),
        user: { name: t.user.name || "Sportovec", id: t.userId },
        facility: {
          name: t.facility.name,
          slug: t.facility.slug,
          sport: t.facility.sports[0]?.sport.slug ?? null,
          city: t.facility.location.city,
        },
        data: { text: t.text },
      });
    }

    items.sort((a, b) => b.date.localeCompare(a.date));
    return items.slice(0, take);
  } catch {
    return [];
  }
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

// --- Guide page queries ---

/** Top-rated facilities for a sport in a specific region (for guide pages) */
export async function getGuideFacilitiesByRegion(
  sportSlug: string,
  regionSlug: string,
  limit: number = 20
): Promise<FacilityWithDetails[]> {
  try {
    const region = getRegionBySlug(regionSlug);
    if (!region) return [];
    const facilities = await withTimeout(
      prisma.facility.findMany({
        where: {
          isActive: true,
          sports: { some: { sport: { slug: sportSlug } } },
          location: { region: region.name },
        },
        include: {
          location: { select: { city: true, region: true } },
          sports: { include: { sport: { select: { slug: true, nameCs: true, icon: true } } } },
          amenities: { include: { amenity: { select: { slug: true, nameCs: true, icon: true } } } },
          contacts: { select: { id: true, type: true, value: true, label: true, isPrimary: true } },
          images: { select: { url: true, alt: true, isPrimary: true }, orderBy: { order: "asc" } },
        },
        orderBy: [{ averageRating: { sort: "desc", nulls: "last" } }, { reviewCount: "desc" }, { name: "asc" }],
        take: limit,
      }),
      DB_QUERY_TIMEOUT_MS
    );
    return facilities as unknown as FacilityWithDetails[];
  } catch {
    const facilities = staticFacilitiesByRegionAndSport(regionSlug, sportSlug);
    facilities.sort(recommendedSort);
    return facilities.slice(0, limit);
  }
}

/** Best-rated facilities for a sport nationally (for guide pages) */
export async function getGuideBestRatedFacilities(
  sportSlug: string,
  limit: number = 20
): Promise<FacilityWithDetails[]> {
  try {
    const facilities = await withTimeout(
      prisma.facility.findMany({
        where: {
          isActive: true,
          reviewCount: { gte: 1 },
          averageRating: { not: null },
          sports: { some: { sport: { slug: sportSlug } } },
        },
        include: {
          location: { select: { city: true, region: true } },
          sports: { include: { sport: { select: { slug: true, nameCs: true, icon: true } } } },
          amenities: { include: { amenity: { select: { slug: true, nameCs: true, icon: true } } } },
          contacts: { select: { id: true, type: true, value: true, label: true, isPrimary: true } },
          images: { select: { url: true, alt: true, isPrimary: true }, orderBy: { order: "asc" } },
        },
        orderBy: [{ averageRating: "desc" }, { reviewCount: "desc" }],
        take: limit,
      }),
      DB_QUERY_TIMEOUT_MS
    );
    return facilities as unknown as FacilityWithDetails[];
  } catch {
    const all = staticFacilitiesBySport(sportSlug);
    return all
      .filter((f) => f.reviewCount > 0)
      .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0) || b.reviewCount - a.reviewCount)
      .slice(0, limit);
  }
}

/** Beginner-friendly facilities — uses description keyword matching as proxy */
export async function getGuideBeginnerFacilities(
  sportSlug: string,
  limit: number = 20
): Promise<FacilityWithDetails[]> {
  const beginnerKeywords = ["začátečník", "začátečníky", "snadná", "snadné", "easy", "lehká", "lehké", "rodina", "děti", "dětí", "family"];
  try {
    const facilities = await withTimeout(
      prisma.facility.findMany({
        where: {
          isActive: true,
          sports: { some: { sport: { slug: sportSlug } } },
          OR: beginnerKeywords.map((kw) => ({
            description: { contains: kw, mode: "insensitive" as const },
          })),
        },
        include: {
          location: { select: { city: true, region: true } },
          sports: { include: { sport: { select: { slug: true, nameCs: true, icon: true } } } },
          amenities: { include: { amenity: { select: { slug: true, nameCs: true, icon: true } } } },
          contacts: { select: { id: true, type: true, value: true, label: true, isPrimary: true } },
          images: { select: { url: true, alt: true, isPrimary: true }, orderBy: { order: "asc" } },
        },
        orderBy: [{ averageRating: { sort: "desc", nulls: "last" } }, { name: "asc" }],
        take: limit,
      }),
      DB_QUERY_TIMEOUT_MS
    );
    return facilities as unknown as FacilityWithDetails[];
  } catch {
    const all = staticFacilitiesBySport(sportSlug);
    return all
      .filter((f) => {
        const desc = (f.description ?? "").toLowerCase();
        return beginnerKeywords.some((kw) => desc.includes(kw));
      })
      .sort(recommendedSort)
      .slice(0, limit);
  }
}

/** Map markers for guide facilities */
export function getGuideMapMarkers(
  facilities: FacilityWithDetails[],
  sportSlug: string
): { lat: number; lng: number; name: string; address: string; url: string }[] {
  return facilities
    .filter((f) => f.lat != null && f.lng != null)
    .map((f) => ({
      lat: f.lat!,
      lng: f.lng!,
      name: f.name,
      address: `${f.address}, ${f.location.city}`,
      url: `/sport/${sportSlug}/${f.slug}`,
    }));
}

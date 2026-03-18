import { prisma } from "./prisma";

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

// Seed-level mock data for use when DB is unavailable
export const MOCK_FACILITIES: FacilityWithDetails[] = [
  {
    id: "mock-1",
    name: "Sportcentrum Strahov",
    slug: "sportcentrum-strahov",
    description: "Největší sportovní centrum v Praze s 12 tenisovými kurty.",
    address: "Vaníčkova 2, Praha 6",
    postalCode: "169 00",
    lat: 50.081,
    lng: 14.385,
    googlePlaceId: null,
    courtsLanes: 12,
    pricing: "300–450 Kč/hod",
    openingHours: {
      po: "07:00–22:00",
      út: "07:00–22:00",
      st: "07:00–22:00",
      čt: "07:00–22:00",
      pá: "07:00–22:00",
      so: "08:00–20:00",
      ne: "08:00–20:00",
    },
    website: "https://strahov.cz",
    isActive: true,
    isPremium: true,
    isClaimed: true,
    location: { city: "Praha", region: "Praha" },
    sports: [{ sport: { slug: "tenis", nameCs: "Tenis", icon: "🎾" } }],
    amenities: [
      { amenity: { slug: "parking", nameCs: "Parkování", icon: "🅿️" } },
      { amenity: { slug: "showers", nameCs: "Sprchy", icon: "🚿" } },
      { amenity: { slug: "cafe", nameCs: "Kavárna", icon: "☕" } },
    ],
    contacts: [
      {
        id: "c1",
        type: "PHONE",
        value: "+420 233 355 400",
        label: "Recepce",
        isPrimary: true,
      },
    ],
    images: [],
  },
  {
    id: "mock-2",
    name: "Squash Arena Žižkov",
    slug: "squash-arena-zizkov",
    description: "6 squashových kurtů v centru Prahy, otevřeno 7 dní v týdnu.",
    address: "Seifertova 22, Praha 3",
    postalCode: "130 00",
    lat: 50.088,
    lng: 14.446,
    googlePlaceId: null,
    courtsLanes: 6,
    pricing: "200–280 Kč/hod",
    openingHours: {
      po: "06:00–23:00",
      út: "06:00–23:00",
      st: "06:00–23:00",
      čt: "06:00–23:00",
      pá: "06:00–23:00",
      so: "08:00–22:00",
      ne: "09:00–21:00",
    },
    website: null,
    isActive: true,
    isPremium: false,
    isClaimed: false,
    location: { city: "Praha", region: "Praha" },
    sports: [{ sport: { slug: "squash", nameCs: "Squash", icon: "🏸" } }],
    amenities: [
      { amenity: { slug: "showers", nameCs: "Sprchy", icon: "🚿" } },
    ],
    contacts: [
      {
        id: "c2",
        type: "EMAIL",
        value: "rezervace@squasharena.cz",
        label: "Rezervace",
        isPrimary: true,
      },
    ],
    images: [],
  },
  {
    id: "mock-3",
    name: "SK Badminton Brno",
    slug: "sk-badminton-brno",
    description: "Moderní badmintonová hala s 8 kurty v Brně.",
    address: "Sportovní 4, Brno",
    postalCode: "602 00",
    lat: 49.195,
    lng: 16.608,
    googlePlaceId: null,
    courtsLanes: 8,
    pricing: "180–240 Kč/hod",
    openingHours: {
      po: "08:00–22:00",
      út: "08:00–22:00",
      st: "08:00–22:00",
      čt: "08:00–22:00",
      pá: "08:00–22:00",
      so: "09:00–20:00",
      ne: "10:00–18:00",
    },
    website: "https://skbadminton-brno.cz",
    isActive: true,
    isPremium: false,
    isClaimed: true,
    location: { city: "Brno", region: "Jihomoravský kraj" },
    sports: [{ sport: { slug: "badminton", nameCs: "Badminton", icon: "🏸" } }],
    amenities: [
      { amenity: { slug: "parking", nameCs: "Parkování", icon: "🅿️" } },
      { amenity: { slug: "showers", nameCs: "Sprchy", icon: "🚿" } },
    ],
    contacts: [
      {
        id: "c3",
        type: "PHONE",
        value: "+420 544 212 345",
        label: null,
        isPrimary: true,
      },
    ],
    images: [],
  },
  {
    id: "mock-4",
    name: "Aquapark Olomouc",
    slug: "aquapark-olomouc",
    description: "Plavecký areál s 50m bazénem a dětskou sekcí.",
    address: "Rolsberská 4, Olomouc",
    postalCode: "779 00",
    lat: 49.594,
    lng: 17.251,
    googlePlaceId: null,
    courtsLanes: 8,
    pricing: "80–150 Kč/vstup",
    openingHours: {
      po: "06:00–21:00",
      út: "06:00–21:00",
      st: "06:00–21:00",
      čt: "06:00–21:00",
      pá: "06:00–21:00",
      so: "08:00–20:00",
      ne: "08:00–20:00",
    },
    website: "https://aquapark-olomouc.cz",
    isActive: true,
    isPremium: false,
    isClaimed: false,
    location: { city: "Olomouc", region: "Olomoucký kraj" },
    sports: [{ sport: { slug: "plavani", nameCs: "Plavání", icon: "🏊" } }],
    amenities: [
      { amenity: { slug: "parking", nameCs: "Parkování", icon: "🅿️" } },
      { amenity: { slug: "showers", nameCs: "Sprchy", icon: "🚿" } },
      { amenity: { slug: "cafe", nameCs: "Kavárna", icon: "☕" } },
    ],
    contacts: [
      {
        id: "c4",
        type: "PHONE",
        value: "+420 585 231 100",
        label: "Recepce",
        isPrimary: true,
      },
    ],
    images: [],
  },
  {
    id: "mock-5",
    name: "Tenisový klub Sparta Praha",
    slug: "tenisovy-klub-sparta-praha",
    description: "Historický tenisový klub s antukovou i tvrdou povrchovou variantou.",
    address: "Milady Horákové 98, Praha 7",
    postalCode: "170 00",
    lat: 50.099,
    lng: 14.42,
    googlePlaceId: null,
    courtsLanes: 20,
    pricing: "400–600 Kč/hod",
    openingHours: {
      po: "07:00–21:00",
      út: "07:00–21:00",
      st: "07:00–21:00",
      čt: "07:00–21:00",
      pá: "07:00–21:00",
      so: "08:00–19:00",
      ne: "08:00–19:00",
    },
    website: "https://sparta-tenis.cz",
    isActive: true,
    isPremium: true,
    isClaimed: true,
    location: { city: "Praha", region: "Praha" },
    sports: [{ sport: { slug: "tenis", nameCs: "Tenis", icon: "🎾" } }],
    amenities: [
      { amenity: { slug: "parking", nameCs: "Parkování", icon: "🅿️" } },
      { amenity: { slug: "showers", nameCs: "Sprchy", icon: "🚿" } },
      { amenity: { slug: "cafe", nameCs: "Kavárna", icon: "☕" } },
      { amenity: { slug: "pro-shop", nameCs: "Pro shop", icon: "🛍️" } },
    ],
    contacts: [
      {
        id: "c5",
        type: "PHONE",
        value: "+420 233 371 480",
        label: "Recepce",
        isPrimary: true,
      },
      {
        id: "c5b",
        type: "EMAIL",
        value: "info@sparta-tenis.cz",
        label: null,
        isPrimary: false,
      },
    ],
    images: [],
  },
];

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

export async function getFacilitiesBySport(
  sportSlug: string,
  cityFilter?: string
): Promise<{ facilities: FacilityWithDetails[]; isLive: boolean }> {
  try {
    const facilities = await withTimeout(dbFacilitiesBySport(sportSlug, cityFilter), DB_QUERY_TIMEOUT_MS);
    return { facilities, isLive: true };
  } catch (err) {
    console.warn(`[hraju.cz] DB fallback for getFacilitiesBySport(${sportSlug}): ${err instanceof Error ? err.message : err}`);
    const filtered = MOCK_FACILITIES.filter(
      (f) =>
        f.sports.some((s) => s.sport.slug === sportSlug) &&
        (!cityFilter || f.location.city.toLowerCase().includes(cityFilter.toLowerCase()))
    );
    return { facilities: filtered, isLive: false };
  }
}

export async function getFacilityBySlug(
  slug: string
): Promise<{ facility: FacilityWithDetails | null; isLive: boolean }> {
  try {
    const facility = await withTimeout(dbFacilityBySlug(slug), DB_QUERY_TIMEOUT_MS);
    return { facility, isLive: true };
  } catch (err) {
    console.warn(`[hraju.cz] DB fallback for getFacilityBySlug(${slug}): ${err instanceof Error ? err.message : err}`);
    const facility = MOCK_FACILITIES.find((f) => f.slug === slug) ?? null;
    return { facility, isLive: false };
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
  } catch (err) {
    console.warn(`[hraju.cz] DB fallback for getCities(): ${err instanceof Error ? err.message : err}`);
    return [...new Set(MOCK_FACILITIES.map((f) => f.location.city))].sort();
  }
}

import type { MetadataRoute } from "next";
import { SPORTS } from "@/lib/sports";
import { prisma } from "@/lib/prisma";
import exportData from "@/data/facilities-export.json";
import { cityToSlug } from "@/lib/regions";

const BASE_URL = "https://hraju.cz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Facility detail pages + city listing pages from DB (fallback to static export)
  let facilities: { slug: string; sportSlugs: string[]; city: string; updatedAt?: Date }[] = [];

  try {
    const dbQuery = prisma.facility.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        updatedAt: true,
        location: { select: { city: true } },
        sports: { select: { sport: { select: { slug: true } } } },
      },
    });
    const dbFacilities = await Promise.race([
      dbQuery,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DB query timed out")), 3000)
      ),
    ]);
    facilities = dbFacilities.map((f) => ({
      slug: f.slug,
      sportSlugs: f.sports.map((s) => s.sport.slug),
      city: f.location.city,
      updatedAt: f.updatedAt,
    }));
  } catch {
    // Use static JSON export
    const sportById = new Map(exportData.sports.map((s) => [s.id, s]));
    const locationById = new Map(exportData.locations.map((l) => [l.id, l]));
    const sportsByFacId = new Map<string, string[]>();
    for (const fs of exportData.facilitySports) {
      const sport = sportById.get(fs.sportId);
      if (!sport) continue;
      const arr = sportsByFacId.get(fs.facilityId) || [];
      arr.push(sport.slug);
      sportsByFacId.set(fs.facilityId, arr);
    }
    facilities = exportData.facilities.map((f) => ({
      slug: f.slug,
      sportSlugs: sportsByFacId.get(f.id) || [],
      city: locationById.get(f.locationId)?.city || "",
    }));
  }

  // Pre-compute lastmod dates per sport and per sport+city
  const sportLastmod = new Map<string, Date>();
  const sportCityLastmod = new Map<string, Date>(); // key: "sport|city"
  const crossCityLastmod = new Map<string, Date>(); // key: city

  for (const facility of facilities) {
    if (!facility.updatedAt) continue;
    for (const sportSlug of facility.sportSlugs) {
      const prev = sportLastmod.get(sportSlug);
      if (!prev || facility.updatedAt > prev) {
        sportLastmod.set(sportSlug, facility.updatedAt);
      }
      const key = `${sportSlug}|${facility.city}`;
      const prevCity = sportCityLastmod.get(key);
      if (!prevCity || facility.updatedAt > prevCity) {
        sportCityLastmod.set(key, facility.updatedAt);
      }
    }
    const prevCross = crossCityLastmod.get(facility.city);
    if (!prevCross || facility.updatedAt > prevCross) {
      crossCityLastmod.set(facility.city, facility.updatedAt);
    }
  }

  // Homepage
  const globalLastmod = facilities.reduce<Date | undefined>(
    (latest, f) => f.updatedAt && (!latest || f.updatedAt > latest) ? f.updatedAt : latest,
    undefined
  );
  entries.push({ url: BASE_URL, lastModified: globalLastmod, changeFrequency: "weekly", priority: 1.0 });

  // Sport index pages
  for (const sport of SPORTS) {
    entries.push({
      url: `${BASE_URL}/sport/${sport.slug}`,
      lastModified: sportLastmod.get(sport.slug),
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  // Facility detail pages — one entry per sport×facility combination
  for (const facility of facilities) {
    for (const sportSlug of facility.sportSlugs) {
      entries.push({
        url: `${BASE_URL}/sport/${sportSlug}/${facility.slug}`,
        lastModified: facility.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  // City landing pages — distinct cities per sport (only 2+ facilities)
  // Praha districts are aggregated into a unified "praha" entry per sport
  const cityCountBySport = new Map<string, Map<string, number>>();
  const prahaCountBySport = new Map<string, number>();
  for (const facility of facilities) {
    for (const sportSlug of facility.sportSlugs) {
      if (!cityCountBySport.has(sportSlug)) cityCountBySport.set(sportSlug, new Map());
      const cityMap = cityCountBySport.get(sportSlug)!;
      if (/^Praha \d+$/.test(facility.city)) {
        prahaCountBySport.set(sportSlug, (prahaCountBySport.get(sportSlug) || 0) + 1);
      }
      cityMap.set(facility.city, (cityMap.get(facility.city) || 0) + 1);
    }
  }

  for (const [sportSlug, cityMap] of cityCountBySport) {
    for (const [city, count] of cityMap) {
      if (count < 2) continue;
      const isPraha = /^Praha \d+$/.test(city);
      entries.push({
        url: `${BASE_URL}/sport/${sportSlug}/${cityToSlug(city)}`,
        lastModified: sportCityLastmod.get(`${sportSlug}|${city}`),
        changeFrequency: "weekly",
        priority: isPraha ? 0.8 : 0.7,
      });
    }
    // Add unified Praha entry + district sub-pages per sport
    const prahaTotal = prahaCountBySport.get(sportSlug) || 0;
    if (prahaTotal >= 2) {
      // Compute Praha lastmod from all Praha district facilities
      let prahaLastmod: Date | undefined;
      for (const [key, date] of sportCityLastmod) {
        if (key.startsWith(`${sportSlug}|Praha `)) {
          if (!prahaLastmod || date > prahaLastmod) prahaLastmod = date;
        }
      }
      entries.push({
        url: `${BASE_URL}/sport/${sportSlug}/praha`,
        lastModified: prahaLastmod,
        changeFrequency: "weekly",
        priority: 0.8,
      });

      // District sub-pages: /sport/{sport}/praha/{district}
      for (const [city, count] of cityMap) {
        if (count < 1 || !/^Praha \d+$/.test(city)) continue;
        entries.push({
          url: `${BASE_URL}/sport/${sportSlug}/praha/${cityToSlug(city)}`,
          lastModified: sportCityLastmod.get(`${sportSlug}|${city}`),
          changeFrequency: "weekly",
          priority: 0.75,
        });
      }
    }
  }

  // Static pages
  entries.push({
    url: `${BASE_URL}/odkazy`,
    changeFrequency: "monthly",
    priority: 0.5,
  });

  // Cross-sport city pages: /mesta index + /mesto/[city] for top 20 cities
  entries.push({
    url: `${BASE_URL}/mesta`,
    lastModified: globalLastmod,
    changeFrequency: "weekly",
    priority: 0.8,
  });

  const crossCityCounts = new Map<string, number>();
  let crossPrahaCount = 0;
  for (const facility of facilities) {
    if (/^Praha \d+$/.test(facility.city)) {
      crossPrahaCount++;
    } else {
      crossCityCounts.set(facility.city, (crossCityCounts.get(facility.city) || 0) + 1);
    }
  }
  const crossCityEntries: { city: string; slug: string; count: number }[] = [];
  for (const [city, count] of crossCityCounts) {
    if (count >= 2) {
      crossCityEntries.push({ city, slug: cityToSlug(city), count });
    }
  }
  if (crossPrahaCount >= 2) {
    crossCityEntries.push({ city: "Praha", slug: "praha", count: crossPrahaCount });
  }
  crossCityEntries.sort((a, b) => b.count - a.count);
  for (const entry of crossCityEntries.slice(0, 20)) {
    entries.push({
      url: `${BASE_URL}/mesto/${entry.slug}`,
      lastModified: crossCityLastmod.get(entry.city),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}

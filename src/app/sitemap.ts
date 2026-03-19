import type { MetadataRoute } from "next";
import { SPORTS } from "@/lib/sports";
import { prisma } from "@/lib/prisma";
import exportData from "@/data/facilities-export.json";
import { cityToSlug } from "@/lib/regions";

const BASE_URL = "https://hraju.cz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push({ url: BASE_URL, changeFrequency: "weekly", priority: 1.0 });

  // Sport index pages
  for (const sport of SPORTS) {
    entries.push({
      url: `${BASE_URL}/sport/${sport.slug}`,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

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

  // Facility detail pages — one entry per sport×facility combination
  for (const facility of facilities) {
    for (const sportSlug of facility.sportSlugs) {
      entries.push({
        url: `${BASE_URL}/sport/${sportSlug}/${facility.slug}`,
        lastModified: facility.updatedAt,
        changeFrequency: "monthly",
        priority: 0.7,
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
      entries.push({
        url: `${BASE_URL}/sport/${sportSlug}/${cityToSlug(city)}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    // Add unified Praha entry per sport (if 2+ Praha facilities exist)
    const prahaTotal = prahaCountBySport.get(sportSlug) || 0;
    if (prahaTotal >= 2) {
      entries.push({
        url: `${BASE_URL}/sport/${sportSlug}/praha`,
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }
  }

  return entries;
}

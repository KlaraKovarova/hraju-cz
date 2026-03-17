import type { MetadataRoute } from "next";
import { SPORTS } from "@/lib/sports";
import { prisma } from "@/lib/prisma";
import { MOCK_FACILITIES } from "@/lib/data";

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

  // Facility detail pages + city listing pages from DB (fallback to mock)
  let facilities: { slug: string; sportSlugs: string[]; city: string; updatedAt?: Date }[] = [];

  try {
    const dbFacilities = await prisma.facility.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        updatedAt: true,
        location: { select: { city: true } },
        sports: { select: { sport: { select: { slug: true } } } },
      },
    });
    facilities = dbFacilities.map((f) => ({
      slug: f.slug,
      sportSlugs: f.sports.map((s) => s.sport.slug),
      city: f.location.city,
      updatedAt: f.updatedAt,
    }));
  } catch {
    facilities = MOCK_FACILITIES.map((f) => ({
      slug: f.slug,
      sportSlugs: f.sports.map((s) => s.sport.slug),
      city: f.location.city,
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

  // City listing pages — distinct cities per sport
  const cityBySport = new Map<string, Set<string>>();
  for (const facility of facilities) {
    for (const sportSlug of facility.sportSlugs) {
      if (!cityBySport.has(sportSlug)) cityBySport.set(sportSlug, new Set());
      cityBySport.get(sportSlug)!.add(facility.city);
    }
  }
  for (const [sportSlug, cities] of cityBySport) {
    for (const city of cities) {
      entries.push({
        url: `${BASE_URL}/sport/${sportSlug}?city=${encodeURIComponent(city)}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}

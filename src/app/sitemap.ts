import type { MetadataRoute } from "next";
import { SPORTS } from "@/lib/sports";
import { prisma } from "@/lib/prisma";
import exportData from "@/data/facilities-export.json";
import { cityToSlug, REGIONS } from "@/lib/regions";
import { getAllPosts, CATEGORIES } from "@/lib/blog";
import { getGuideDefinitions } from "@/lib/guides";

const BASE_URL = "https://www.hraju.cz";
const VISIBLE_SPORT_SLUGS: Set<string> = new Set(SPORTS.map((s) => s.slug));

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
      sportSlugs: f.sports.map((s) => s.sport.slug).filter((s) => VISIBLE_SPORT_SLUGS.has(s)),
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
      if (!sport || !VISIBLE_SPORT_SLUGS.has(sport.slug)) continue;
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

  // Remove facilities with no visible sports
  facilities = facilities.filter((f) => f.sportSlugs.length > 0);

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

  // Region pages: /sport/{sport}/kraj/{region}
  for (const sport of SPORTS) {
    for (const region of REGIONS) {
      entries.push({
        url: `${BASE_URL}/sport/${sport.slug}/kraj/${region.slug}`,
        lastModified: sportLastmod.get(sport.slug),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
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
    url: `${BASE_URL}/akce`,
    changeFrequency: "weekly",
    priority: 0.7,
  });
  entries.push({
    url: `${BASE_URL}/recenze`,
    changeFrequency: "weekly",
    priority: 0.7,
  });
  entries.push({
    url: `${BASE_URL}/komunita`,
    changeFrequency: "daily",
    priority: 0.7,
  });
  // SIL-656 — weekly-curated "best conditions" list (ferraty + lezení).
  entries.push({
    url: `${BASE_URL}/nejlepsi-podminky`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  });
  entries.push({
    url: `${BASE_URL}/vybaveni`,
    changeFrequency: "weekly",
    priority: 0.6,
  });
  entries.push({
    url: `${BASE_URL}/odkazy`,
    changeFrequency: "monthly",
    priority: 0.5,
  });
  entries.push({
    url: `${BASE_URL}/o-nas`,
    changeFrequency: "monthly",
    priority: 0.6,
  });
  entries.push({
    url: `${BASE_URL}/kontakt`,
    changeFrequency: "monthly",
    priority: 0.6,
  });
  entries.push({
    url: `${BASE_URL}/podminky-pouziti`,
    changeFrequency: "monthly",
    priority: 0.4,
  });
  entries.push({
    url: `${BASE_URL}/ochrana-osobnich-udaju`,
    changeFrequency: "monthly",
    priority: 0.4,
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

  // Blog pages
  const blogPosts = getAllPosts();
  if (blogPosts.length > 0) {
    entries.push({
      url: `${BASE_URL}/blog`,
      lastModified: new Date(blogPosts[0].date),
      changeFrequency: "weekly",
      priority: 0.7,
    });
    for (const post of blogPosts) {
      entries.push({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    // Category pages
    for (const category of Object.keys(CATEGORIES)) {
      entries.push({
        url: `${BASE_URL}/blog/kategorie/${category}`,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
    // Sport-filtered blog pages
    for (const sport of SPORTS) {
      entries.push({
        url: `${BASE_URL}/blog/sport/${sport.slug}`,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }

  // Guide pages: /pruvodce/[sport] index + /pruvodce/[sport]/[slug]
  for (const sport of SPORTS) {
    entries.push({
      url: `${BASE_URL}/pruvodce/${sport.slug}`,
      lastModified: sportLastmod.get(sport.slug),
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (const guide of getGuideDefinitions(sport.slug)) {
      entries.push({
        url: `${BASE_URL}/pruvodce/${sport.slug}/${guide.slug}`,
        lastModified: sportLastmod.get(sport.slug),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  // Product catalog pages
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    for (const p of products) {
      entries.push({
        url: `${BASE_URL}/vybaveni/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  } catch {
    // DB unavailable
  }

  return entries;
}

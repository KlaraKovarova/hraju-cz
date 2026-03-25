#!/usr/bin/env tsx
/**
 * Find ferraty facilities with missing GPS coordinates and geocode them
 * using Nominatim, then update the Neon PostgreSQL database directly.
 *
 * Usage: npx tsx scripts/geocode-ferraty-gps.ts
 *   --dry-run   Show what would be updated without writing to DB
 */
import * as dotenv from "dotenv";
dotenv.config();

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connStr) throw new Error("DATABASE_URL / DIRECT_URL not set");
console.log("Connecting to:", connStr.replace(/:[^:@]+@/, ":***@"));

const adapter = new PrismaNeon({ connectionString: connStr });
const prisma = new PrismaClient({ adapter });

const USER_AGENT = "hraju.cz-geocoder/1.0 (https://www.hraju.cz)";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const RATE_LIMIT_MS = 1200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Strip Czech neighborhood suffixes and clean city names */
function cleanCity(city: string): string {
  let cleaned = city.replace(/\s*ev\.?\s*č\.?.*$/i, "").trim();
  cleaned = cleaned.replace(/\s+[IVX]+-[\w\-áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ\s]+$/u, "").trim();
  cleaned = cleaned.replace(/\s+[IVX]+[-–]\S+$/u, "").trim();
  return cleaned;
}

async function geocodeAddress(
  name: string,
  address: string,
  city: string,
  region: string | null
): Promise<{ lat: number; lng: number; displayName: string; confidence: string } | null> {
  const cleanedCity = cleanCity(city);

  // For ferraty (via ferrata), the "address" is often the rock face or trail name,
  // not a street address. Use location-based queries primarily.
  const queries = [
    `${name}, ${cleanedCity}, Czech Republic`,
    `${name}, ${region || ""}, Czech Republic`.trim(),
    `${address}, ${cleanedCity}, Czech Republic`,
    `${cleanedCity}, Czech Republic`,
  ];

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    const params = new URLSearchParams({
      q: query,
      format: "json",
      countrycodes: "cz",
      limit: "1",
      addressdetails: "1",
    });

    try {
      const response = await fetch(`${NOMINATIM_URL}?${params}`, {
        headers: { "User-Agent": USER_AGENT },
      });

      if (response.status === 429) {
        console.error(`  Rate limited, waiting 5s...`);
        await sleep(5000);
        i--;
        continue;
      }

      if (!response.ok) {
        console.error(`  HTTP ${response.status} for query: ${query}`);
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      const results = (await response.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;

      if (results.length > 0) {
        const confidence = i <= 1 ? "high" : i === 2 ? "medium" : "low";
        return {
          lat: parseFloat(results[0].lat),
          lng: parseFloat(results[0].lon),
          displayName: results[0].display_name,
          confidence,
        };
      }
    } catch (err) {
      console.error(`  Error for query "${query}":`, err);
    }

    await sleep(RATE_LIMIT_MS);
  }

  return null;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) console.log("DRY RUN — no DB updates will be made\n");

  // Find ferraty sport
  const ferratySport = await prisma.sport.findFirst({ where: { slug: "ferraty" } });
  if (!ferratySport) {
    console.error("Ferraty sport not found!");
    return;
  }

  // Get all active ferraty facilities
  const ferraty = await prisma.facility.findMany({
    where: {
      isActive: true,
      sports: { some: { sportId: ferratySport.id } },
    },
    include: { location: true },
    orderBy: { name: "asc" },
  });

  console.log(`Total ferraty facilities: ${ferraty.length}`);

  const missing = ferraty.filter(
    (f) => f.lat === null || f.lng === null || f.lat === 0 || f.lng === 0
  );

  if (missing.length === 0) {
    console.log("All ferraty facilities have GPS coordinates!");
    return;
  }

  console.log(`Facilities missing coordinates: ${missing.length}\n`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < missing.length; i++) {
    const f = missing[i];
    const city = f.location.city;
    const region = f.location.region;

    process.stdout.write(
      `[${i + 1}/${missing.length}] ${f.name} (${city})... `
    );

    const result = await geocodeAddress(f.name, f.address, city, region);

    if (result) {
      console.log(`${result.confidence} → ${result.lat}, ${result.lng}`);
      console.log(`    (${result.displayName})`);

      if (!dryRun) {
        await prisma.facility.update({
          where: { id: f.id },
          data: { lat: result.lat, lng: result.lng },
        });
        console.log(`    ✓ DB updated`);
      }
      updated++;
    } else {
      console.log("✗ not found");
      failed++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Geocoded: ${updated}`);
  console.log(`Failed: ${failed}`);
  if (dryRun) console.log("(dry run — no DB changes made)");

  // Show final state
  console.log(`\nAll ferraty facilities GPS status:`);
  const allFinal = await prisma.facility.findMany({
    where: {
      isActive: true,
      sports: { some: { sportId: ferratySport.id } },
    },
    include: { location: true },
    orderBy: { name: "asc" },
  });

  for (const f of allFinal) {
    const status = f.lat !== null && f.lng !== null ? "✓" : "✗";
    console.log(`  ${status} ${f.name}: ${f.lat ?? "null"}, ${f.lng ?? "null"} (${f.location.city})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

#!/usr/bin/env tsx
/**
 * Sync lat/lng coordinates from Neon DB → facilities-export.json
 *
 * The static JSON export is used by map components and listing pages.
 * After enriching GPS data in the DB, run this script to update the export.
 *
 * Usage: npx tsx scripts/sync-gps-to-export.ts
 */
import * as dotenv from "dotenv";
dotenv.config();

import { join } from "path";
import { readFileSync, writeFileSync } from "fs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const EXPORT_PATH = join(__dirname, "..", "src", "data", "facilities-export.json");

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connStr) throw new Error("DATABASE_URL / DIRECT_URL not set");
console.log("Connecting to:", connStr.replace(/:[^:@]+@/, ":***@"));

const adapter = new PrismaNeon({ connectionString: connStr });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Loading facilities-export.json...");
  const data = JSON.parse(readFileSync(EXPORT_PATH, "utf-8"));

  // Get lat/lng for all facilities from DB
  const dbFacilities = await prisma.facility.findMany({
    select: { id: true, lat: true, lng: true },
  });

  const dbGpsMap = new Map(dbFacilities.map((f) => [f.id, { lat: f.lat, lng: f.lng }]));

  let updated = 0;
  let alreadyCurrent = 0;
  let notInDb = 0;

  for (const f of data.facilities) {
    const dbGps = dbGpsMap.get(f.id);
    if (!dbGps) {
      notInDb++;
      continue;
    }

    // Update if DB has coordinates and export doesn't, or if they differ
    const needsUpdate =
      (dbGps.lat !== null && dbGps.lng !== null) &&
      (f.lat !== dbGps.lat || f.lng !== dbGps.lng);

    if (needsUpdate) {
      console.log(`  Updated: ${f.name} — (${f.lat}, ${f.lng}) → (${dbGps.lat}, ${dbGps.lng})`);
      f.lat = dbGps.lat;
      f.lng = dbGps.lng;
      updated++;
    } else {
      alreadyCurrent++;
    }
  }

  console.log(`\nSummary: ${updated} updated, ${alreadyCurrent} already current, ${notInDb} not in DB`);

  if (updated > 0) {
    data.exportedAt = new Date().toISOString();
    writeFileSync(EXPORT_PATH, JSON.stringify(data, null, 2) + "\n");
    console.log("Updated facilities-export.json");
  } else {
    console.log("No changes needed.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

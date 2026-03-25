/**
 * Sync isActive + lat/lng + facilitySports from Neon DB → facilities-export.json
 *
 * After deactivating facilities, enriching GPS data, or re-categorizing sports
 * in the database, the static JSON export (used by most listing pages) becomes stale.
 * This script updates isActive flags, GPS coordinates, and the facilitySports array.
 */

import * as dotenv from "dotenv";
dotenv.config();

import { join } from "path";
import { readFileSync, writeFileSync } from "fs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const EXPORT_PATH = join(
  __dirname,
  "..",
  "src",
  "data",
  "facilities-export.json"
);

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Loading facilities-export.json...");
  const data = JSON.parse(readFileSync(EXPORT_PATH, "utf-8"));

  // Get isActive + lat/lng for ALL facilities from DB
  const dbFacilities = await prisma.facility.findMany({
    select: { id: true, isActive: true, lat: true, lng: true },
  });

  const dbMap = new Map(dbFacilities.map((f) => [f.id, f]));

  let synced = 0;
  let activated = 0;
  let deactivated = 0;
  let gpsUpdated = 0;

  for (const f of data.facilities) {
    const db = dbMap.get(f.id);
    if (db === undefined) continue; // facility not in DB

    if (f.isActive !== db.isActive) {
      synced++;
      if (db.isActive) {
        activated++;
      } else {
        deactivated++;
      }
      f.isActive = db.isActive;
    }

    // Sync GPS coordinates if DB has them and export differs
    if (db.lat !== null && db.lng !== null && (f.lat !== db.lat || f.lng !== db.lng)) {
      f.lat = db.lat;
      f.lng = db.lng;
      gpsUpdated++;
    }
  }

  if (synced > 0) {
    console.log(`Synced ${synced} facilities (isActive):`);
    console.log(`  ${deactivated} deactivated (true → false)`);
    console.log(`  ${activated} activated (false → true)`);
  } else {
    console.log("isActive: no changes needed.");
  }

  if (gpsUpdated > 0) {
    console.log(`\nSynced ${gpsUpdated} facilities (lat/lng)`);
  } else {
    console.log("\nlat/lng: no changes needed.");
  }

  // --- Sync facilitySports ---
  console.log("\nSyncing facilitySports...");
  const dbFacilitySports = await prisma.facilitySport.findMany({
    select: { facilityId: true, sportId: true },
    orderBy: [{ facilityId: "asc" }, { sportId: "asc" }],
  });

  const oldCount = data.facilitySports.length;
  const newCount = dbFacilitySports.length;
  data.facilitySports = dbFacilitySports;
  console.log(`facilitySports: ${oldCount} → ${newCount} (delta: ${newCount - oldCount})`);

  const changed = synced > 0 || gpsUpdated > 0 || oldCount !== newCount ||
    JSON.stringify(data.facilitySports) !== JSON.stringify(dbFacilitySports);

  if (!changed) {
    console.log("\nNo changes needed — JSON already in sync with DB.");
    return;
  }

  data.exportedAt = new Date().toISOString();
  writeFileSync(EXPORT_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log("\nUpdated facilities-export.json");
}

main().then(() => prisma.$disconnect());

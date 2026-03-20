/**
 * Sync isActive field from Neon DB → facilities-export.json
 *
 * After deactivating facilities in the database, the static JSON export
 * (used by most listing pages) becomes stale. This script updates it.
 */

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

  // Get isActive state for ALL facilities from DB
  const dbFacilities = await prisma.facility.findMany({
    select: { id: true, isActive: true },
  });

  const dbActiveMap = new Map(dbFacilities.map((f) => [f.id, f.isActive]));

  let synced = 0;
  let activated = 0;
  let deactivated = 0;

  for (const f of data.facilities) {
    const dbActive = dbActiveMap.get(f.id);
    if (dbActive === undefined) continue; // facility not in DB

    if (f.isActive !== dbActive) {
      synced++;
      if (dbActive) {
        activated++;
      } else {
        deactivated++;
      }
      f.isActive = dbActive;
    }
  }

  if (synced === 0) {
    console.log("No changes needed — JSON already in sync with DB.");
    return;
  }

  console.log(`Synced ${synced} facilities:`);
  console.log(`  ${deactivated} deactivated (true → false)`);
  console.log(`  ${activated} activated (false → true)`);

  writeFileSync(EXPORT_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log("Updated facilities-export.json");
}

main().then(() => prisma.$disconnect());

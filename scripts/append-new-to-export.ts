/**
 * Append newly created facilities (not yet in export JSON) to facilities-export.json
 * Run: npx tsx scripts/append-new-to-export.ts
 */
import { join } from "path";
import { readFileSync, writeFileSync } from "fs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const EXPORT_PATH = join(__dirname, "..", "src", "data", "facilities-export.json");

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const data = JSON.parse(readFileSync(EXPORT_PATH, "utf-8"));
  const existingIds = new Set(data.facilities.map((f: { id: string }) => f.id));
  const existingLocIds = new Set(data.locations.map((l: { id: string }) => l.id));

  // Get all active facilities from DB
  const dbFacilities = await prisma.facility.findMany({
    where: { isActive: true },
    select: {
      id: true, slug: true, name: true, description: true,
      address: true, postalCode: true, locationId: true,
      lat: true, lng: true, courtsLanes: true, pricing: true,
      openingHours: true, website: true, isActive: true,
      isClaimed: true, isPremium: true,
    },
  });

  const newFacilities = dbFacilities.filter((f) => !existingIds.has(f.id));
  if (newFacilities.length === 0) {
    console.log("No new facilities to add.");
    return;
  }

  console.log(`Found ${newFacilities.length} new facilities to add.`);

  // Get locations for new facilities
  const newLocIds = [...new Set(newFacilities.map((f) => f.locationId))].filter(
    (id) => !existingLocIds.has(id)
  );
  if (newLocIds.length > 0) {
    const newLocations = await prisma.location.findMany({
      where: { id: { in: newLocIds } },
      select: { id: true, city: true, region: true, country: true, lat: true, lng: true },
    });
    data.locations.push(...newLocations);
    console.log(`Added ${newLocations.length} new locations.`);
  }

  // Add facilities
  data.facilities.push(
    ...newFacilities.map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      description: f.description,
      address: f.address,
      postalCode: f.postalCode,
      locationId: f.locationId,
      lat: f.lat,
      lng: f.lng,
      courtsLanes: f.courtsLanes,
      pricing: f.pricing,
      openingHours: f.openingHours,
      website: f.website,
      isActive: f.isActive,
      isClaimed: f.isClaimed,
      isPremium: f.isPremium,
    }))
  );

  // Get facilitySports for new facilities
  const newFS = await prisma.facilitySport.findMany({
    where: { facilityId: { in: newFacilities.map((f) => f.id) } },
    select: { facilityId: true, sportId: true },
  });
  data.facilitySports.push(...newFS);
  console.log(`Added ${newFS.length} facilitySport links.`);

  // Get contacts for new facilities
  const newContacts = await prisma.contact.findMany({
    where: { facilityId: { in: newFacilities.map((f) => f.id) } },
    select: {
      id: true, facilityId: true, type: true, value: true,
      label: true, isPrimary: true,
    },
  });
  data.contacts.push(...newContacts);
  console.log(`Added ${newContacts.length} contacts.`);

  data.exportedAt = new Date().toISOString();
  writeFileSync(EXPORT_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log(`\nUpdated ${EXPORT_PATH}`);
  console.log(`Total facilities: ${data.facilities.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

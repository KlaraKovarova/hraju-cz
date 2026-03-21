/**
 * Append newly-added DB facilities to facilities-export.json
 * Usage: npx tsx scripts/append-new-facilities-to-export.ts <slug1> <slug2> ...
 * SIL-384
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
  const slugs = process.argv.slice(2);
  if (!slugs.length) {
    console.error("Usage: npx tsx scripts/append-new-facilities-to-export.ts <slug1> <slug2> ...");
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(EXPORT_PATH, "utf-8"));
  const existingSlugs = new Set(data.facilities.map((f: { slug: string }) => f.slug));
  const existingLocationIds = new Set(data.locations.map((l: { id: string }) => l.id));

  for (const slug of slugs) {
    if (existingSlugs.has(slug)) {
      console.log(`SKIP: ${slug} already in export`);
      continue;
    }

    const facility = await prisma.facility.findUnique({
      where: { slug },
      include: {
        location: true,
        sports: { select: { facilityId: true, sportId: true } },
        contacts: {
          select: { id: true, facilityId: true, type: true, value: true, label: true, isPrimary: true },
        },
      },
    });

    if (!facility) {
      console.error(`NOT FOUND: ${slug}`);
      continue;
    }

    // Add location if new
    if (!existingLocationIds.has(facility.locationId)) {
      data.locations.push({
        id: facility.location.id,
        city: facility.location.city,
        region: facility.location.region,
        country: facility.location.country,
      });
      existingLocationIds.add(facility.locationId);
      console.log(`  Added location: ${facility.location.city}`);
    }

    // Add facility
    data.facilities.push({
      id: facility.id,
      slug: facility.slug,
      name: facility.name,
      description: facility.description,
      address: facility.address,
      postalCode: facility.postalCode,
      locationId: facility.locationId,
      lat: facility.lat,
      lng: facility.lng,
      courtsLanes: facility.courtsLanes,
      pricing: facility.pricing,
      openingHours: facility.openingHours,
      website: facility.website,
      isActive: facility.isActive,
      isClaimed: facility.isClaimed,
      isPremium: facility.isPremium,
    });

    // Add facilitySports
    for (const fs of facility.sports) {
      data.facilitySports.push({ facilityId: fs.facilityId, sportId: fs.sportId });
    }

    // Add contacts
    for (const c of facility.contacts) {
      data.contacts.push({
        id: c.id,
        facilityId: c.facilityId,
        type: c.type,
        value: c.value,
        label: c.label,
        isPrimary: c.isPrimary,
      });
    }

    console.log(`ADDED: ${facility.name} (${facility.id})`);
  }

  data.exportedAt = new Date().toISOString();
  writeFileSync(EXPORT_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log(`\nExport updated: ${data.facilities.length} facilities, ${data.contacts.length} contacts`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

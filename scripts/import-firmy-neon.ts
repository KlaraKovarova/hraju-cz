/**
 * firmy.cz → Neon PostgreSQL import script
 * Reads scripts/data/firmy-{sport}.json and imports facilities into Neon DB.
 * Run: npx tsx scripts/import-firmy-neon.ts [sport1 sport2 ...]
 */

import * as dotenv from "dotenv";
dotenv.config();

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connStr) throw new Error("DATABASE_URL / DIRECT_URL not set");

const adapter = new PrismaNeon({ connectionString: connStr });
const prisma = new PrismaClient({ adapter });

const CITY_TO_REGION: Record<string, string> = {
  Praha: "Praha",
  Brno: "Jihomoravský kraj",
  Ostrava: "Moravskoslezský kraj",
  Plzeň: "Plzeňský kraj",
  Liberec: "Liberecký kraj",
  Olomouc: "Olomoucký kraj",
  "Hradec Králové": "Královéhradecký kraj",
  Pardubice: "Pardubický kraj",
  "České Budějovice": "Jihočeský kraj",
  "Ústí nad Labem": "Ústecký kraj",
  Zlín: "Zlínský kraj",
  Jihlava: "Kraj Vysočina",
  "Karlovy Vary": "Karlovarský kraj",
};

function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ð/g, "d")
    .replace(/ø/g, "o")
    .replace(/þ/g, "th");
}

function generateSlug(name: string): string {
  return removeDiacritics(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 200);
}

interface FacilityData {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  website: string;
  description: string;
  sport: string;
}

async function importSport(
  facilities: FacilityData[],
  sportRecord: { id: string; slug: string },
  slugSet: Set<string>,
): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  for (const f of facilities) {
    let baseSlug = generateSlug(f.name) || `facility-${Date.now()}`;
    let slug = baseSlug;
    let counter = 2;
    while (slugSet.has(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const existing = await prisma.facility.findUnique({ where: { slug } });
    if (existing) {
      skipped++;
      slugSet.add(slug);
      const hasLink = await prisma.facilitySport.findUnique({
        where: {
          facilityId_sportId: {
            facilityId: existing.id,
            sportId: sportRecord.id,
          },
        },
      });
      if (!hasLink) {
        await prisma.facilitySport.create({
          data: { facilityId: existing.id, sportId: sportRecord.id },
        });
      }
      continue;
    }

    slugSet.add(slug);

    const city = f.city || f.address.split(",").pop()?.trim() || "Neznámé";
    const region = CITY_TO_REGION[city] ?? null;

    let location = await prisma.location.findFirst({
      where: { city, region: region ?? null },
    });
    if (!location) {
      location = await prisma.location.create({
        data: { city, region, country: "CZ" },
      });
    }

    const contacts: Array<{
      type: "PHONE" | "EMAIL" | "WEBSITE";
      value: string;
      label?: string;
      isPrimary: boolean;
    }> = [];
    if (f.phone) {
      contacts.push({
        type: "PHONE",
        value: f.phone,
        label: "Recepce",
        isPrimary: true,
      });
    }
    if (f.website) {
      contacts.push({
        type: "WEBSITE",
        value: f.website,
        isPrimary: !f.phone,
      });
    }

    await prisma.facility.create({
      data: {
        name: f.name,
        slug,
        description: f.description || null,
        address: f.address,
        postalCode: f.postalCode || null,
        locationId: location.id,
        website: f.website || null,
        sports: { create: [{ sportId: sportRecord.id }] },
        contacts: contacts.length > 0 ? { create: contacts } : undefined,
      },
    });

    imported++;
    if (imported % 50 === 0) {
      console.log(`    ... ${imported} imported so far`);
    }
  }

  return { imported, skipped };
}

async function main() {
  const DATA_DIR = path.join(__dirname, "data");
  const ALL_SPORTS = [
    "squash",
    "plavani",
    "fitness",
    "bowling",
    "stolni-tenis",
    "florbal",
  ];

  // Filter by CLI args if provided
  const filterSlugs = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const sportsToImport =
    filterSlugs.length > 0
      ? ALL_SPORTS.filter((s) => filterSlugs.includes(s))
      : ALL_SPORTS;

  console.log("hraju.cz — importing firmy.cz data into Neon PostgreSQL");
  console.log("DB:", connStr!.replace(/:([^:@]+)@/, ":***@"));
  console.log("Sports:", sportsToImport.join(", "));

  const sportRecords = await prisma.sport.findMany();
  const sportMap = new Map(sportRecords.map((s) => [s.slug, s]));

  const existingSlugs = await prisma.facility.findMany({
    select: { slug: true },
  });
  const slugSet = new Set(existingSlugs.map((f) => f.slug));

  const totals: Record<string, { imported: number; skipped: number }> = {};

  for (const sportSlug of sportsToImport) {
    const jsonPath = path.join(DATA_DIR, `firmy-${sportSlug}.json`);
    if (!fs.existsSync(jsonPath)) {
      console.log(`\n[${sportSlug}] File not found: ${jsonPath}, skipping.`);
      continue;
    }

    const sport = sportMap.get(sportSlug);
    if (!sport) {
      console.log(
        `\n[${sportSlug}] Sport not found in DB — run seed first!`,
      );
      continue;
    }

    const data: FacilityData[] = JSON.parse(
      fs.readFileSync(jsonPath, "utf-8"),
    );
    console.log(`\n[${sportSlug}] Importing ${data.length} facilities...`);

    const result = await importSport(data, sport, slugSet);
    totals[sportSlug] = result;
    console.log(
      `  ✓ imported: ${result.imported}, skipped: ${result.skipped}`,
    );
  }

  console.log("\n=== SUMMARY ===");
  let totalImported = 0;
  let totalSkipped = 0;
  for (const [sport, { imported, skipped }] of Object.entries(totals)) {
    console.log(`  ${sport}: ${imported} imported, ${skipped} skipped`);
    totalImported += imported;
    totalSkipped += skipped;
  }
  console.log(`  TOTAL: ${totalImported} imported, ${totalSkipped} skipped`);
}

main()
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Add missing lezení facilities that are referenced in blog posts but missing from DB.
 * Also activate Mammut (already in DB but isActive=false).
 *
 * Usage: npx tsx scripts/add-missing-lezeni.ts
 */
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connStr) throw new Error("DATABASE_URL / DIRECT_URL not set");
console.log("Connecting to:", connStr.replace(/:[^:@]+@/, ":***@"));

const adapter = new PrismaNeon({ connectionString: connStr });
const prisma = new PrismaClient({ adapter });

interface NewFacility {
  name: string;
  slug: string;
  description: string;
  address: string;
  postalCode: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  website: string;
  phone?: string;
  email?: string;
}

const newFacilities: NewFacility[] = [
  {
    name: "Basecamp Boulder",
    slug: "basecamp-boulder-brno",
    description:
      "Komunitní boulderovka v centru Brna s nepřetržitým 24/7 přístupem po registraci. 200 m² lezecké plochy, 1 200 chytů a ~20 boulderů s měsíčním přesazováním.",
    address: "Josefská 425/23",
    postalCode: "602 00",
    city: "Brno",
    region: "Jihomoravský kraj",
    lat: 49.1951,
    lng: 16.6068,
    website: "https://basecampboulder.cz/",
    email: "basecampbrno@gmail.com",
  },
  {
    name: "Boulder Point Liberec",
    slug: "boulder-point-liberec",
    description:
      "Jedna z největších boulderovek v Česku — 1 000 m² lezecké plochy, MoonBoard, spray wall, campus boardy. Dětské boulderovací zóny, bistro a prodejna vybavení.",
    address: "Rychtářská 1183/8a",
    postalCode: "460 14",
    city: "Liberec",
    region: "Liberecký kraj",
    lat: 50.7684,
    lng: 15.0627,
    website: "https://www.boulderpoint.cz/",
    phone: "608 708 860",
  },
  {
    name: "V16 Lezecké centrum",
    slug: "v16-lezecke-centrum-plzen",
    description:
      "Premier boulderovka v Plzni. 350 m² lezecké plochy, 110+ boulderů, hlavní stěna, traverse, campus board, 45° tréninková stěna a fitness. Otevřeno denně 8–22.",
    address: "Kollárova 1239/19",
    postalCode: "301 00",
    city: "Plzeň 3",
    region: "Plzeňský kraj",
    lat: 49.7395,
    lng: 13.3715,
    website: "https://www.v16.cz/",
  },
  {
    name: "Hangar Ostrava – Climbing Playground by Adam Ondra",
    slug: "hangar-ostrava-climbing-playground",
    description:
      "Největší boulderovka na Moravě a jedna z největších ve střední Evropě. 1 300 m² boulderové plochy, 200+ boulderů. Dětský pohybový park, fitness, jóga, fyzioterapie, kavárna a prodejna.",
    address: "Nad Porubkou 2405",
    postalCode: "708 00",
    city: "Ostrava",
    region: "Moravskoslezský kraj",
    lat: 49.8284,
    lng: 18.1665,
    website: "https://hangarostrava.cz/",
    phone: "604 787 470",
  },
];

async function main() {
  // Find lezeni sport
  const sport = await prisma.sport.findUnique({ where: { slug: "lezeni" } });
  if (!sport) {
    console.error("Sport 'lezeni' not found. Aborting.");
    process.exit(1);
  }
  console.log(`Found sport: ${sport.nameCs} (${sport.id})\n`);

  // --- Step 1: Activate Mammut ---
  const mammut = await prisma.facility.findUnique({
    where: { slug: "lezecke-centrum-mammut" },
  });
  if (mammut) {
    if (!mammut.isActive) {
      await prisma.facility.update({
        where: { id: mammut.id },
        data: {
          isActive: true,
          isApproved: true,
          description:
            "Lezecké centrum v Bubenské ulici v Holešovicích (metro Vltavská). Kvalitní stěny pro lanové lezení a profesionální kurzy pro začátečníky i pokročilé.",
        },
      });
      console.log("ACTIVATED: Lezecké centrum Mammut (was isActive=false)");
    } else {
      console.log("SKIP: Mammut already active");
    }
  } else {
    console.log("WARNING: Mammut not found in DB — skipping activation");
  }

  // --- Step 2: Create new facilities ---
  for (const f of newFacilities) {
    const existing = await prisma.facility.findUnique({
      where: { slug: f.slug },
    });
    if (existing) {
      console.log(`SKIP: ${f.name} (slug ${f.slug} already exists)`);
      continue;
    }

    // Find or create location
    let location = await prisma.location.findFirst({
      where: { city: f.city, region: f.region },
    });
    if (!location) {
      location = await prisma.location.create({
        data: { city: f.city, region: f.region },
      });
      console.log(`  Created location: ${f.city}, ${f.region}`);
    }

    // Build contacts array
    const contacts: Array<{
      type: "PHONE" | "EMAIL" | "WEBSITE";
      value: string;
      isPrimary?: boolean;
    }> = [{ type: "WEBSITE", value: f.website }];
    if (f.phone) contacts.push({ type: "PHONE", value: f.phone, isPrimary: true });
    if (f.email) contacts.push({ type: "EMAIL", value: f.email });

    const facility = await prisma.facility.create({
      data: {
        name: f.name,
        slug: f.slug,
        description: f.description,
        address: f.address,
        postalCode: f.postalCode,
        locationId: location.id,
        lat: f.lat,
        lng: f.lng,
        website: f.website,
        isActive: true,
        isApproved: true,
        sports: {
          create: { sportId: sport.id },
        },
        contacts: {
          create: contacts,
        },
      },
    });

    console.log(`ADDED: ${f.name} (${facility.id})`);
  }

  console.log("\nDone! Run scripts/sync-export-active.ts next.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

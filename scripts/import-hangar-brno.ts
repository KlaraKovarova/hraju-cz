/**
 * Import Hangar Brno climbing center (Adam Ondra's bouldering playground)
 * Run: npx tsx scripts/import-hangar-brno.ts
 * SIL-385
 */
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const center = {
  name: "Hangar Brno – Climbing playground by Adam Ondra",
  slug: "hangar-brno-climbing-playground",
  address: "Pražákova 1027/53, 619 00 Brno",
  postalCode: "619 00",
  city: "Brno",
  lat: 49.1670,
  lng: 16.6023,
  phone: "+420 608 987 910",
  email: "info@hangarbrno.cz",
  website: "https://hangarbrno.cz/",
  description:
    "Jedna z největších a nejmodernějších boulderových hal v Evropě s 1 000 m² lezecké plochy a více než 200 bouldrovými cestami. Projekt Adama Ondry. Dvě lezecké haly, tréninkové zóny, dětský koutek s lezeckou stěnou, posilovna, café bar a coworking.",
  pricing:
    "Dopolední vstupné (do 15:00): dospělí 210 Kč, studenti 170 Kč, děti/senioři/ZTP 125 Kč. Odpolední a víkendy: dospělí 260 Kč, studenti 205 Kč, děti/senioři/ZTP 125 Kč. Půjčovna lezeček 80 Kč.",
  openingHours: {
    mon: "09:00–22:00",
    tue: "07:00–22:00",
    wed: "07:00–22:00",
    thu: "07:00–22:00",
    fri: "07:00–22:00",
    sat: "09:00–22:00",
    sun: "09:00–22:00",
  },
};

async function main() {
  const sport = await prisma.sport.findUnique({ where: { slug: "lezeni" } });
  if (!sport) {
    console.error("Sport 'lezeni' not found in database.");
    process.exit(1);
  }
  console.log(`Found sport: ${sport.nameCs} (${sport.id})`);

  const existing = await prisma.facility.findUnique({
    where: { slug: center.slug },
  });
  if (existing) {
    console.log(`SKIP: ${center.name} (slug already exists)`);
    return;
  }

  let location = await prisma.location.findFirst({
    where: { city: center.city, region: "Jihomoravský kraj" },
  });
  if (!location) {
    location = await prisma.location.create({
      data: { city: center.city, region: "Jihomoravský kraj" },
    });
    console.log(`  Created location: ${center.city}`);
  }

  const facility = await prisma.facility.create({
    data: {
      name: center.name,
      slug: center.slug,
      description: center.description,
      address: center.address,
      postalCode: center.postalCode,
      locationId: location.id,
      lat: center.lat,
      lng: center.lng,
      website: center.website,
      pricing: center.pricing,
      openingHours: center.openingHours,
      sports: {
        create: { sportId: sport.id },
      },
      contacts: {
        create: [
          { type: "PHONE", value: center.phone, isPrimary: true },
          { type: "EMAIL", value: center.email },
          { type: "WEBSITE", value: center.website },
        ],
      },
    },
  });

  console.log(`ADDED: ${center.name} (${facility.id})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

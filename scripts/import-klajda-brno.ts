/**
 * Import 3 Klajda / Horolezecké centrum Brno climbing centers
 * Run: npx tsx scripts/import-klajda-brno.ts
 * SIL-384
 */
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const centers = [
  {
    name: "Lezecké centrum Klajda",
    slug: "lezecke-centrum-klajda-brno",
    address: "Kulkova 30, 614 00 Brno",
    postalCode: "614 00",
    city: "Brno",
    lat: 49.2276,
    lng: 16.6350,
    phone: "+420 731 843 208",
    email: "info@klajda.cz",
    website: "https://www.klajda.cz/klajda/",
    description:
      "První moderní komerční lezecká stěna v Brně otevřená v roce 2009. Nabízí čtyři automatické jisticí systémy TRUBLUE, půjčovnu vybavení, bar a kurzy lezení pro začátečníky. Otevřeno denně 10:00–22:00.",
    pricing:
      "Vstupné 90–240 Kč dle kategorie (dospělí, studenti, děti, senioři 60+). Depozitní karty 1000–5000 Kč se slevou. Půjčovna: úvazek 30 Kč, jisticí pomůcka 20 Kč, lezečky 70 Kč, lano 70 Kč.",
    openingHours: {
      mon: "10:00–22:00",
      tue: "10:00–22:00",
      wed: "10:00–22:00",
      thu: "10:00–22:00",
      fri: "10:00–22:00",
      sat: "10:00–22:00",
      sun: "10:00–22:00",
    },
  },
  {
    name: "Lezecká stěna Duro Singing Rock",
    slug: "lezecka-stena-duro-singing-rock-brno",
    address: "Slaměníkova 23b, 614 00 Brno",
    postalCode: "614 00",
    city: "Brno",
    lat: 49.2130,
    lng: 16.6220,
    phone: "+420 773 265 603",
    email: "info@klajda.cz",
    website: "https://www.klajda.cz/duro-singing-rock/",
    description:
      "Nejvyšší vnitřní lezecká stěna v České republice s více než 60 lezeckými cestami od 9 do 20 metrů. Obsahuje boulderovací sekci, obchod s lezeckým vybavením, tréninkový prostor POLYGON a bar.",
    pricing:
      "Vstupné 90–240 Kč dle kategorie a doby návštěvy. Depozitní účty se slevami až 14 % na vybavení.",
    openingHours: {
      mon: "14:00–22:00",
      tue: "14:00–22:00",
      wed: "14:00–22:00",
      thu: "14:00–22:00",
      fri: "14:00–22:00",
      sat: "10:00–22:00",
      sun: "10:00–22:00",
    },
  },
  {
    name: "Lezecká stěna Olympia",
    slug: "lezecka-stena-olympia-brno",
    address: "U dálnice 777, 664 42 Brno-Modřice",
    postalCode: "664 42",
    city: "Brno",
    lat: 49.1298,
    lng: 16.6143,
    phone: "+420 731 843 208",
    email: "olympia@klajda.cz",
    website: "https://www.klajda.cz/olympia/",
    description:
      "Největší betonová lezecká stěna ve střední Evropě otevřená v roce 2010. Sezónní venkovní provoz (květen–září). Lezecké cesty od 10 do 18 metrů výšky se čtyřmi automatickými jisticími systémy TRUBLUE.",
    pricing:
      "Dospělí 160–240 Kč, studenti 130–180 Kč, děti 110 Kč, senioři/ZTP 90–115 Kč. Půjčovna vybavení 20–70 Kč/kus.",
    openingHours: {
      note: "Sezónní provoz květen–září",
      mon: "10:00–20:00",
      tue: "10:00–20:00",
      wed: "10:00–20:00",
      thu: "10:00–20:00",
      fri: "10:00–20:00",
      sat: "10:00–20:00",
      sun: "10:00–20:00",
    },
  },
];

async function main() {
  const sport = await prisma.sport.findUnique({ where: { slug: "lezeni" } });
  if (!sport) {
    console.error("Sport 'lezeni' not found in database.");
    process.exit(1);
  }
  console.log(`Found sport: ${sport.nameCs} (${sport.id})`);

  for (const c of centers) {
    const existing = await prisma.facility.findUnique({
      where: { slug: c.slug },
    });
    if (existing) {
      console.log(`SKIP: ${c.name} (slug already exists)`);
      continue;
    }

    let location = await prisma.location.findFirst({
      where: { city: c.city, region: "Jihomoravský kraj" },
    });
    if (!location) {
      location = await prisma.location.create({
        data: { city: c.city, region: "Jihomoravský kraj" },
      });
      console.log(`  Created location: ${c.city}`);
    }

    const facility = await prisma.facility.create({
      data: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        address: c.address,
        postalCode: c.postalCode,
        locationId: location.id,
        lat: c.lat,
        lng: c.lng,
        website: c.website,
        pricing: c.pricing,
        openingHours: c.openingHours,
        sports: {
          create: { sportId: sport.id },
        },
        contacts: {
          create: [
            { type: "PHONE", value: c.phone, isPrimary: true },
            { type: "EMAIL", value: c.email },
            { type: "WEBSITE", value: c.website },
          ],
        },
      },
    });

    console.log(`ADDED: ${c.name} (${facility.id})`);
  }

  console.log("\nDone! 3 Klajda climbing centers added to Brno.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

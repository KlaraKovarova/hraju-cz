/**
 * Import Prague climbing centers from HoroAkademie data
 * Run: npx tsx scripts/import-lezeni-praha.ts
 */
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const centers = [
  {
    name: "Lezecké centrum SmíchOFF",
    slug: "lezecke-centrum-smichoff",
    address: "Křížová 1018/6",
    postalCode: "150 00",
    city: "Praha 5",
    lat: 50.0697,
    lng: 14.4028,
    phone: "604 240 887",
    email: "info@lezeckecentrum.cz",
    website: "https://www.lezeckecentrum.cz",
  },
  {
    name: "Lezecká stěna Ruzyně",
    slug: "lezecka-stena-ruzyne",
    address: "Ztracená 1132/1",
    postalCode: "160 00",
    city: "Praha 6",
    lat: 50.0853,
    lng: 14.3272,
    phone: "608 983 181",
    email: "stena@stena-ruzyne.com",
    website: "https://www.stena-ruzyne.com",
  },
  {
    name: "Jam Jam Boulderovka",
    slug: "jam-jam-boulderovka",
    address: "Vlastina 889",
    postalCode: "161 00",
    city: "Praha 6",
    lat: 50.0838,
    lng: 14.3353,
    phone: "602 652 499",
    email: "info@jamjam.cz",
    website: "https://jamjam.cz",
  },
  {
    name: "HUDY Boulder Karlín",
    slug: "hudy-boulder-karlin",
    address: "Křižíkova 684",
    postalCode: "186 00",
    city: "Praha 8",
    lat: 50.0920,
    lng: 14.4500,
    phone: "220 920 029",
    email: "info@hudysteny.cz",
    website: "https://hudysteny.cz/boulderkarlin",
  },
  {
    name: "Lezecká stěna Třináctka",
    slug: "lezecka-stena-trinactka",
    address: "Jeremiášova 2581/2",
    postalCode: "155 00",
    city: "Praha 5",
    lat: 50.0474,
    lng: 14.3234,
    phone: "731 654 474",
    email: "info@tr13.cz",
    website: "https://tr13.cz",
  },
  {
    name: "Sport Centrum Evropská",
    slug: "sport-centrum-evropska",
    address: "José Martího 269/31",
    postalCode: "162 52",
    city: "Praha 6",
    lat: 50.0847,
    lng: 14.3558,
    phone: "220 172 310",
    email: "sce@sportcentrumevropska.cz",
    website: "https://www.sportcentrumevropska.cz",
  },
  {
    name: "Lezecká stěna Big Wall",
    slug: "lezecka-stena-big-wall",
    address: "Ocelářská 891/16",
    postalCode: "190 00",
    city: "Praha 9",
    lat: 50.1031,
    lng: 14.4703,
    phone: "730 510 129",
    email: "info@big-wall.cz",
    website: "https://www.big-wall.cz",
  },
  {
    name: "Lezecké centrum Mammut",
    slug: "lezecke-centrum-mammut",
    address: "Bubenská 1536/43",
    postalCode: "170 00",
    city: "Praha 7",
    lat: 50.1028,
    lng: 14.4329,
    phone: "233 371 481",
    email: "info@stenaholesovice.cz",
    website: "https://stenaholesovice.cz",
  },
  {
    name: "Lezecká stěna Free Solo",
    slug: "lezecka-stena-free-solo",
    address: "Donovalská 1662",
    postalCode: "149 00",
    city: "Praha 4",
    lat: 50.0309,
    lng: 14.4905,
    phone: "272 142 220",
    email: "info@freesolo.cz",
    website: "https://freesolo.cz",
  },
  {
    name: "JUNGLE Sport Park",
    slug: "jungle-sport-park-letnany",
    address: "Veselská 699",
    postalCode: "199 00",
    city: "Praha 9",
    lat: 50.1296,
    lng: 14.5143,
    phone: "771 166 465",
    email: "info@jungle.cz",
    website: "https://www.jungle.cz/letnany/",
  },
];

async function main() {
  // Find lezeni sport
  const sport = await prisma.sport.findUnique({ where: { slug: "lezeni" } });
  if (!sport) {
    console.error("Sport 'lezeni' not found in database. Run seed first.");
    process.exit(1);
  }
  console.log(`Found sport: ${sport.nameCs} (${sport.id})`);

  for (const c of centers) {
    // Check if already exists
    const existing = await prisma.facility.findUnique({ where: { slug: c.slug } });
    if (existing) {
      console.log(`SKIP: ${c.name} (slug already exists)`);
      continue;
    }

    // Find or create location
    let location = await prisma.location.findFirst({
      where: { city: c.city, region: "Hlavní město Praha" },
    });
    if (!location) {
      location = await prisma.location.create({
        data: { city: c.city, region: "Hlavní město Praha" },
      });
      console.log(`  Created location: ${c.city}`);
    }

    // Create facility
    const facility = await prisma.facility.create({
      data: {
        name: c.name,
        slug: c.slug,
        address: c.address,
        postalCode: c.postalCode,
        locationId: location.id,
        lat: c.lat,
        lng: c.lng,
        website: c.website,
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

  console.log("\nDone! Re-export static JSON next.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

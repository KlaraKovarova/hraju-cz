import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString: connStr! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding hraju.cz database...");

  // Sports
  const sports = await Promise.all([
    prisma.sport.upsert({
      where: { slug: "squash" },
      update: {},
      create: {
        slug: "squash",
        name: "Squash",
        nameCs: "Squash",
        subdomain: "squash",
        description: "Squashové kurty v České republice",
        icon: "🏸",
      },
    }),
    prisma.sport.upsert({
      where: { slug: "plavani" },
      update: {},
      create: {
        slug: "plavani",
        name: "Swimming",
        nameCs: "Plavání",
        subdomain: "plavani",
        description: "Plavecké bazény v České republice",
        icon: "🏊",
      },
    }),
    prisma.sport.upsert({
      where: { slug: "fitness" },
      update: {},
      create: {
        slug: "fitness",
        name: "Fitness",
        nameCs: "Fitness",
        subdomain: "fitness",
        description: "Fitness centra, posilovny, CrossFit boxy",
        icon: "🏋️",
      },
    }),
    prisma.sport.upsert({
      where: { slug: "bowling" },
      update: {},
      create: {
        slug: "bowling",
        name: "Bowling",
        nameCs: "Bowling",
        subdomain: "bowling",
        description: "Bowlingové dráhy a centra",
        icon: "🎳",
      },
    }),
    prisma.sport.upsert({
      where: { slug: "stolni-tenis" },
      update: {},
      create: {
        slug: "stolni-tenis",
        name: "Table Tennis",
        nameCs: "Stolní tenis",
        subdomain: "stolni-tenis",
        description: "Stolní tenis — pingpong herny a kluby v ČR",
        icon: "🏓",
      },
    }),
    prisma.sport.upsert({
      where: { slug: "florbal" },
      update: {},
      create: {
        slug: "florbal",
        name: "Floorball",
        nameCs: "Florbal",
        subdomain: "florbal",
        description: "Florbalové haly a sportovní centra v ČR",
        icon: "🏑",
      },
    }),
    prisma.sport.upsert({
      where: { slug: "lezeni" },
      update: {},
      create: {
        slug: "lezeni",
        name: "Climbing",
        nameCs: "Lezení",
        subdomain: "lezeni",
        description: "Lezecká centra, bouldery a lezecké stěny v ČR",
        icon: "🧗",
      },
    }),
    prisma.sport.upsert({
      where: { slug: "ferraty" },
      update: {},
      create: {
        slug: "ferraty",
        name: "Via Ferrata",
        nameCs: "Ferraty",
        subdomain: "ferraty",
        description: "Ferraty a zajištěné cesty v České republice",
        icon: "⛰️",
      },
    }),
  ]);

  console.log(`✓ ${sports.length} sports`);

  // Amenities
  const amenities = await Promise.all([
    prisma.amenity.upsert({
      where: { slug: "parking" },
      update: {},
      create: { slug: "parking", name: "Parking", nameCs: "Parkování", icon: "🅿️" },
    }),
    prisma.amenity.upsert({
      where: { slug: "showers" },
      update: {},
      create: { slug: "showers", name: "Showers", nameCs: "Sprchy", icon: "🚿" },
    }),
    prisma.amenity.upsert({
      where: { slug: "cafe" },
      update: {},
      create: { slug: "cafe", name: "Café", nameCs: "Kavárna", icon: "☕" },
    }),
    prisma.amenity.upsert({
      where: { slug: "pro-shop" },
      update: {},
      create: { slug: "pro-shop", name: "Pro Shop", nameCs: "Pro shop", icon: "🛍️" },
    }),
    prisma.amenity.upsert({
      where: { slug: "locker-room" },
      update: {},
      create: { slug: "locker-room", name: "Locker Room", nameCs: "Šatna", icon: "🔐" },
    }),
  ]);

  console.log(`✓ ${amenities.length} amenities`);

  // Locations (Praha split into districts)
  const praha6 = await prisma.location.upsert({
    where: { city_region: { city: "Praha 6", region: "Hlavní město Praha" } },
    update: {},
    create: { city: "Praha 6", region: "Hlavní město Praha", lat: 50.1000, lng: 14.3700 },
  });

  const praha7 = await prisma.location.upsert({
    where: { city_region: { city: "Praha 7", region: "Hlavní město Praha" } },
    update: {},
    create: { city: "Praha 7", region: "Hlavní město Praha", lat: 50.1000, lng: 14.4300 },
  });

  const praha3 = await prisma.location.upsert({
    where: { city_region: { city: "Praha 3", region: "Hlavní město Praha" } },
    update: {},
    create: { city: "Praha 3", region: "Hlavní město Praha", lat: 50.0833, lng: 14.4500 },
  });

  const brno = await prisma.location.upsert({
    where: { city_region: { city: "Brno", region: "Jihomoravský kraj" } },
    update: {},
    create: { city: "Brno", region: "Jihomoravský kraj", lat: 49.1951, lng: 16.6068 },
  });

  const olomouc = await prisma.location.upsert({
    where: { city_region: { city: "Olomouc", region: "Olomoucký kraj" } },
    update: {},
    create: { city: "Olomouc", region: "Olomoucký kraj", lat: 49.5938, lng: 17.2509 },
  });

  console.log(`✓ 5 locations`);

  // Facilities
  const squash = sports.find((s) => s.slug === "squash")!;
  const plavani = sports.find((s) => s.slug === "plavani")!;

  const parking = amenities.find((a) => a.slug === "parking")!;
  const showers = amenities.find((a) => a.slug === "showers")!;
  const cafe = amenities.find((a) => a.slug === "cafe")!;
  const proShop = amenities.find((a) => a.slug === "pro-shop")!;

  const facilitiesData = [
    {
      name: "Squash Arena Žižkov",
      slug: "squash-arena-zizkov",
      description: "6 squashových kurtů v centru Prahy, otevřeno 7 dní v týdnu.",
      address: "Seifertova 22, Praha 3",
      postalCode: "130 00",
      locationId: praha3.id,
      lat: 50.088,
      lng: 14.446,
      courtsLanes: 6,
      pricing: "200–280 Kč/hod",
      openingHours: { po: "06:00–23:00", út: "06:00–23:00", st: "06:00–23:00", čt: "06:00–23:00", pá: "06:00–23:00", so: "08:00–22:00", ne: "09:00–21:00" },
      website: null,
      isPremium: false,
      isClaimed: false,
      sportIds: [squash.id],
      amenityIds: [showers.id],
      phone: null,
    },
    {
      name: "Aquapark Olomouc",
      slug: "aquapark-olomouc",
      description: "Plavecký areál s 50m bazénem a dětskou sekcí.",
      address: "Rolsberská 4, Olomouc",
      postalCode: "779 00",
      locationId: olomouc.id,
      lat: 49.594,
      lng: 17.251,
      courtsLanes: 8,
      pricing: "80–150 Kč/vstup",
      openingHours: { po: "06:00–21:00", út: "06:00–21:00", st: "06:00–21:00", čt: "06:00–21:00", pá: "06:00–21:00", so: "08:00–20:00", ne: "08:00–20:00" },
      website: "https://aquapark-olomouc.cz",
      isPremium: false,
      isClaimed: false,
      sportIds: [plavani.id],
      amenityIds: [parking.id, showers.id, cafe.id],
      phone: "+420 585 231 100",
    },
  ];

  for (const data of facilitiesData) {
    const { sportIds, amenityIds, phone, ...facilityData } = data;
    const existing = await prisma.facility.findUnique({ where: { slug: facilityData.slug } });
    if (existing) {
      console.log(`  skip existing: ${facilityData.name}`);
      continue;
    }
    await prisma.facility.create({
      data: {
        ...facilityData,
        sports: { create: sportIds.map((id) => ({ sportId: id })) },
        amenities: { create: amenityIds.map((id) => ({ amenityId: id })) },
        contacts: phone
          ? { create: [{ type: "PHONE", value: phone, label: "Recepce", isPrimary: true }] }
          : undefined,
      },
    });
    console.log(`  ✓ ${facilityData.name}`);
  }

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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
      where: { slug: "tenis" },
      update: {},
      create: {
        slug: "tenis",
        name: "Tennis",
        nameCs: "Tenis",
        subdomain: "tenis",
        description: "Tenisové kurty v České republice",
        icon: "🎾",
      },
    }),
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
      where: { slug: "badminton" },
      update: {},
      create: {
        slug: "badminton",
        name: "Badminton",
        nameCs: "Badminton",
        subdomain: "badminton",
        description: "Badmintonové kurty v České republice",
        icon: "🏸",
      },
    }),
    prisma.sport.upsert({
      where: { slug: "volejbal" },
      update: {},
      create: {
        slug: "volejbal",
        name: "Volleyball",
        nameCs: "Volejbal",
        subdomain: "volejbal",
        description: "Volejbalové kurty v České republice",
        icon: "🏐",
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
      where: { slug: "golf" },
      update: {},
      create: {
        slug: "golf",
        name: "Golf",
        nameCs: "Golf",
        subdomain: "golf",
        description: "Golfová hřiště, driving range, indoor golf",
        icon: "⛳",
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
      where: { slug: "padel" },
      update: {},
      create: {
        slug: "padel",
        name: "Padel",
        nameCs: "Padel",
        subdomain: "padel",
        description: "Padelové kurty v České republice",
        icon: "🎾",
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
  const tenis = sports.find((s) => s.slug === "tenis")!;
  const squash = sports.find((s) => s.slug === "squash")!;
  const badminton = sports.find((s) => s.slug === "badminton")!;
  const plavani = sports.find((s) => s.slug === "plavani")!;

  const parking = amenities.find((a) => a.slug === "parking")!;
  const showers = amenities.find((a) => a.slug === "showers")!;
  const cafe = amenities.find((a) => a.slug === "cafe")!;
  const proShop = amenities.find((a) => a.slug === "pro-shop")!;

  const facilitiesData = [
    {
      name: "Sportcentrum Strahov",
      slug: "sportcentrum-strahov",
      description: "Největší sportovní centrum v Praze s 12 tenisovými kurty.",
      address: "Vaníčkova 2, Praha 6",
      postalCode: "169 00",
      locationId: praha6.id,
      lat: 50.081,
      lng: 14.385,
      courtsLanes: 12,
      pricing: "300–450 Kč/hod",
      openingHours: { po: "07:00–22:00", út: "07:00–22:00", st: "07:00–22:00", čt: "07:00–22:00", pá: "07:00–22:00", so: "08:00–20:00", ne: "08:00–20:00" },
      website: "https://strahov.cz",
      isPremium: true,
      isClaimed: true,
      sportIds: [tenis.id],
      amenityIds: [parking.id, showers.id, cafe.id],
      phone: "+420 233 355 400",
    },
    {
      name: "Tenisový klub Sparta Praha",
      slug: "tenisovy-klub-sparta-praha",
      description: "Historický tenisový klub s antukovou i tvrdou povrchovou variantou.",
      address: "Milady Horákové 98, Praha 7",
      postalCode: "170 00",
      locationId: praha7.id,
      lat: 50.099,
      lng: 14.42,
      courtsLanes: 20,
      pricing: "400–600 Kč/hod",
      openingHours: { po: "07:00–21:00", út: "07:00–21:00", st: "07:00–21:00", čt: "07:00–21:00", pá: "07:00–21:00", so: "08:00–19:00", ne: "08:00–19:00" },
      website: "https://sparta-tenis.cz",
      isPremium: true,
      isClaimed: true,
      sportIds: [tenis.id],
      amenityIds: [parking.id, showers.id, cafe.id, proShop.id],
      phone: "+420 233 371 480",
    },
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
      name: "SK Badminton Brno",
      slug: "sk-badminton-brno",
      description: "Moderní badmintonová hala s 8 kurty v Brně.",
      address: "Sportovní 4, Brno",
      postalCode: "602 00",
      locationId: brno.id,
      lat: 49.195,
      lng: 16.608,
      courtsLanes: 8,
      pricing: "180–240 Kč/hod",
      openingHours: { po: "08:00–22:00", út: "08:00–22:00", st: "08:00–22:00", čt: "08:00–22:00", pá: "08:00–22:00", so: "09:00–20:00", ne: "10:00–18:00" },
      website: "https://skbadminton-brno.cz",
      isPremium: false,
      isClaimed: true,
      sportIds: [badminton.id],
      amenityIds: [parking.id, showers.id],
      phone: "+420 544 212 345",
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

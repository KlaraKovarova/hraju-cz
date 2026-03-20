import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString: connStr! });
const prisma = new PrismaClient({ adapter });

interface FerrataData {
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  region: string;
  lat: number | null;
  lng: number | null;
  website: string | null;
}

const FERRATY: FerrataData[] = [
  // ÚSTECKÝ KRAJ
  {
    name: "Pastýřská Stěna",
    slug: "pastyrska-stena-decin",
    description: "Největší ferratový park v ČR s 16 trasami obtížnosti A–D. Převýšení 90 m, délka 150–170 m. Na skalní stěně přímo nad řekou Labe v Děčíně.",
    address: "Pastýřská stěna, Děčín",
    city: "Děčín",
    region: "Ústecký kraj",
    lat: 50.7793,
    lng: 14.2051,
    website: "https://facebook.com/ferratapastyrskastena",
  },
  {
    name: "Via Ferrata Kavárnička",
    slug: "via-ferrata-kavarnicka-srbska-kamenice",
    description: "Malá ferrata u Srbské Kamenice s 3 trasami obtížnosti B–D. Výška stěny 12 m. Vhodná pro začátečníky i pokročilé.",
    address: "Srbská Kamenice",
    city: "Srbská Kamenice",
    region: "Ústecký kraj",
    lat: 50.8328,
    lng: 14.3590,
    website: null,
  },
  {
    name: "Uchem Jehly",
    slug: "uchem-jehly-ceska-kamenice",
    description: "Zajištěná cesta obtížnosti B/C u České Kamenice. Délka 50 m. Průchod skalní úžinou.",
    address: "Česká Kamenice",
    city: "Česká Kamenice",
    region: "Ústecký kraj",
    lat: 50.8063,
    lng: 14.4268,
    website: null,
  },
  {
    name: "Ferrata Poustevna",
    slug: "ferrata-poustevna-decin",
    description: "Ferrata u Mírkova (Děčín) s 8 trasami obtížnosti A–C. Celková délka 350 m. Krásné výhledy na Labe.",
    address: "Mírkův, Děčín",
    city: "Děčín",
    region: "Ústecký kraj",
    lat: 50.6904,
    lng: 14.1131,
    website: null,
  },
  {
    name: "Lužická Spojka",
    slug: "luzicka-spojka-vanov",
    description: "Zajištěná cesta obtížnosti C u Vaňova (Ústí nad Labem). Délka 60 m. Exponovaný traverz nad údolím.",
    address: "Vaňov, Ústí nad Labem",
    city: "Ústí nad Labem",
    region: "Ústecký kraj",
    lat: 50.6199,
    lng: 14.0553,
    website: null,
  },
  {
    name: "Miniferrata Vinařská",
    slug: "miniferrata-vinarska-usti-nad-labem",
    description: "Malá ferrata obtížnosti B v Ústí nad Labem. Délka 30 m. Ideální pro nácvik ferratové techniky.",
    address: "Vinařská, Ústí nad Labem",
    city: "Ústí nad Labem",
    region: "Ústecký kraj",
    lat: 50.6792,
    lng: 14.0176,
    website: null,
  },
  {
    name: "Ferraty u Hradu Blansko",
    slug: "ferraty-u-hradu-blansko-usti",
    description: "Zajištěná cesta obtížnosti B u hradu Blansko, Ústí nad Labem. Délka 30 m.",
    address: "Blansko, Ústí nad Labem",
    city: "Ústí nad Labem",
    region: "Ústecký kraj",
    lat: null,
    lng: null,
    website: null,
  },
  {
    name: "Ferrata Kolem Jalovce",
    slug: "ferrata-kolem-jalovce-decin",
    description: "Ferrata obtížnosti B u Bradla (Děčín). Délka 20 m. Krátká, ale zajímavá trasa.",
    address: "Bradlo, Děčín",
    city: "Děčín",
    region: "Ústecký kraj",
    lat: 50.6894,
    lng: 14.1598,
    website: null,
  },
  {
    name: "Ferrata Hněvín",
    slug: "ferrata-hnevin-most",
    description: "Ferrata obtížnosti B na hradním vrchu Hněvín v Mostě. Délka 75 m. Výhledy na město a okolí.",
    address: "Hněvín, Most",
    city: "Most",
    region: "Ústecký kraj",
    lat: 50.5207,
    lng: 13.6313,
    website: null,
  },
  {
    name: "Ferrata Povrly – Kovadlina",
    slug: "ferrata-povrly-kovadlina",
    description: "Zajištěná cesta obtížnosti B/C u Povrlů (Ústí nad Labem). Délka 175 m.",
    address: "Povrly, Ústí nad Labem",
    city: "Povrly",
    region: "Ústecký kraj",
    lat: null,
    lng: null,
    website: null,
  },
  // LIBERECKÝ KRAJ
  {
    name: "Kočičí Kameny",
    slug: "kocici-kameny-bily-potok",
    description: "Ferrata obtížnosti B v Jizerských horách u Bílého Potoka. Délka 70 m. Žulové skály v krásném přírodním prostředí.",
    address: "Bílý Potok, Jizerské hory",
    city: "Bílý Potok",
    region: "Liberecký kraj",
    lat: 50.8872,
    lng: 15.2310,
    website: null,
  },
  {
    name: "Vodní Brána",
    slug: "vodni-brana-semily",
    description: "Ferrata obtížnosti B–D v Semilech se 3 směry. Celková délka 120 m. Zajištěné cesty nad řekou Jizerou.",
    address: "Semily",
    city: "Semily",
    region: "Liberecký kraj",
    lat: 50.6157,
    lng: 15.3086,
    website: "https://vodni-brana.cz",
  },
  {
    name: "Horolezecká Aréna Liberec",
    slug: "horolezecka-arena-liberec",
    description: "Ferrata obtížnosti A/B–D/E v Liberci. Délka 130 m. Součást horolezecké arény, pestré trasy pro všechny úrovně.",
    address: "Liberec",
    city: "Liberec",
    region: "Liberecký kraj",
    lat: 50.7635,
    lng: 15.0617,
    website: "https://horolezeckaarena.cz",
  },
  // STŘEDOČESKÝ KRAJ
  {
    name: "Slánská Hora",
    slug: "slanska-hora-slany",
    description: "Ferrata obtížnosti B/C–D/E ve Slaném s 6 trasami. Celková délka 70 m. Čedičový kopec s unikátní geologií.",
    address: "Slánská Hora, Slaný",
    city: "Slaný",
    region: "Středočeský kraj",
    lat: 50.2323,
    lng: 14.0955,
    website: null,
  },
  // JIHOČESKÝ KRAJ
  {
    name: "Ferata Hluboká",
    slug: "ferata-hluboka-nad-vltavou",
    description: "Ferrata obtížnosti B–C/D u Hluboké nad Vltavou. Délka 550 m. Trasa nad údolím Vltavy s krásnými výhledy.",
    address: "Hluboká nad Vltavou",
    city: "Hluboká nad Vltavou",
    region: "Jihočeský kraj",
    lat: 49.0965,
    lng: 14.4639,
    website: null,
  },
  {
    name: "Ferrata Tábor",
    slug: "ferrata-tabor",
    description: "Ferrata obtížnosti B/C v Táboře. Délka 80 m. Skalní stěna v centru města nad řekou Lužnicí.",
    address: "Tábor",
    city: "Tábor",
    region: "Jihočeský kraj",
    lat: 49.4129,
    lng: 14.6468,
    website: null,
  },
  {
    name: "Ferrata Bechyně",
    slug: "ferrata-bechyne",
    description: "Nejtěžší ferrata v ČR, obtížnost D/E. Délka 400 m — traverz nad řekou Lužnicí. Pouze pro zkušené ferratisty s kompletním vybavením.",
    address: "Bechyně",
    city: "Bechyně",
    region: "Jihočeský kraj",
    lat: 49.2861,
    lng: 14.4702,
    website: "https://ferratabechyne.cz",
  },
  {
    name: "Ferrata Havranka",
    slug: "ferrata-havranka-cesky-krumlov",
    description: "Ferrata obtížnosti B–C u Českého Krumlova. Délka 110 m. Nejdelší vzdušná lávka v ČR.",
    address: "Český Krumlov",
    city: "Český Krumlov",
    region: "Jihočeský kraj",
    lat: null,
    lng: null,
    website: "https://ferratahavranka.cz",
  },
  {
    name: "Václavské Skály",
    slug: "vaclavske-skaly-pisek",
    description: "Ferrata obtížnosti B–B/C u Písku. Délka 135 m. Trasa u řeky Otavy.",
    address: "Václavské Skály, Písek",
    city: "Písek",
    region: "Jihočeský kraj",
    lat: null,
    lng: null,
    website: null,
  },
  // KRAJ VYSOČINA
  {
    name: "Jezerní Stěna",
    slug: "jezerni-stena-vir",
    description: "Ferrata obtížnosti B/C u přehrady Vír. Délka 100 m. Skalní stěna nad vodní nádrží Vír.",
    address: "Vír",
    city: "Vír",
    region: "Kraj Vysočina",
    lat: 49.5621,
    lng: 16.3096,
    website: "https://ledovastenavir.cz",
  },
  {
    name: "Velká Věž",
    slug: "velka-vez-vir",
    description: "Ferrata obtížnosti B/C u Víru. Délka 100 m. Sousedí s Jezerní Stěnou, nabízí odlišný charakter lezení.",
    address: "Vír",
    city: "Vír",
    region: "Kraj Vysočina",
    lat: 49.5596,
    lng: 16.3106,
    website: "https://ledovastenavir.cz",
  },
  // KARLOVARSKÝ KRAJ
  {
    name: "Ferraty Nové Hamry",
    slug: "ferraty-nove-hamry",
    description: "4 ferratové trasy obtížnosti A–D u Nových Hamrů. Celková délka 60 m. V areálu Kempu Seifert.",
    address: "Nové Hamry",
    city: "Nové Hamry",
    region: "Karlovarský kraj",
    lat: 50.3593,
    lng: 12.7179,
    website: null,
  },
  {
    name: "Bioferrata Bečov",
    slug: "bioferrata-becov-nad-teplou",
    description: "Ferrata obtížnosti C/D v botanické zahradě v Bečově nad Teplou. Délka 30 m. Unikátní propojení přírody a lezení.",
    address: "Bečov nad Teplou",
    city: "Bečov nad Teplou",
    region: "Karlovarský kraj",
    lat: null,
    lng: null,
    website: "https://becovskabotanicka.cz",
  },
  {
    name: "Hauberg",
    slug: "hauberg-kraslice",
    description: "Ferrata obtížnosti A/B–C/D u Kraslic. Délka 80 m. 3 barevně značené trasy různé obtížnosti.",
    address: "Kraslice",
    city: "Kraslice",
    region: "Karlovarský kraj",
    lat: null,
    lng: null,
    website: null,
  },
  {
    name: "Via Ferrata Beduín",
    slug: "via-ferrata-beduin-stribrna",
    description: "Ferrata obtížnosti C–D/E u Stříbrné (Kraslice). 3 trasy, celková délka 250 m. Náročnější ferrata s pestrými pasážemi.",
    address: "Stříbrná, Kraslice",
    city: "Stříbrná",
    region: "Karlovarský kraj",
    lat: 50.3739,
    lng: 12.5519,
    website: null,
  },
  // JIHOMORAVSKÝ KRAJ
  {
    name: "Velká Dohoda",
    slug: "velka-dohoda-holstejn",
    description: "Největší ferratový areál na Moravě s 15 trasami obtížnosti A–E. Celková délka 836 m. V srdci Moravského krasu.",
    address: "Holštejn, Moravský kras",
    city: "Holštejn",
    region: "Jihomoravský kraj",
    lat: null,
    lng: null,
    website: "https://velkadohoda-moravskykras.cz",
  },
  {
    name: "Speleoferrata",
    slug: "speleoferrata-moravsky-kras",
    description: "Unikátní podzemní ferrata obtížnosti C/D v Moravském krasu. Délka 40 m. Jedna z mála podzemních ferrat v Evropě.",
    address: "Moravský kras",
    city: "Moravský kras",
    region: "Jihomoravský kraj",
    lat: null,
    lng: null,
    website: "https://speleoart.cz",
  },
  // PARDUBICKÝ KRAJ
  {
    name: "Via Ferrata Cakle",
    slug: "via-ferrata-cakle-oldrichovice",
    description: "Ferrata obtížnosti A–C u Oldřichovic (Ústí nad Orlicí). Délka 60 m. Přírodní skalní masiv s výhledy na Orlické hory.",
    address: "Oldřichovice, Ústí nad Orlicí",
    city: "Oldřichovice",
    region: "Pardubický kraj",
    lat: null,
    lng: null,
    website: "https://cakle.cz/via-ferrata",
  },
];

async function main() {
  console.log("Seeding ferraty listings...\n");

  // Get the ferraty sport
  const ferratySport = await prisma.sport.findUnique({ where: { slug: "ferraty" } });
  if (!ferratySport) {
    console.error("ERROR: 'ferraty' sport not found in DB. Run main seed first.");
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const data of FERRATY) {
    // Check if facility already exists
    const existing = await prisma.facility.findUnique({ where: { slug: data.slug } });
    if (existing) {
      console.log(`  skip existing: ${data.name}`);
      skipped++;
      continue;
    }

    // Upsert location
    const location = await prisma.location.upsert({
      where: { city_region: { city: data.city, region: data.region } },
      update: {},
      create: {
        city: data.city,
        region: data.region,
        lat: data.lat,
        lng: data.lng,
      },
    });

    // Create facility with sport link and optional website contact
    await prisma.facility.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        address: data.address,
        locationId: location.id,
        lat: data.lat,
        lng: data.lng,
        courtsLanes: null,
        pricing: null,
        openingHours: null,
        website: data.website,
        isActive: true,
        isClaimed: false,
        isPremium: false,
        sports: {
          create: [{ sportId: ferratySport.id }],
        },
        contacts: data.website
          ? {
              create: [
                {
                  type: "WEBSITE",
                  value: data.website,
                  label: "Web",
                  isPrimary: true,
                },
              ],
            }
          : undefined,
      },
    });

    console.log(`  ✓ ${data.name} (${data.city}, ${data.region})`);
    created++;
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}, Total: ${FERRATY.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

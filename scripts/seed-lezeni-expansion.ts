/**
 * Expand climbing product catalog: 12 new products across 5 categories.
 * New categories: jistitko (belay devices), prilba (helmets), expresky, karabina
 * Expanded categories: lezecky (shoes)
 *
 * Usage: npx tsx scripts/seed-lezeni-expansion.ts
 */
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

const products = [
  // === CLIMBING SHOES (3 new) ===
  {
    slug: "la-sportiva-tarantulace",
    name: "Tarantulace",
    brand: "La Sportiva",
    sport: "lezeni",
    category: "lezecky",
    description:
      "Univerzální lezecká bota pro začátečníky a rekreační lezce. Pohodlný plochý profil s nízkým zakřivením, kožený svršek a odolná guma FriXion RS. Skvělá volba pro lezeckou stěnu i snadnější outdoorové cesty.",
    specs: {
      closure: "šněrovací",
      rubber: "FriXion RS 5 mm",
      last: "nízká asymetrie",
      downturn: "plochý",
      stiffness: "střední (3/5)",
      weight: "245 g",
      sizes: "34–50",
      upper: "kůže + mikrovlákno",
    },
    images: [
      "https://www.lasportiva.com/media/catalog/product/1/0/10F600600_01.jpg",
    ],
    sourceUrl: "https://www.lasportiva.com/en/tarantulace-man-blue-10f600600",
    price: 229000,
  },
  {
    slug: "scarpa-veloce",
    name: "Veloce",
    brand: "Scarpa",
    sport: "lezeni",
    category: "lezecky",
    description:
      "Lehká a citlivá lezecká bota pro halové lezení. Měkká guma S-72 nabízí výbornou adhezi, minimalistická mezipodešev zajišťuje maximální citlivost. Mírně zakřivený profil a prostorná špička pro pohodlí při delším lezení.",
    specs: {
      closure: "suchý zip (velcro)",
      rubber: "S-72 4 mm",
      last: "mírná asymetrie",
      downturn: "mírný",
      stiffness: "měkká",
      weight: "195 g (vel. 40,5)",
      sizes: "38–50",
      midsole: "Flexan 1.0 mm",
    },
    images: [
      "https://scarpa.com/cdn/shop/files/70065-001-1_00_VEL_Blk-Orn.jpg?v=1769907765&width=1920",
    ],
    sourceUrl:
      "https://scarpa.com/products/veloce-climbing-shoe-for-indoor-use-70065-001-1",
    price: 319000,
  },
  {
    slug: "ocun-advancer-qc",
    name: "Advancer QC",
    brand: "OCÚN",
    sport: "lezeni",
    category: "lezecky",
    description:
      "Pohodlná lezecká bota české značky OCÚN pro pokročilé lezce. Dva velcro pásky umožňují rychlé nazouvání a přesné utažení. Tužší mezipodešev 2D Fit Hard nabízí oporu na hranách, guma CAT 1.5 zajišťuje dobrou přilnavost.",
    specs: {
      closure: "suchý zip (2× velcro)",
      rubber: "CAT 1.5 4 mm",
      last: "střední asymetrie",
      downturn: "mírný",
      stiffness: "středně tuhá",
      weight: "219 g (vel. 40)",
      sizes: "36,5–48",
      midsole: "2D Fit Hard",
    },
    images: [
      "https://www.ocun.com/assets/products/1_700x700/ocun-advancer-qc-1.jpg",
    ],
    sourceUrl: "https://www.ocun.com/cs/product/advancer-qc",
    price: 249000,
  },

  // === BELAY DEVICES (3 new) ===
  {
    slug: "petzl-grigri",
    name: "GriGri",
    brand: "Petzl",
    sport: "lezeni",
    category: "jistitko",
    description:
      "Nejpopulárnější poloautomatické jistítko na světě s asistovaným brzdným systémem. Vačkový mechanismus automaticky zablokuje lano při pádu lezce, což poskytuje extra bezpečnost oproti klasickým kyblíkům. Vhodné pro jištění prvolezce i na top-rope.",
    specs: {
      type: "poloautomatické (cam-assisted braking)",
      weight: "175 g",
      ropeDiameter: "8,5–11 mm (optimální 8,9–10,5 mm)",
      material: "hliníkové boční desky, nerezová vačka",
      certifications: ["CE EN 15151-1", "UIAA"],
    },
    images: [
      "https://www.petzl.com/sfc/servlet.shepherd/version/download/0686800000Y6DAFAA3",
    ],
    sourceUrl:
      "https://www.petzl.com/INT/en/Sport/Belay-Devices-And-Descenders/GRIGRI",
    price: 249900,
  },
  {
    slug: "black-diamond-atc-xp",
    name: "ATC-XP",
    brand: "Black Diamond",
    sport: "lezeni",
    category: "jistitko",
    description:
      "Klasický kyblíkový jistící a slaňovací prostředek s dvěma režimy tření. Režim s vysokým třením poskytuje 3× větší brzdnou sílu než standardní kyblíky — ideální pro tenká lana nebo těžší lezce. Kovaný hliník, extrémně nízká hmotnost.",
    specs: {
      type: "kyblíkové (tubular) s dvojitým režimem tření",
      weight: "64 g",
      ropeDiameter: "7,7–11 mm",
      ropeType: "jednoduchá i poloviční lana",
      material: "kovaný hliník",
      certifications: ["CE EN 15151-2", "UIAA"],
      frictionModes: "2 (standardní + vysoké tření)",
    },
    images: [
      "https://blackdiamondequipment.com/cdn/shop/files/620075_0001_ATCXP_Black_01.jpg",
    ],
    sourceUrl:
      "https://blackdiamondequipment.com/products/atc-xp-belay-rappel-device",
    price: 53500,
  },
  {
    slug: "singing-rock-shuttle-belay",
    name: "Shuttle",
    brand: "Singing Rock",
    sport: "lezeni",
    category: "jistitko",
    description:
      "Lehký a kompaktní kyblíkový jistící prostředek od české značky Singing Rock. V-drážky zajišťují optimální tření při jištění i slanění. Při jištění druholezce funguje jako samoblokující — umožňuje současné jištění dvou druholezců na vícedélkových cestách.",
    specs: {
      type: "kyblíkové (tubular) se samoblokovací funkcí",
      weight: "65 g",
      ropeDiameter: "7,8–10,5 mm",
      ropeType: "jednoduchá, poloviční i dvojitá lana",
      material: "lehká hliníková slitina",
      certifications: ["CE EN 15151-2"],
      articleNumber: "K6140",
    },
    images: [
      "https://www.singingrock.com/data/katalog/big/K61/K6140XX00.jpg",
    ],
    sourceUrl: "https://www.singingrock.com/shuttle",
    price: 49900,
  },

  // === HELMETS (3 new) ===
  {
    slug: "petzl-boreo",
    name: "Boreo",
    brand: "Petzl",
    sport: "lezeni",
    category: "prilba",
    description:
      "Odolná a univerzální horolezecká helma s hybridní konstrukcí kombinující tvrdou skořápinu ABS a dvě vrstvy pěny (EPP + EPS). Nadprůměrná ochrana ze stran i zezadu — vhodná pro lezení, ferraty, speleologii i kanyoning.",
    specs: {
      type: "hybridní (ABS skořápina + EPP/EPS pěna)",
      weight: "295 g (S/M), 310 g (M/L)",
      sizeRange: "S/M: 48–58 cm, M/L: 53–61 cm",
      certifications: ["CE EN 12492", "UIAA 106"],
      headlampClips: true,
      ventilation: "více ventilačních otvorů",
    },
    images: [
      "https://www.petzl.com/sfc/servlet.shepherd/version/download/068680000144Q2IAAU",
    ],
    sourceUrl: "https://www.petzl.com/INT/en/Sport/Helmets/BOREO",
    price: 149000,
  },
  {
    slug: "black-diamond-vision",
    name: "Vision",
    brand: "Black Diamond",
    sport: "lezeni",
    category: "prilba",
    description:
      "Ultralehká lezecká helma s vynikajícím poměrem ochrany a hmotnosti. Kombinace EPP pěny, EPS polštářku a polykarbonátové skořápiny zajišťuje solidní ochranu při váze pouhých 220 g. 13 ventilačních otvorů udržuje hlavu v chladu.",
    specs: {
      type: "hybridní (polykarbonát + EPP/EPS pěna)",
      weight: "220 g (S/M), 235 g (M/L)",
      sizeRange: "S/M: 53–59 cm, M/L: 58–63 cm",
      certifications: ["CE EN 12492", "UIAA 106"],
      ventilation: "13 ventilačních otvorů",
      headlampClips: true,
    },
    images: [
      "https://blackdiamondequipment.com/cdn/shop/files/620217_0002_S22_VISION_Storm-Blue_01.jpg",
    ],
    sourceUrl:
      "https://www.blackdiamondequipment.com/en_US/product/vision-helmet/",
    price: 195000,
  },
  {
    slug: "singing-rock-penta",
    name: "Penta",
    brand: "Singing Rock",
    sport: "lezeni",
    category: "prilba",
    description:
      "Ultralehká helma od českého výrobce Singing Rock. Váží pouhých 195 g a nabízí o 30 % větší ventilační plochu než předchozí generace. Polykarbonátová skořápina s EPS výplní chrání při pádu kamení i nárazu — ideální pro sportovní i tradiční lezení.",
    specs: {
      type: "hardshell (polykarbonát + EPS pěna)",
      weight: "185 g (S), 195 g (M/L), 205 g (XL)",
      sizeRange: "S: 48–54 cm, M/L: 52–58 cm, XL: 56–62 cm",
      certifications: ["CE EN 12492"],
      headlampClips: true,
      ventilation: "rozšířená ventilační plocha (2. generace)",
    },
    images: [
      "https://www.singingrock.com/data/katalog/big/C09/C0900YX0.jpg",
    ],
    sourceUrl: "https://www.singingrock.com/penta-2",
    price: 149000,
  },

  // === QUICKDRAWS & CARABINERS (3 new) ===
  {
    slug: "petzl-djinn-axess",
    name: "Djinn Axess 12 cm",
    brand: "Petzl",
    sport: "lezeni",
    category: "expresky",
    description:
      "Spolehlivá a odolná expreska pro sportovní lezení. Set obsahuje dvě karabiny Djinn — jednu s rovnou západkou pro kotvicí body a jednu s ohnutou západkou pro snadné připojení lana. Systém Keylock zabraňuje zachytávání při cvakání.",
    specs: {
      weight: "107 g",
      majorAxis: "23 kN",
      minorAxis: "8 kN",
      openGate: "9 kN",
      slingStrength: "22 kN",
      gateOpening: "24 mm (rovná) / 27 mm (ohnutá)",
      noseType: "Keylock",
      certifications: ["CE EN 12275 typ B", "CE EN 566", "UIAA"],
      lengths: "12 cm, 17 cm, 25 cm",
    },
    images: [
      "https://www.petzl.com/sfc/servlet.shepherd/version/download/0686800000Y6DAFAA3",
    ],
    sourceUrl:
      "https://www.petzl.com/INT/en/Sport/Carabiners-And-Quickdraws/DJINN-AXESS",
    price: 47500,
  },
  {
    slug: "singing-rock-vision-straight",
    name: "Vision Straight",
    brand: "Singing Rock",
    sport: "lezeni",
    category: "karabina",
    description:
      "Nejlehčí drátěná karabina od české značky Singing Rock vážící pouhých 33 gramů. Drátěný zámek odolává náhodnému otevření nárazem a nezamrzá v mrazu. Ergonomický tvar a plynulý chod zámku — skvělá na expresky i jako lehká snapgate karabina.",
    specs: {
      weight: "33 g",
      majorAxis: "25 kN",
      minorAxis: "7 kN",
      openGate: "8 kN",
      gateOpening: "19 mm",
      gateType: "rovný drátěný zámek (wire gate)",
      shape: "D-tvar",
      certifications: ["CE EN 12275 typ B", "UIAA"],
      articleNumber: "K5230",
    },
    images: [
      "https://www.singingrock.com/data/katalog/big/K52/K5230XX00.jpg",
    ],
    sourceUrl: "https://www.singingrock.com/vision-straight",
    price: 19700,
  },
  {
    slug: "black-diamond-positron-screwgate",
    name: "Positron Screwgate",
    brand: "Black Diamond",
    sport: "lezeni",
    category: "karabina",
    description:
      "Lehká a kompaktní jistící karabina se šroubovacím zámkem. Tvar Offset-D s hlubokým košem usnadňuje cvakání a nos typu Keylock zabraňuje zachytávání o smyčky. Univerzální karabina vhodná pro sportovní i tradiční lezení, jištění a stavbu stanovišť.",
    specs: {
      weight: "56 g",
      majorAxis: "25 kN",
      minorAxis: "8 kN",
      openGate: "8 kN",
      gateOpening: "21 mm",
      gateType: "šroubovací (screwgate)",
      shape: "Offset-D",
      noseType: "Keylock",
      certifications: ["CE EN 12275", "UIAA"],
    },
    images: [
      "https://blackdiamondequipment.com/cdn/shop/files/210285_0000_POSITRON_SCREWGATE_01.jpg",
    ],
    sourceUrl:
      "https://blackdiamondequipment.com/products/positron-screwgate-carabiner",
    price: 29900,
  },
];

async function main() {
  console.log(
    `Seeding ${products.length} new lezení climbing gear products...`
  );

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        specs: p.specs,
        images: p.images,
        sourceUrl: p.sourceUrl,
        price: p.price,
      },
      create: p,
    });
    console.log(`  ✓ ${p.brand} ${p.name} (${p.category})`);
  }

  const lezeniCount = await prisma.product.count({
    where: { sport: "lezeni" },
  });
  const total = await prisma.product.count();
  console.log(`\nDone. Lezení products: ${lezeniCount} | Total: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

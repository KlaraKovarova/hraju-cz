/**
 * Seed climbing gear products for lezení category.
 * Czech-available brands: OCÚN, La Sportiva, Scarpa, Petzl, Black Diamond, Singing Rock, Moon
 *
 * Usage: npx tsx scripts/seed-lezeni-products.ts
 */
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const products = [
  // === CLIMBING SHOES ===
  {
    slug: "ocun-ozone",
    name: "Ozone",
    brand: "OCÚN",
    sport: "lezeni",
    category: "lezecky",
    description:
      "Univerzální lezecká bota pro halové i skalní lezení. Střední tuhost, pohodlný střih a kvalitní Vibram XS Grip guma. Ideální volba pro lezce, kteří hledají jednu botu na všechno — od boulderu po vícedélky.",
    specs: {
      closure: "šněrovací",
      rubber: "Vibram XS Grip 4 mm",
      last: "střední asymetrie",
      downturn: "mírný",
      stiffness: "střední",
      weight: "210 g (vel. 40)",
      sizes: "35–47",
    },
    images: [
      "https://www.ocun.com/assets/products/1_700x700/ocun-ozone-1.jpg",
    ],
    sourceUrl: "https://www.ocun.com/cs/product/ozone",
    price: 299000,
  },
  {
    slug: "ocun-striker-qc",
    name: "Striker QC",
    brand: "OCÚN",
    sport: "lezeni",
    category: "lezecky",
    description:
      "Agresivní boulderovací bota s rychlým suchým zipem a výrazným downturn. Cat Tongue guma poskytuje maximální frikci na malých chytech. Měkká konstrukce pro citlivost na skále.",
    specs: {
      closure: "suchý zip (velcro)",
      rubber: "Cat Tongue 3.5 mm",
      last: "silná asymetrie",
      downturn: "výrazný",
      stiffness: "měkká",
      weight: "195 g (vel. 40)",
      sizes: "35–46",
    },
    images: [
      "https://www.ocun.com/assets/products/1_700x700/ocun-striker-qc-1.jpg",
    ],
    sourceUrl: "https://www.ocun.com/cs/product/striker-qc",
    price: 349000,
  },
  {
    slug: "la-sportiva-solution-comp",
    name: "Solution Comp",
    brand: "La Sportiva",
    sport: "lezeni",
    category: "lezecky",
    description:
      "Závodní boulderovací bota s maximální citlivostí a přilnavostí. P3 platformový systém udržuje tvar boty i po opakovaném lezení. Vibram XS Grip2 guma pro bezkonkurenční frikci na převisech.",
    specs: {
      closure: "suchý zip (velcro)",
      rubber: "Vibram XS Grip2 3.5 mm",
      last: "silná asymetrie",
      downturn: "výrazný",
      stiffness: "měkká",
      weight: "200 g (vel. 40)",
      sizes: "33–46",
    },
    images: [],
    sourceUrl: "https://www.lasportiva.com/en/solution-comp",
    price: 449000,
  },
  {
    slug: "scarpa-instinct-vs",
    name: "Instinct VS",
    brand: "Scarpa",
    sport: "lezeni",
    category: "lezecky",
    description:
      "Všestranná lezecká bota s Vibram XS Edge gumou pro přesné šlapání na malých lištách. Bi-Tension systém aktivně přenáší sílu do špičky. Populární volba pro sportovní lezení a boulder.",
    specs: {
      closure: "suchý zip (velcro)",
      rubber: "Vibram XS Edge 3.5 mm",
      last: "střední asymetrie",
      downturn: "střední",
      stiffness: "středně tuhá",
      weight: "215 g (vel. 40)",
      sizes: "33.5–46",
    },
    images: [],
    sourceUrl: "https://www.scarpa.com/instinct-vs",
    price: 419000,
  },

  // === HARNESS ===
  {
    slug: "ocun-twist-basic",
    name: "Twist Basic",
    brand: "OCÚN",
    sport: "lezeni",
    category: "uvazek",
    description:
      "Univerzální sedací úvazek pro sportovní lezení, halové lezení i ferraty. Lehká konstrukce s polstrovaným bederním pásem a nožními poutky. Čtyři materiálové smyčky pro vybavení.",
    specs: {
      weight: "370 g (vel. M)",
      sizes: "XS–XL",
      gearLoops: 4,
      certifications: ["EN 12277", "UIAA 105", "CE"],
    },
    images: [
      "https://www.ocun.com/assets/products/1_700x700/ocun-twist-basic-1.jpg",
    ],
    sourceUrl: "https://www.ocun.com/cs/product/twist-basic",
    price: 149000,
  },
  {
    slug: "petzl-corax",
    name: "CORAX",
    brand: "Petzl",
    sport: "lezeni",
    category: "uvazek",
    description:
      "Univerzální sedací úvazek od Petzlu pro začátečníky i pokročilé. DoubleBack přezky umožňují rychlé oblékání. Dva nastavitelné rozměry nožních poutek. Čtyři materiálové smyčky.",
    specs: {
      weight: "425 g (vel. 1)",
      sizes: "1 (XS-M), 2 (M-XL)",
      gearLoops: 4,
      certifications: ["EN 12277", "UIAA 105", "CE"],
    },
    images: [],
    sourceUrl: "https://www.petzl.com/corax",
    price: 179000,
  },
  {
    slug: "black-diamond-momentum",
    name: "Momentum",
    brand: "Black Diamond",
    sport: "lezeni",
    category: "uvazek",
    description:
      "Lehký a pohodlný sedací úvazek s Dual Core Construction technologií. Pre-threaded Speed Adjust přezka pro snadné nastavení. Ideální pro halové lezení a sportovní lezení.",
    specs: {
      weight: "350 g (vel. M)",
      sizes: "XS–XL",
      gearLoops: 4,
      certifications: ["EN 12277", "UIAA 105", "CE"],
    },
    images: [],
    sourceUrl: "https://www.blackdiamondequipment.com/momentum-harness",
    price: 169000,
  },

  // === CHALK & CHALK BAGS ===
  {
    slug: "singing-rock-magnesium-ball",
    name: "Magnesium Ball 56g",
    brand: "Singing Rock",
    sport: "lezeni",
    category: "magnesium",
    description:
      "Magnéziová kulička v prodyšném obalu pro čisté dávkování. Ideální do chalk bagu i pro halové lezení. Český výrobce lezeckého vybavení.",
    specs: {
      weight: "56 g",
      type: "kulička v obalu",
      material: "uhličitan hořečnatý (MgCO₃)",
    },
    images: [],
    sourceUrl: "https://www.singingrock.cz/magnesium-ball",
    price: 8900,
  },
  {
    slug: "ocun-chalk-bag-push",
    name: "Push",
    brand: "OCÚN",
    sport: "lezeni",
    category: "magnesium",
    description:
      "Prostorný chalk bag s pružným uzávěrem pro snadný přístup k magnéziu. Fleecová výstelka rovnoměrně distribuuje magnézium. Poutko na pásek a karabinku.",
    specs: {
      closure: "pružný uzávěr",
      lining: "fleece",
      attachment: "pásek + karabinový úchyt",
    },
    images: [
      "https://www.ocun.com/assets/products/1_700x700/ocun-push-1.jpg",
    ],
    sourceUrl: "https://www.ocun.com/cs/product/push",
    price: 59000,
  },
  {
    slug: "moon-liquid-chalk",
    name: "Liquid Chalk 200ml",
    brand: "Moon Climbing",
    sport: "lezeni",
    category: "magnesium",
    description:
      "Tekuté magnézium v lahvičce. Nanesete na ruce jako základ před lezením — vydrží déle než sypké magnézium a méně práší. Ideální kombinace: tekuté jako základ + sypké jako doplněk.",
    specs: {
      volume: "200 ml",
      type: "tekuté magnézium",
      application: "nanést na suché ruce, nechat zaschnout",
    },
    images: [],
    sourceUrl: "https://moonclimbing.com/liquid-chalk",
    price: 29000,
  },

  // === CRASHPAD ===
  {
    slug: "ocun-paddy-dominator",
    name: "Paddy Dominator",
    brand: "OCÚN",
    sport: "lezeni",
    category: "crashpad",
    description:
      "Velký crashpad pro outdoor bouldering. Třívrstvá pěna pro optimální tlumení pádu. Skládací konstrukce s pohodlnými popruhy na zádech. Rozměr 120×100 cm pokryje většinu dopadových zón.",
    specs: {
      dimensions: "120 × 100 × 10 cm",
      weight: "5.8 kg",
      foam: "třívrstvá PE + PU pěna",
      closure: "skládací, zip + popruhy",
    },
    images: [
      "https://www.ocun.com/assets/products/1_700x700/ocun-paddy-dominator-1.jpg",
    ],
    sourceUrl: "https://www.ocun.com/cs/product/paddy-dominator",
    price: 499000,
  },
  {
    slug: "singing-rock-shuttle",
    name: "Shuttle Crashpad",
    brand: "Singing Rock",
    sport: "lezeni",
    category: "crashpad",
    description:
      "Kompaktní crashpad od českého výrobce Singing Rock. Dvouvrstvá pěna, pohodlné popruhy a kapsa na drobnosti. Menší rozměr vhodný jako doplňkový pad nebo pro lehký přístup.",
    specs: {
      dimensions: "110 × 90 × 10 cm",
      weight: "4.5 kg",
      foam: "dvouvrstvá PE + PU pěna",
      closure: "skládací, zip + popruhy",
    },
    images: [],
    sourceUrl: "https://www.singingrock.cz/shuttle-crashpad",
    price: 399000,
  },
];

async function main() {
  console.log(`Seeding ${products.length} lezení climbing gear products...`);

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

  const count = await prisma.product.count();
  const lezeniCount = await prisma.product.count({ where: { sport: "lezeni" } });
  console.log(`\nDone. Lezení products: ${lezeniCount} | Total products: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

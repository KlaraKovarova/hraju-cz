import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const OCUN_BASE = "https://www.ocun.com";

const products = [
  {
    slug: "ocun-cima-gloves",
    name: "Cima Gloves",
    brand: "OCÚN",
    sport: "ferraty",
    category: "rukavice",
    description:
      "Lehké a odolné poloprstové rukavice pro jištění, ferraty i big wall. Ideální kombinace lehkosti, ochrany a odolnosti se zesílenými oblastmi chránícími ruce před oděrem při zachování citlivosti na lano.",
    specs: {
      weight: "48 g",
      sizes: "XS–XL",
      materials: {
        palm: "50% polyamid, 50% polyuretan",
        back: "98% polyamid, 2% elastan",
        cuff: "100% polyamid",
      },
      articleNumber: "05604",
    },
    images: [
      `${OCUN_BASE}/assets/products/1_700x700/84s1pv70ym.05604-Cima-gloves-VF-I.jpg`,
      `${OCUN_BASE}/assets/products/1_700x700/6mar3kpm28.05604-Cima-gloves-VF-II.jpg`,
      `${OCUN_BASE}/assets/products/1_700x700/bh8ub64ywh.05604-Cima-gloves-VF-III.jpg`,
    ],
    sourceUrl: `${OCUN_BASE}/cs/product/cima-gloves`,
  },
  {
    slug: "ocun-captur",
    name: "Captur",
    brand: "OCÚN",
    sport: "ferraty",
    category: "tlumic-padu",
    description:
      "Tlumič pádu pro via ferraty navržený s důrazem na bezpečnost, odolnost a spolehlivý výkon. Robustní konstrukce a osvědčené karabiny zajišťují jistotu na zajištěných cestách i při dlouhodobém používání.",
    specs: {
      weight: "550 g",
      longitudinalStrength: "30 kN",
      transverseStrength: "8 kN",
      openGateStrength: "8 kN",
      elasticArmExtension: "50–100 cm",
      certifications: ["EN 958:2024", "EN 12275", "UIAA 121", "CE"],
      articleNumber: "05633",
    },
    images: [
      `${OCUN_BASE}/assets/products/1_700x700/46g3nziawu.05633-Capture.jpg`,
    ],
    sourceUrl: `${OCUN_BASE}/cs/product/captur`,
  },
  {
    slug: "ocun-captur-lite",
    name: "Captur Lite",
    brand: "OCÚN",
    sport: "ferraty",
    category: "tlumic-padu",
    description:
      "Tlumič pádu pro via ferraty s důrazem na nízkou hmotnost, jednoduché ovládání a odolnost. Elastické ramena zajišťují plynulý postup a lehké, extrémně pevné karabiny spolehlivost i při zatížení přes hranu.",
    specs: {
      weight: "430 g",
      longitudinalStrength: "33 kN",
      transverseStrength: "7 kN",
      openGateStrength: "11 kN",
      edgeLoadingStrength: "10 kN",
      elasticArmExtension: "50–100 cm",
      certifications: ["EN 12275", "UIAA 121", "CE", "EN 958:2024"],
      articleNumber: "05626",
    },
    images: [
      `${OCUN_BASE}/assets/products/1_700x700/9cq8smx96a.05626-Capture-Lite.jpg`,
    ],
    sourceUrl: `${OCUN_BASE}/cs/product/captur-lite`,
  },
  {
    slug: "ocun-captur-lite-swivel",
    name: "Captur Lite Swivel",
    brand: "OCÚN",
    sport: "ferraty",
    category: "tlumic-padu",
    description:
      "Tlumič pádu pro via ferraty s otočným prvkem (swivel), který zabraňuje kroucení elastických ramen. Lehké a výjimečně pevné karabiny zajišťují spolehlivost i v náročných situacích.",
    specs: {
      weight: "500 g",
      longitudinalStrength: "33 kN",
      transverseStrength: "7 kN",
      openGateStrength: "11 kN",
      edgeLoadingStrength: "10 kN",
      elasticArmExtension: "50–100 cm",
      certifications: [
        "EN 12275",
        "UIAA 121",
        "EN 958:2024",
        "UIAA 128",
        "CE",
      ],
      articleNumber: "05627",
    },
    images: [
      `${OCUN_BASE}/assets/products/1_700x700/ryonhei3s5.05627-Capture-Lite-Swivel.jpg`,
    ],
    sourceUrl: `${OCUN_BASE}/cs/product/captur-lite-swivel`,
  },
  {
    slug: "ocun-vf-twist-tech-eco-captur-lite-swivel-set",
    name: "Via Ferrata Twist Tech Eco Captur Lite Swivel Set",
    brand: "OCÚN",
    sport: "ferraty",
    category: "set",
    description:
      "Via ferratový set obsahující úvazek Twist Tech Eco a tlumič pádu Captur Lite Swivel. Ekologická volba s udržitelnými materiály pro bezpečný pohyb na ferratách.",
    specs: {
      sizes: "XS-M, M-L, L-XL",
      certifications: [
        "UIAA 105",
        "EN 12275",
        "UIAA 121",
        "CE",
        "EN 958",
        "EN 12277+A1",
      ],
      includes: ["Twist Tech Eco úvazek", "Captur Lite Swivel tlumič pádu"],
      sustainable: true,
      articleNumber: "05628",
    },
    images: [
      `${OCUN_BASE}/assets/products/1_700x700/xvginyw9kx.05628-VF-TIST-TECH-ECO-CAPTURE-LITE-SWIVEL-SET.jpg`,
      `${OCUN_BASE}/assets/products/1_700x700/reylmxytaf.05264-Twist-Tech-ECO-1.jpg`,
      `${OCUN_BASE}/assets/products/1_700x700/qps5ooh33a.05264-Twist-Tech-ECO-2.jpg`,
      `${OCUN_BASE}/assets/products/1_700x700/ei8h7mvv0t.05627-Capture-Lite-Swivel.jpg`,
    ],
    sourceUrl: `${OCUN_BASE}/cs/product/via-ferrata-twist-tech-eco-captur-lite-swivel-set`,
  },
  {
    slug: "ocun-vf-twist-tech-eco-captur-lite-swivel-shard-set",
    name: "Via Ferrata Twist Tech Eco Captur Lite Swivel Shard Set",
    brand: "OCÚN",
    sport: "ferraty",
    category: "set",
    description:
      "Kompletní via ferratový set s úvazkem Twist Tech Eco, tlumičem pádu Captur Lite Swivel a přilbou Shard. Vše co potřebujete pro bezpečný výstup na ferratě v jednom balení.",
    specs: {
      sizes: "XS-M, M-L, L-XL",
      certifications: [
        "UIAA 105",
        "EN 12275",
        "UIAA 121",
        "CE",
        "EN 958",
        "EN 12277+A1",
        "EN 12492",
      ],
      includes: [
        "Twist Tech Eco úvazek",
        "Captur Lite Swivel tlumič pádu",
        "Shard přilba",
      ],
      articleNumber: "05629",
    },
    images: [
      `${OCUN_BASE}/assets/products/1_700x700/omftap4pea.05629-VF-TIST-TECH-ECO-CAPTURE-LITE-SWIVEL-SHARD-SET.jpg`,
    ],
    sourceUrl: `${OCUN_BASE}/cs/product/via-ferrata-twist-tech-eco-captur-lite-swivel-shard-set`,
  },
  {
    slug: "ocun-vf-twist-chest-set",
    name: "Via Ferrata Twist + Chest Set",
    brand: "OCÚN",
    sport: "ferraty",
    category: "set",
    description:
      "Ferratový set s úvazkem Twist, hrudním úvazkem a tlumičem pádu Captur. Hrudní úvazek zvyšuje bezpečnost a pohodlí při vertikálním postupu na ferratách.",
    specs: {
      includes: ["Twist úvazek", "Chest hrudní úvazek", "Captur tlumič pádu"],
      articleNumber: "05043",
    },
    images: [
      `${OCUN_BASE}/assets/products/1_700x700/j7msruhz86.05043-VF-Twist-Chest-set.jpg`,
    ],
    sourceUrl: `${OCUN_BASE}/cs/product/via-ferrata-twist-chest-set4`,
  },
  {
    slug: "ocun-vf-twist-chest-shard-set",
    name: "Via Ferrata Twist + Chest Shard Set",
    brand: "OCÚN",
    sport: "ferraty",
    category: "set",
    description:
      "Kompletní ferratový set s úvazkem Twist, hrudním úvazkem, tlumičem pádu Captur a přilbou Shard. Kompletní řešení pro začátečníky i pokročilé feratisty.",
    specs: {
      includes: [
        "Twist úvazek",
        "Chest hrudní úvazek",
        "Captur tlumič pádu",
        "Shard přilba",
      ],
      articleNumber: "05347",
    },
    images: [
      `${OCUN_BASE}/assets/products/1_700x700/jvdk0k6414.05347-VF-TWIST-CHEST-SHARD-SET.jpg`,
    ],
    sourceUrl: `${OCUN_BASE}/cs/product/via-ferrata-twist-chest-shard-set`,
  },
  {
    slug: "ocun-vf-twist-set",
    name: "Via Ferrata Twist Set",
    brand: "OCÚN",
    sport: "ferraty",
    category: "set",
    description:
      "Ferratový set s úvazkem Twist a tlumičem pádu Captur. Základní sestava pro bezpečný pohyb na zajištěných cestách.",
    specs: {
      includes: ["Twist úvazek", "Captur tlumič pádu"],
      articleNumber: "04343",
    },
    images: [
      `${OCUN_BASE}/assets/products/1_700x700/fwotfgsc1t.04343-VF-TWIST-SET.jpg`,
    ],
    sourceUrl: `${OCUN_BASE}/cs/product/via-ferrata-twist-set`,
  },
  {
    slug: "ocun-vf-twist-shard-set",
    name: "Via Ferrata Twist Shard Set",
    brand: "OCÚN",
    sport: "ferraty",
    category: "set",
    description:
      "Ferratový set s úvazkem Twist, tlumičem pádu Captur a přilbou Shard. Kompletní vybavení pro ferraty v jednom balení.",
    specs: {
      includes: ["Twist úvazek", "Captur tlumič pádu", "Shard přilba"],
      articleNumber: "05348",
    },
    images: [
      `${OCUN_BASE}/assets/products/1_700x700/19cy511t9n.05348-VF-TWIST-SHARD-SET.jpg`,
    ],
    sourceUrl: `${OCUN_BASE}/cs/product/via-ferrata-twist-shard-set`,
  },
  {
    slug: "ocun-tie-in-sling-pa-20mm",
    name: "TIE-IN SLING PA 20 mm 41 cm",
    brand: "OCÚN",
    sport: "ferraty",
    category: "prislusenstvi",
    description:
      "Nejbezpečnější spojení mezi sedacím a hrudním úvazkem. Polyamidová smyčka šířky 20 mm a délky 41 cm pro spolehlivé propojení úvazků na ferratách.",
    specs: {
      width: "20 mm",
      length: "41 cm",
      material: "polyamid",
      articleNumber: "04600",
    },
    images: [
      `${OCUN_BASE}/assets/products/1_700x700/5re4rv6ip2.04600-TIE-IN-SLING-PA-20-green.jpg`,
    ],
    sourceUrl: `${OCUN_BASE}/cs/product/tie-in-sling-pa-20-mm-41-cm`,
  },
  {
    slug: "ocun-shard",
    name: "Shard",
    brand: "OCÚN",
    sport: "ferraty",
    category: "prilba",
    description:
      "Přilba pro horolezectví, alpinismus a ferraty. Tři klipy pro uchycení čelovky, velké ventilační otvory pro optimální cirkulaci vzduchu a vyměnitelná výstelka.",
    specs: {
      weight: "335 g",
      sizeRange: "54–62 cm",
      certifications: ["EN 12492", "UIAA 106"],
      colors: ["Green Mint", "Petrol Mediterranea", "White", "Yellow"],
      articleNumber: "05301",
    },
    images: [
      `${OCUN_BASE}/assets/products/1_700x700/vdsz9yu3y3.05301-SHARD-Green-Mint-01.jpg`,
    ],
    sourceUrl: `${OCUN_BASE}/cs/product/shard`,
  },
];

async function main() {
  console.log(`Seeding ${products.length} OCÚN via-ferrata products...`);

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        specs: p.specs,
        images: p.images,
        sourceUrl: p.sourceUrl,
      },
      create: p,
    });
    console.log(`  ✓ ${p.name}`);
  }

  const count = await prisma.product.count();
  console.log(`\nDone. Total products in DB: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

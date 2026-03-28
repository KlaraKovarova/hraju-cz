import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const SR_BASE = "https://www.singingrock.cz";
const IMG = (path: string) => `${SR_BASE}/data/katalog/big/${path}`;

const products = [
  {
    slug: "singing-rock-packet-ferrata-ray",
    name: "Packet Ferrata Ray",
    brand: "Singing Rock",
    sport: "ferraty",
    category: "set",
    description:
      "Startovací sada pro ty, kteří chtějí ušetřit a získat pohodlné vybavení na via ferraty. Obsahuje univerzální tříbodový sedací úvazek RAY a tlumič pádu PHARIO PALM s indikátorem pádu a karabinami Palm Keylock.",
    specs: {
      articleNumber: "M0035MX",
      includes: ["RAY sedací úvazek", "PHARIO PALM tlumič pádu s karabinami"],
      certifications: ["EN 958", "EN 12277", "CE"],
      note: "Přilba a hrudní úvazek nejsou součástí setu, ale jsou doporučeny.",
    },
    images: [
      IMG("M00/M0035MX.jpg"),
      IMG("C50/C5087MX0.jpg"),
      IMG("C23/C2317YB00-2.jpg"),
    ],
    sourceUrl: `${SR_BASE}/packet-ferrata-ray`,
  },
  {
    slug: "singing-rock-packet-ferrata-top",
    name: "Packet Ferrata Top",
    brand: "Singing Rock",
    sport: "ferraty",
    category: "set",
    description:
      "Set obsahující základní vybavení na via ferraty. Zahrnuje lehký tříbodový úvazek TOP v univerzální velikosti a tlumič pádu PHARIO PALM s indikátorem pádu a karabinami Palm Keylock. Barevně odlišené jistící oko a přezky Rock&Lock na nohavicích i pase.",
    specs: {
      articleNumber: "M0033XX00",
      includes: [
        "TOP sedací úvazek (univerzální velikost)",
        "PHARIO PALM tlumič pádu s karabinami",
      ],
      features: [
        "Barevně odlišené jistící oko",
        "Rock&Lock přezky (pás i nohavice)",
        "Indikátor pádu (nutná výměna po aktivaci)",
      ],
      certifications: ["EN 958", "EN 12277", "CE"],
      note: "Přilba a hrudní úvazek nejsou součástí setu, ale jsou doporučeny.",
    },
    images: [IMG("M00/M0033XX.jpg")],
    sourceUrl: `${SR_BASE}/packet-ferrata-top`,
  },
  {
    slug: "singing-rock-packet-ferrata",
    name: "Packet Ferrata",
    brand: "Singing Rock",
    sport: "ferraty",
    category: "set",
    description:
      "Set obsahující základní vybavení na via ferraty včetně přilby. Zahrnuje lehký úvazek TOP, tlumič pádu PHARIO PALM s indikátorem pádu a karabinami Palm Keylock a plně ventilovanou přilbu HEX. Kompletní řešení pro začátečníky i pokročilé.",
    specs: {
      articleNumber: "M0032XX",
      sizes: "M, L (velikost přilby HEX)",
      includes: [
        "TOP sedací úvazek (univerzální velikost)",
        "PHARIO PALM tlumič pádu s karabinami",
        "HEX přilba",
      ],
      features: [
        "Barevně odlišené jistící oko",
        "Rock&Lock přezky (pás i nohavice)",
        "Indikátor pádu (nutná výměna po aktivaci)",
        "Plně ventilovaná přilba",
      ],
      certifications: ["EN 958", "EN 12277", "EN 12492", "CE"],
      note: "Hrudní úvazek není součástí setu, ale na via ferraty je velmi doporučen.",
    },
    images: [
      IMG("M00/M0032XX.jpg"),
      IMG("C23/C2317YB00-2.jpg"),
      IMG("C00/C0900YX0.jpg"),
    ],
    sourceUrl: `${SR_BASE}/packet-ferrata`,
  },
  {
    slug: "singing-rock-packet-ferrata-exp-ii",
    name: "Packet Ferrata Exp II",
    brand: "Singing Rock",
    sport: "ferraty",
    category: "set",
    description:
      "Ucelená sada s kompletním vybavením pro via ferraty. Obsahuje nastavitelný sedací úvazek TOP RENTAL, hrudní úvazek ALADIN pro optimální polohu těla, plně ventilovanou přilbu HEX, tlumič pádu PHARIO PALM a 2m popruh pro spojení úvazků. Nejkompletnější ferratový set od Singing Rock.",
    specs: {
      articleNumber: "M0031",
      sizes: "XS–M (přilba M), L–XXL (přilba L)",
      includes: [
        "TOP RENTAL sedací úvazek (3 přezky)",
        "ALADIN hrudní úvazek",
        "HEX přilba",
        "PHARIO PALM tlumič pádu s karabinami",
        "2m popruh pro spojení úvazků",
      ],
      certifications: ["EN 958", "EN 12277", "EN 12492", "EN 361", "CE"],
    },
    images: [IMG("M00/M0031XX.jpg"), IMG("M00/M0031XX-02.jpg")],
    sourceUrl: `${SR_BASE}/packet-ferrata-exp-ii`,
  },
];

async function main() {
  console.log(`Seeding ${products.length} Singing Rock via-ferrata products...`);

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
    console.log(`  + ${p.name}`);
  }

  const count = await prisma.product.count();
  console.log(`\nDone. Total products in DB: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

/**
 * Seed medfeet.cz / Joma banner ads into the database
 * SIL-471: Deploy banner for medfeet partner
 *
 * Usage: npx tsx scripts/seed-banners.ts
 */

import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const BANNERS = [
  {
    name: "Joma — sidebar 300x250",
    imageUrl: "/images/ads/joma-sidebar-300x250.jpg",
    targetUrl: "https://www.medfeet.cz/joma/",
    placement: ["detail_sidebar"],
    sportFilter: [],
    isActive: true,
  },
  {
    name: "Joma — leaderboard 728x90",
    imageUrl: "/images/ads/joma-leaderboard-728x90.jpg",
    targetUrl: "https://www.medfeet.cz/joma/",
    placement: ["listing_inline"],
    sportFilter: [],
    isActive: true,
  },
];

async function main() {
  for (const banner of BANNERS) {
    const existing = await prisma.banner.findFirst({
      where: { name: banner.name },
    });

    if (existing) {
      console.log(`Already exists: ${banner.name} (id: ${existing.id})`);
      continue;
    }

    const created = await prisma.banner.create({ data: banner });
    console.log(`Created: ${created.name} (id: ${created.id})`);
  }

  const count = await prisma.banner.count({ where: { isActive: true } });
  console.log(`\nTotal active banners: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

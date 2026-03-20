import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const counts = (await prisma.$queryRaw`
    SELECT s.slug as sport, COUNT(*)::int as count
    FROM "Facility" f
    JOIN "FacilitySport" fs ON f.id = fs."facilityId"
    JOIN "Sport" s ON fs."sportId" = s.id
    WHERE f."isActive" = true
    GROUP BY s.slug
    ORDER BY count DESC
  `) as { sport: string; count: number }[];

  console.log("Active facilities by sport (AFTER cleanup):");
  console.table(counts);

  const total = await prisma.facility.count({ where: { isActive: true } });
  const inactive = await prisma.facility.count({ where: { isActive: false } });
  console.log("Total active:", total, "| Total inactive:", inactive);
}
main().then(() => prisma.$disconnect());

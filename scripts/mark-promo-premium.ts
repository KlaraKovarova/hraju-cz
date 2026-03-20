import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Get all sport slugs (excluding bowling which is hidden)
  const sports = await prisma.sport.findMany({
    where: { slug: { not: "bowling" } },
    select: { id: true, slug: true, name: true },
  });

  const allUpdated: { sport: string; facilityId: string; name: string }[] = [];

  for (const sport of sports) {
    // Pick top 10 facilities per sport:
    // Prefer facilities with reviews, ratings, description, and website
    // Exclude already premium (e.g. Souladronka)
    const candidates = await prisma.facility.findMany({
      where: {
        isActive: true,
        isPremium: false,
        sports: { some: { sportId: sport.id } },
      },
      orderBy: [{ reviewCount: "desc" }, { averageRating: "desc" }],
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        reviewCount: true,
        averageRating: true,
        description: true,
      },
    });

    const limit = sport.slug === "padel" ? Math.min(candidates.length, 10) : 10;
    const picked = candidates.slice(0, limit);

    console.log(
      `\n=== ${sport.slug.toUpperCase()} (${picked.length} selected) ===`
    );
    for (const f of picked) {
      console.log(
        `  ${f.name} (${f.slug}) — reviews: ${f.reviewCount}, rating: ${f.averageRating || "-"}`
      );
      allUpdated.push({ sport: sport.slug, facilityId: f.id, name: f.name });
    }

    // Mark them as promo premium
    if (picked.length > 0) {
      const ids = picked.map((f) => f.id);
      await prisma.facility.updateMany({
        where: { id: { in: ids } },
        data: { isPremium: true, isPromo: true },
      });
      console.log(`  ✓ Marked ${picked.length} as promo premium`);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total promo premium listings: ${allUpdated.length}`);
  console.log(
    `Sports covered: ${[...new Set(allUpdated.map((u) => u.sport))].join(", ")}`
  );

  // Verify Souladronka is still permanent premium (not promo)
  const souladronka = await prisma.facility.findUnique({
    where: { id: "RsIKn5UZsLAN6ISX" },
    select: { name: true, isPremium: true, isPromo: true },
  });
  console.log(
    `\nSouladronka: isPremium=${souladronka?.isPremium}, isPromo=${souladronka?.isPromo}`
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

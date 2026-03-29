/**
 * Enrich facilities with additional sport tags based on name analysis.
 *
 * Usage:
 *   npx tsx scripts/enrich-multi-sport.ts          # dry run
 *   npx tsx scripts/enrich-multi-sport.ts --apply   # apply changes
 */
import { prisma } from "../src/lib/prisma";

const DRY_RUN = !process.argv.includes("--apply");

// Sport detection config: keywords to match, patterns to exclude
const ACTIVE_SPORTS: Record<string, { keywords: string[]; exclude?: string[] }> = {
  tenis: { keywords: ["tenis", "tennis", "tenisov"], exclude: ["stolní tenis", "stolniho tenis", "stolního tenis", "table tennis"] },
  squash: { keywords: ["squash"] },
  badminton: { keywords: ["badminton"] },
  plavani: { keywords: ["plavec", "plavání", "koupališ", "bazén"], exclude: ["splavu", "splavy"] },
  fitness: { keywords: ["fitness", "posilovna"] },
  lezeni: { keywords: ["lezení", "lezecká", "lezeck", "boulder"] },
  ferraty: { keywords: ["ferrata", "ferraty"] },
};

const VISIBLE_SPORTS = new Set(Object.keys(ACTIVE_SPORTS));

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== APPLYING CHANGES ===");

  // Load sport IDs from DB
  const sports = await prisma.sport.findMany();
  const sportIdBySlug = new Map(sports.map(s => [s.slug, s.id]));

  const facilities = await prisma.facility.findMany({
    where: { isActive: true },
    include: { sports: { include: { sport: true } } },
  });

  let enriched = 0;
  let tagsAdded = 0;

  for (const f of facilities) {
    const currentSports = new Set(f.sports.map(s => s.sport.slug));
    const hasVisibleSport = [...currentSports].some(s => VISIBLE_SPORTS.has(s));
    if (!hasVisibleSport) continue;

    const nameLower = f.name.toLowerCase();
    const detected = new Set<string>();

    for (const [sport, config] of Object.entries(ACTIVE_SPORTS)) {
      if (config.exclude?.some(ex => nameLower.includes(ex.toLowerCase()))) continue;
      for (const kw of config.keywords) {
        if (nameLower.includes(kw.toLowerCase())) {
          detected.add(sport);
          break;
        }
      }
    }

    const missing = [...detected].filter(s => !currentSports.has(s));
    if (missing.length === 0) continue;

    enriched++;
    tagsAdded += missing.length;
    console.log(`${f.name} | +${missing.join(", +")}`);

    if (!DRY_RUN) {
      for (const sportSlug of missing) {
        const sportId = sportIdBySlug.get(sportSlug);
        if (!sportId) {
          console.log(`  SKIP: sport "${sportSlug}" not found in DB`);
          continue;
        }
        await prisma.facilitySport.create({
          data: { facilityId: f.id, sportId },
        });
      }
    }
  }

  console.log(`\n${enriched} facilities enriched, ${tagsAdded} tags added${DRY_RUN ? " (dry run)" : ""}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });

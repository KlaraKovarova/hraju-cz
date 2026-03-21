import { prisma } from "../src/lib/prisma";

// Only active (visible) sports — with word boundary awareness
const ACTIVE_SPORTS: Record<string, { keywords: string[]; exclude?: string[] }> = {
  tenis: { keywords: ["tenis", "tennis", "tenisov"], exclude: ["stolní tenis", "stolniho tenis", "stolního tenis", "table tennis"] },
  squash: { keywords: ["squash"] },
  badminton: { keywords: ["badminton"] },
  volejbal: { keywords: ["volejbal", "volleyball", "volejbalový"] },
  plavani: { keywords: ["plavec", "plavání", "koupališ", "bazén"], exclude: ["splavu", "splavy"] },
  golf: { keywords: ["golf"], exclude: ["minigolf"] },
  fitness: { keywords: ["fitness", "posilovna"] },
  lezeni: { keywords: ["lezení", "lezecká", "lezeck", "boulder"] },
  ferraty: { keywords: ["ferrata", "ferraty"] },
};

// Only enrich facilities that are already in visible sports
const VISIBLE_SPORTS = new Set(["tenis", "squash", "badminton", "volejbal", "plavani", "golf", "fitness", "lezeni", "ferraty"]);

async function main() {
  const facilities = await prisma.facility.findMany({
    where: { isActive: true },
    include: { sports: { include: { sport: true } } },
  });

  const byAction: {
    name: string;
    id: string;
    current: string[];
    add: string[];
  }[] = [];

  for (const f of facilities) {
    const currentSports = new Set(f.sports.map((s) => s.sport.slug));

    // Skip facilities not in any visible sport
    const hasVisibleSport = [...currentSports].some(s => VISIBLE_SPORTS.has(s));
    if (!hasVisibleSport) continue;

    const nameLower = f.name.toLowerCase();
    const detected = new Set<string>();

    for (const [sport, config] of Object.entries(ACTIVE_SPORTS)) {
      // Check exclude patterns first
      if (config.exclude?.some(ex => nameLower.includes(ex.toLowerCase()))) continue;

      for (const kw of config.keywords) {
        if (nameLower.includes(kw.toLowerCase())) {
          detected.add(sport);
          break;
        }
      }
    }

    const missing = [...detected].filter((s) => {
      return !currentSports.has(s);
    });
    if (missing.length > 0) {
      byAction.push({
        name: f.name,
        id: f.id,
        current: [...currentSports],
        add: missing,
      });
    }
  }

  console.log(
    "Total candidates for enrichment (active sports only):",
    byAction.length,
  );

  // Group by sport to add
  const bySport: Record<string, number> = {};
  for (const c of byAction) {
    for (const s of c.add) {
      bySport[s] = (bySport[s] || 0) + 1;
    }
  }
  console.log("\n=== Breakdown by sport to add ===");
  for (const [sport, count] of Object.entries(bySport).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(sport + ": " + count + " facilities");
  }

  console.log("\n=== All candidates ===");
  byAction.forEach((c) =>
    console.log(
      c.name + " | has: " + c.current.join(",") + " | add: " + c.add.join(","),
    ),
  );
}

main().then(() => prisma.$disconnect());

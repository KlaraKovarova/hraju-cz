// Seed WC 2026 matches and initial (empty) standings into DB.
// Run: tsx scripts/seed-wc2026.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { WC2026_MATCHES, WC2026_GROUPS } from "../src/lib/wc2026-data";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding WC 2026 matches…");

  for (const match of WC2026_MATCHES) {
    await prisma.wc2026Match.upsert({
      where: { matchId: match.id },
      create: {
        matchId: match.id,
        group: match.group,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        kickoffUtc: new Date(match.kickoffUtc),
        venue: match.venue,
        city: match.city,
      },
      update: {
        kickoffUtc: new Date(match.kickoffUtc),
        venue: match.venue,
        city: match.city,
      },
    });
  }

  console.log(`Upserted ${WC2026_MATCHES.length} matches.`);

  console.log("Seeding WC 2026 standings…");
  let standingsCount = 0;
  for (const group of WC2026_GROUPS) {
    for (const team of group.teams) {
      await prisma.wc2026Standing.upsert({
        where: { group_team: { group: group.letter, team: team.name } },
        create: { group: group.letter, team: team.name },
        update: {},
      });
      standingsCount++;
    }
  }

  console.log(`Upserted ${standingsCount} standing rows.`);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

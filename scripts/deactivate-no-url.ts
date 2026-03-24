/**
 * SIL-455: Deactivate all active facilities that have no website URL.
 * Exception: ferraty facilities are kept active regardless.
 *
 * Usage: npx tsx scripts/deactivate-no-url.ts
 * Add --dry-run to preview without making changes.
 */
import * as dotenv from "dotenv";
dotenv.config();

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connStr) throw new Error("DATABASE_URL / DIRECT_URL not set");
console.log("Connecting to:", connStr.replace(/:[^:@]+@/, ":***@"));

const adapter = new PrismaNeon({ connectionString: connStr });
const prisma = new PrismaClient({ adapter });

const dryRun = process.argv.includes("--dry-run");

async function main() {
  // Count totals first
  const totalActive = await prisma.facility.count({ where: { isActive: true } });
  console.log(`Total active facilities: ${totalActive}`);

  // Find facilities to deactivate: no website, not ferraty
  const toDeactivate = await prisma.facility.findMany({
    where: {
      isActive: true,
      website: null,
      NOT: { sports: { some: { sport: { slug: "ferraty" } } } },
    },
    include: {
      sports: { include: { sport: { select: { slug: true, nameCs: true } } } },
      location: { select: { city: true } },
    },
    orderBy: { name: "asc" },
  });

  console.log(`\nFacilities to deactivate (no URL, not ferraty): ${toDeactivate.length}`);

  // Show ferraty that would be exempt
  const ferratyExempt = await prisma.facility.count({
    where: {
      isActive: true,
      website: null,
      sports: { some: { sport: { slug: "ferraty" } } },
    },
  });
  console.log(`Ferraty exempt (no URL but kept active): ${ferratyExempt}`);

  if (toDeactivate.length === 0) {
    console.log("Nothing to deactivate.");
    return;
  }

  // List first 20 for visibility
  console.log("\nSample (first 20):");
  for (const f of toDeactivate.slice(0, 20)) {
    const sports = f.sports.map((s) => s.sport.slug).join(", ");
    console.log(`  - ${f.name} (${f.location.city}) [${sports}]`);
  }
  if (toDeactivate.length > 20) {
    console.log(`  ... and ${toDeactivate.length - 20} more`);
  }

  if (dryRun) {
    console.log("\n[DRY RUN] No changes made.");
    return;
  }

  // Execute deactivation
  const ids = toDeactivate.map((f) => f.id);
  const result = await prisma.facility.updateMany({
    where: { id: { in: ids } },
    data: { isActive: false },
  });

  console.log(`\nDeactivated ${result.count} facilities.`);
  console.log(`Remaining active: ${totalActive - result.count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

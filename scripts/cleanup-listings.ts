/**
 * SIL-283: Deactivate irrelevant listings.
 *
 * Strategy:
 * 1. For bowling & stolni-tenis (imported with loose matching from firmy.cz),
 *    deactivate entries whose name+description never mention the sport.
 * 2. Across ALL sports, deactivate pure shops/manufacturers/non-facilities.
 * 3. Log everything for audit.
 *
 * DRY RUN by default — pass --execute to actually deactivate.
 */

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const EXECUTE = process.argv.includes("--execute");

// --- Sport mention patterns (handles Czech declension) ---

// Bowling: bowling, kuželk*, kuželn*
const BOWLING_RE =
  /bowling|ku[zž]elk|ku[zž]eln|bowlingov|kugelb/i;

// Stolní tenis: stolní/ho/m/mu/ch tenis*, ping*pong*
const STOLNI_TENIS_RE =
  /stoln[ií]\w*\s*tenis|ping[\s-]?pong|pingpong/i;

// --- Non-facility patterns (deactivate across ALL sports) ---
const NON_FACILITY_NAME_RE =
  /obecn[ií]\s+[uú][rř]ad|m[eě]stsk[yý]\s+[uú][rř]ad|mate[rř]sk[aá]\s+[sš]kol/i;

// Pure shops / manufacturers / distributors
const PURE_SHOP_RE =
  /\b(internetov[yý]|on-?line)\s+(prodej|obchod)|^prodej\s|^e[\s-]?shop\b|velkoobchod\b|maloobchod\b|dovozce\b|distribut\b|v[yý]robce\b/i;

// Additional shop signal: description starts with "Prodej " or "Internetový prodej"
const SHOP_DESC_START_RE =
  /^(prodej |internetov|online prodej|nabízíme\s+(on-?line\s+)?prodej)/i;

// Facility keywords — if present, override shop classification
const FACILITY_OVERRIDE_RE =
  /\b(kurt[yůu]?|h[rř]i[sš]t[eěí]|hal[auyeě]|baz[eé]n|posilovn|gym|fitness\s+centr|stadion|dr[aá]h[ay]|ku[zž]eln[auyeě]|lezeck|bowling|squash\s+centr|sportovn[ií]\s+(hal|centr|are[aá]l)|t[eě]locvi[cč]n|sportovi[sš]t|badmintonov|tenisov[eéaá]?\s+(hal|kurt)|volejbalov|plovárn|koupali[sš]t)\b/i;

interface DeactivateCandidate {
  id: string;
  name: string;
  sport: string;
  reason: string;
}

async function main() {
  const candidates: DeactivateCandidate[] = [];

  // ========== 1. Bowling without bowling mention ==========
  const bowlingFacilities = await prisma.facility.findMany({
    where: {
      isActive: true,
      sports: { some: { sport: { slug: "bowling" } } },
    },
    select: {
      id: true,
      name: true,
      description: true,
      sports: { select: { sport: { select: { slug: true } } } },
    },
  });

  for (const f of bowlingFacilities) {
    const text = `${f.name} ${f.description || ""}`;
    if (!BOWLING_RE.test(text)) {
      // Only deactivate if bowling is the ONLY sport (otherwise just wrong tag)
      const otherSports = f.sports
        .map((s) => s.sport.slug)
        .filter((s) => s !== "bowling");
      if (otherSports.length === 0) {
        candidates.push({
          id: f.id,
          name: f.name,
          sport: "bowling",
          reason: "no-bowling-mention",
        });
      }
    }
  }

  // ========== 2. Stolní tenis without stolní tenis mention ==========
  const stFacilities = await prisma.facility.findMany({
    where: {
      isActive: true,
      sports: { some: { sport: { slug: "stolni-tenis" } } },
    },
    select: {
      id: true,
      name: true,
      description: true,
      sports: { select: { sport: { select: { slug: true } } } },
    },
  });

  for (const f of stFacilities) {
    const text = `${f.name} ${f.description || ""}`;
    if (!STOLNI_TENIS_RE.test(text)) {
      const otherSports = f.sports
        .map((s) => s.sport.slug)
        .filter((s) => s !== "stolni-tenis");
      if (otherSports.length === 0) {
        candidates.push({
          id: f.id,
          name: f.name,
          sport: "stolni-tenis",
          reason: "no-stolni-tenis-mention",
        });
      }
    }
  }

  // ========== 3. Pure shops / manufacturers across ALL sports ==========
  const allFacilities = await prisma.facility.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      sports: { select: { sport: { select: { slug: true } } } },
    },
  });

  for (const f of allFacilities) {
    // Skip if already a candidate
    if (candidates.some((c) => c.id === f.id)) continue;

    const text = `${f.name} ${f.description || ""}`;
    const desc = f.description || "";
    const sport = f.sports.map((s) => s.sport.slug).join(",");

    // Pure shop detection
    if (
      (PURE_SHOP_RE.test(text) || SHOP_DESC_START_RE.test(desc)) &&
      !FACILITY_OVERRIDE_RE.test(text)
    ) {
      candidates.push({
        id: f.id,
        name: f.name,
        sport,
        reason: "shop-or-manufacturer",
      });
      continue;
    }

    // Non-facility (municipal office, kindergarten)
    if (NON_FACILITY_NAME_RE.test(f.name) && !FACILITY_OVERRIDE_RE.test(text)) {
      candidates.push({
        id: f.id,
        name: f.name,
        sport,
        reason: "non-facility",
      });
    }
  }

  // ========== Summary ==========
  const byReason = new Map<string, number>();
  for (const c of candidates) {
    byReason.set(c.reason, (byReason.get(c.reason) || 0) + 1);
  }

  console.log("\n=== DEACTIVATION SUMMARY ===");
  console.log(`Total candidates: ${candidates.length}`);
  for (const [reason, count] of byReason) {
    console.log(`  ${reason}: ${count}`);
  }

  // Print all candidates
  console.log("\n=== ALL CANDIDATES ===");
  for (const c of candidates) {
    console.log(`[${c.reason}] [${c.sport}] ${c.name}`);
  }

  // ========== Execute ==========
  if (EXECUTE) {
    console.log("\n=== EXECUTING DEACTIVATION ===");
    const ids = candidates.map((c) => c.id);
    const result = await prisma.facility.updateMany({
      where: { id: { in: ids } },
      data: { isActive: false },
    });
    console.log(`Deactivated ${result.count} facilities.`);
  } else {
    console.log("\n⚠️  DRY RUN — pass --execute to deactivate");
  }
}

main().then(() => prisma.$disconnect());

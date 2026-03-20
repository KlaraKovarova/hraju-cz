import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Get all sports
  const sports = await prisma.sport.findMany({
    select: { id: true, slug: true, name: true },
  });
  console.log("=== ALL SPORTS IN DB ===");
  console.table(
    sports.map((s) => ({ slug: s.slug, name: s.name }))
  );

  // For bowling: find facilities that do NOT mention bowling/kuzelky
  const bowlingFacilities = await prisma.facility.findMany({
    where: {
      isActive: true,
      sports: { some: { sport: { slug: "bowling" } } },
    },
    select: { id: true, name: true, description: true },
  });

  let bowlingNoMention = 0;
  let bowlingHasMention = 0;
  const bowlingExamples: string[] = [];

  for (const f of bowlingFacilities) {
    const text = `${f.name} ${f.description || ""}`.toLowerCase();
    const mentionsBowling = /bowling|ku[zž]elk|ku[zž]eln|kugelb/i.test(text);
    if (mentionsBowling) {
      bowlingHasMention++;
    } else {
      bowlingNoMention++;
      if (bowlingExamples.length < 10) {
        bowlingExamples.push(
          `${f.name}: ${(f.description || "").substring(0, 80)}`
        );
      }
    }
  }

  console.log(
    `\n=== BOWLING: ${bowlingHasMention} mention bowling, ${bowlingNoMention} do NOT mention bowling ===`
  );
  console.log("Examples that don't mention bowling:");
  bowlingExamples.forEach((e) => console.log(`  ${e}`));

  // Similarly for stolni-tenis
  const stFacilities = await prisma.facility.findMany({
    where: {
      isActive: true,
      sports: { some: { sport: { slug: "stolni-tenis" } } },
    },
    select: { id: true, name: true, description: true },
  });

  let stNoMention = 0;
  let stHasMention = 0;
  const stExamples: string[] = [];

  for (const f of stFacilities) {
    const text = `${f.name} ${f.description || ""}`.toLowerCase();
    const mentions = /stoln[ií]\s*tenis|ping\s*pong|pingpong/i.test(text);
    if (mentions) {
      stHasMention++;
    } else {
      stNoMention++;
      if (stExamples.length < 10) {
        stExamples.push(
          `${f.name}: ${(f.description || "").substring(0, 80)}`
        );
      }
    }
  }

  console.log(
    `\n=== STOLNI-TENIS: ${stHasMention} mention, ${stNoMention} do NOT ===`
  );
  console.log("Examples that don't mention stolni tenis:");
  stExamples.forEach((e) => console.log(`  ${e}`));

  // Florbal
  const florbalFacilities = await prisma.facility.findMany({
    where: {
      isActive: true,
      sports: { some: { sport: { slug: "florbal" } } },
    },
    select: { id: true, name: true, description: true },
  });

  let flNoMention = 0;
  let flHasMention = 0;
  const flExamples: string[] = [];

  for (const f of florbalFacilities) {
    const text = `${f.name} ${f.description || ""}`.toLowerCase();
    const mentions = /florbal|floorball/i.test(text);
    if (mentions) {
      flHasMention++;
    } else {
      flNoMention++;
      if (flExamples.length < 10) {
        flExamples.push(
          `${f.name}: ${(f.description || "").substring(0, 80)}`
        );
      }
    }
  }

  console.log(
    `\n=== FLORBAL: ${flHasMention} mention, ${flNoMention} do NOT ===`
  );
  console.log("Examples that don't mention florbal:");
  flExamples.forEach((e) => console.log(`  ${e}`));
}

main().then(() => prisma.$disconnect());

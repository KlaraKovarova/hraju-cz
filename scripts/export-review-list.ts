import * as dotenv from "dotenv";
dotenv.config();

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connStr) throw new Error("DATABASE_URL / DIRECT_URL not set");

const adapter = new PrismaNeon({ connectionString: connStr });
const prisma = new PrismaClient({ adapter });

interface QualityFlag {
  code: string;
  label: string;
  severity: "high" | "medium" | "low";
}

function assessQuality(facility: Record<string, unknown>): QualityFlag[] {
  const flags: QualityFlag[] = [];
  const contacts = facility.contacts as Array<{ type: string; value: string }>;
  const sports = facility.sports as Array<{ sport: { nameCs: string } }>;

  // High severity
  if (!facility.lat || !facility.lng) {
    flags.push({ code: "NO_COORDS", label: "Chybí souřadnice", severity: "high" });
  }
  if (!contacts || contacts.length === 0) {
    flags.push({ code: "NO_CONTACTS", label: "Žádný kontakt", severity: "high" });
  } else {
    if (!contacts.some((c) => c.type === "PHONE")) {
      flags.push({ code: "NO_PHONE", label: "Chybí telefon", severity: "medium" });
    }
  }
  if (!sports || sports.length === 0) {
    flags.push({ code: "NO_SPORT", label: "Žádný sport", severity: "high" });
  }

  // Medium severity
  if (!facility.description) {
    flags.push({ code: "NO_DESC", label: "Chybí popis", severity: "medium" });
  }
  if (!facility.website) {
    flags.push({ code: "NO_WEB", label: "Chybí web", severity: "medium" });
  }
  if (!facility.openingHours) {
    flags.push({ code: "NO_HOURS", label: "Chybí otevírací doba", severity: "medium" });
  }
  if (!facility.postalCode) {
    flags.push({ code: "NO_ZIP", label: "Chybí PSČ", severity: "medium" });
  }

  // Low severity
  const images = facility.images as Array<unknown>;
  if (!images || images.length === 0) {
    flags.push({ code: "NO_IMAGES", label: "Žádné fotky", severity: "low" });
  }

  return flags;
}

async function main() {
  console.error("Fetching all facilities...");

  const facilities = await prisma.facility.findMany({
    where: { isActive: true },
    include: {
      location: { select: { city: true, region: true } },
      sports: { include: { sport: { select: { nameCs: true, slug: true } } } },
      contacts: { select: { type: true, value: true } },
      images: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  console.error(`Found ${facilities.length} active facilities`);

  // CSV header
  const header = [
    "ID",
    "Název",
    "Slug",
    "Město",
    "Region",
    "Adresa",
    "PSČ",
    "Lat",
    "Lng",
    "Sporty",
    "Popis",
    "Web",
    "Telefon",
    "Email",
    "Otevírací doba",
    "Fotky",
    "Claimed",
    "Premium",
    "Problémy (vysoké)",
    "Problémy (střední)",
    "Problémy (nízké)",
    "Všechny problémy",
    "Počet problémů",
    "URL na webu",
  ].join("\t");

  const rows: string[] = [header];

  let highCount = 0;
  let medCount = 0;
  let lowCount = 0;
  let cleanCount = 0;

  for (const f of facilities) {
    const flags = assessQuality(f as unknown as Record<string, unknown>);
    const highFlags = flags.filter((fl) => fl.severity === "high");
    const medFlags = flags.filter((fl) => fl.severity === "medium");
    const lowFlags = flags.filter((fl) => fl.severity === "low");

    if (highFlags.length > 0) highCount++;
    else if (medFlags.length > 0) medCount++;
    else if (lowFlags.length > 0) lowCount++;
    else cleanCount++;

    const phone = f.contacts.find((c) => c.type === "PHONE")?.value || "";
    const email = f.contacts.find((c) => c.type === "EMAIL")?.value || "";
    const sports = f.sports.map((s) => s.sport.nameCs).join(", ");
    const sportSlug = f.sports[0]?.sport.slug || "";
    const url = sportSlug ? `https://www.hraju.cz/${sportSlug}/${f.slug}` : "";

    const esc = (s: string) => (s || "").replace(/\t/g, " ").replace(/\n/g, " ").replace(/\r/g, "");

    rows.push(
      [
        f.id,
        esc(f.name),
        f.slug,
        esc(f.location.city),
        esc(f.location.region || ""),
        esc(f.address),
        f.postalCode || "",
        f.lat || "",
        f.lng || "",
        sports,
        esc((f.description || "").slice(0, 200)),
        f.website || "",
        phone,
        email,
        f.openingHours ? "Ano" : "Ne",
        (f.images?.length || 0).toString(),
        f.isClaimed ? "Ano" : "Ne",
        f.isPremium ? "Ano" : "Ne",
        highFlags.map((fl) => fl.label).join(", "),
        medFlags.map((fl) => fl.label).join(", "),
        lowFlags.map((fl) => fl.label).join(", "),
        flags.map((fl) => fl.code).join(","),
        flags.length.toString(),
        url,
      ].join("\t")
    );
  }

  // Write to file
  const outPath = "facilities-review.tsv";
  fs.writeFileSync(outPath, rows.join("\n"), "utf-8");
  console.error(`\nExported to ${outPath}`);
  console.error(`\nSummary:`);
  console.error(`  High severity issues: ${highCount} facilities`);
  console.error(`  Medium severity only: ${medCount} facilities`);
  console.error(`  Low severity only:    ${lowCount} facilities`);
  console.error(`  Clean (no issues):    ${cleanCount} facilities`);
  console.error(`  Total:                ${facilities.length} facilities`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

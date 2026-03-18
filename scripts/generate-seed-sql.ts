#!/usr/bin/env tsx
/**
 * Reads scraped JSON files from scripts/data/firmy-*.json and generates
 * a SQL file that populates the hraju.cz database with real facility data.
 *
 * Usage: tsx scripts/generate-seed-sql.ts [output-file]
 * Default output: scripts/data/seed-data.sql
 */

import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

const DATA_DIR = join(__dirname, "data");
const OUTPUT = process.argv[2] || join(DATA_DIR, "seed-data.sql");

// --- helpers ---

function cuid(): string {
  return randomBytes(12).toString("base64url").slice(0, 25);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function esc(val: string | null | undefined): string {
  if (val == null || val === "") return "NULL";
  return `'${val.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function truncate(s: string | null | undefined, max: number): string | null {
  if (!s) return null;
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// --- types ---

interface RawFacility {
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  website?: string;
  description?: string;
  sport: string;
}

// --- sports config (must match SPORTS in lib/sports.ts) ---

const SPORTS_CONFIG: Record<
  string,
  { name: string; nameCs: string; icon: string; description: string }
> = {
  tenis: { name: "Tennis", nameCs: "Tenis", icon: "🎾", description: "Tenisové kurty v České republice" },
  squash: { name: "Squash", nameCs: "Squash", icon: "🏸", description: "Squashové kurty v České republice" },
  badminton: { name: "Badminton", nameCs: "Badminton", icon: "🏸", description: "Badmintonové kurty v České republice" },
  volejbal: { name: "Volleyball", nameCs: "Volejbal", icon: "🏐", description: "Volejbalové kurty v České republice" },
  plavani: { name: "Swimming", nameCs: "Plavání", icon: "🏊", description: "Plavecké bazény v České republice" },
  golf: { name: "Golf", nameCs: "Golf", icon: "⛳", description: "Golfová hřiště, driving range, indoor golf" },
  fitness: { name: "Fitness", nameCs: "Fitness", icon: "🏋️", description: "Fitness centra, posilovny, CrossFit boxy" },
  bowling: { name: "Bowling", nameCs: "Bowling", icon: "🎳", description: "Bowlingové dráhy a centra" },
};

const AMENITIES = [
  { slug: "parking", name: "Parking", nameCs: "Parkování", icon: "🅿️" },
  { slug: "showers", name: "Showers", nameCs: "Sprchy", icon: "🚿" },
  { slug: "cafe", name: "Café", nameCs: "Kavárna", icon: "☕" },
  { slug: "pro-shop", name: "Pro Shop", nameCs: "Pro shop", icon: "🛍️" },
  { slug: "locker-room", name: "Locker Room", nameCs: "Šatna", icon: "🔐" },
];

// --- main ---

function main() {
  // Load all JSON files
  const jsonFiles = readdirSync(DATA_DIR).filter((f) => f.startsWith("firmy-") && f.endsWith(".json"));
  const allFacilities: RawFacility[] = [];

  for (const file of jsonFiles) {
    const data: RawFacility[] = JSON.parse(readFileSync(join(DATA_DIR, file), "utf-8"));
    allFacilities.push(...data);
  }

  console.log(`Loaded ${allFacilities.length} facilities from ${jsonFiles.length} files`);

  // Deduplicate facilities by name+city (some may appear in multiple files)
  const seen = new Set<string>();
  const facilities: RawFacility[] = [];
  for (const f of allFacilities) {
    const key = `${f.name.trim().toLowerCase()}|${f.city.trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      facilities.push(f);
    }
  }
  console.log(`After dedup: ${facilities.length} unique facilities`);

  // Deduplicate slugs
  const slugCount = new Map<string, number>();
  function uniqueSlug(name: string): string {
    let base = slugify(name);
    if (!base) base = "facility";
    const count = slugCount.get(base) || 0;
    slugCount.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  }

  // Build SQL
  const lines: string[] = [];
  const now = new Date().toISOString().slice(0, 23).replace("T", " ");

  lines.push("SET NAMES utf8mb4;");
  lines.push("SET FOREIGN_KEY_CHECKS = 0;");
  lines.push("");

  // -- Alter description to TEXT to fit long descriptions --
  lines.push("ALTER TABLE `Facility` MODIFY COLUMN `description` TEXT DEFAULT NULL;");
  lines.push("");

  // -- Sports --
  lines.push("-- Sports");
  const sportIds: Record<string, string> = {};
  for (const [slug, cfg] of Object.entries(SPORTS_CONFIG)) {
    const id = cuid();
    sportIds[slug] = id;
    lines.push(
      `INSERT INTO \`Sport\` (\`id\`, \`slug\`, \`name\`, \`nameCs\`, \`subdomain\`, \`description\`, \`icon\`, \`createdAt\`, \`updatedAt\`) VALUES (${esc(id)}, ${esc(slug)}, ${esc(cfg.name)}, ${esc(cfg.nameCs)}, ${esc(slug)}, ${esc(cfg.description)}, ${esc(cfg.icon)}, '${now}', '${now}') ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);`
    );
  }
  lines.push("");

  // -- Amenities --
  lines.push("-- Amenities");
  const amenityIds: Record<string, string> = {};
  for (const a of AMENITIES) {
    const id = cuid();
    amenityIds[a.slug] = id;
    lines.push(
      `INSERT INTO \`Amenity\` (\`id\`, \`slug\`, \`name\`, \`nameCs\`, \`icon\`) VALUES (${esc(id)}, ${esc(a.slug)}, ${esc(a.name)}, ${esc(a.nameCs)}, ${esc(a.icon)}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);`
    );
  }
  lines.push("");

  // -- Locations (unique cities) --
  lines.push("-- Locations");
  const locationIds: Record<string, string> = {};
  const citySet = new Set<string>();
  for (const f of facilities) {
    const city = f.city.trim();
    if (city && !citySet.has(city)) {
      citySet.add(city);
      const id = cuid();
      locationIds[city] = id;
      lines.push(
        `INSERT INTO \`Location\` (\`id\`, \`city\`, \`region\`, \`country\`, \`createdAt\`, \`updatedAt\`) VALUES (${esc(id)}, ${esc(city)}, NULL, 'CZ', '${now}', '${now}') ON DUPLICATE KEY UPDATE \`id\`=\`id\`;`
      );
    }
  }
  console.log(`${citySet.size} unique cities`);
  lines.push("");

  // -- Facilities + FacilitySport + Contact --
  lines.push("-- Facilities");
  let facilityCount = 0;
  let contactCount = 0;
  let sportLinkCount = 0;

  for (const f of facilities) {
    const city = f.city.trim();
    const locId = locationIds[city];
    if (!locId) continue;

    const sportSlug = f.sport?.trim();
    const sportId = sportSlug ? sportIds[sportSlug] : null;
    if (!sportId) continue;

    const fId = cuid();
    const slug = uniqueSlug(f.name.trim());
    const name = f.name.trim();
    const address = f.address?.trim() || city;
    const postalCode = f.postalCode?.trim() || null;
    const description = f.description?.trim() || null;
    const website = f.website?.trim() || null;
    const phone = f.phone?.trim() || null;

    lines.push(
      `INSERT INTO \`Facility\` (\`id\`, \`slug\`, \`name\`, \`description\`, \`address\`, \`postalCode\`, \`locationId\`, \`website\`, \`isActive\`, \`isClaimed\`, \`isPremium\`, \`createdAt\`, \`updatedAt\`) VALUES (${esc(fId)}, ${esc(slug)}, ${esc(name)}, ${esc(description)}, ${esc(address)}, ${esc(postalCode)}, ${esc(locId)}, ${esc(website)}, 1, 0, 0, '${now}', '${now}');`
    );
    facilityCount++;

    // FacilitySport
    const fsId = cuid();
    lines.push(
      `INSERT INTO \`FacilitySport\` (\`id\`, \`facilityId\`, \`sportId\`, \`createdAt\`) VALUES (${esc(fsId)}, ${esc(fId)}, ${esc(sportId)}, '${now}');`
    );
    sportLinkCount++;

    // Contact (phone)
    if (phone) {
      const cId = cuid();
      lines.push(
        `INSERT INTO \`Contact\` (\`id\`, \`facilityId\`, \`type\`, \`value\`, \`isPrimary\`, \`createdAt\`) VALUES (${esc(cId)}, ${esc(fId)}, 'PHONE', ${esc(phone)}, 1, '${now}');`
      );
      contactCount++;
    }

    // Contact (website as WEBSITE type)
    if (website) {
      const wId = cuid();
      lines.push(
        `INSERT INTO \`Contact\` (\`id\`, \`facilityId\`, \`type\`, \`value\`, \`isPrimary\`, \`createdAt\`) VALUES (${esc(wId)}, ${esc(fId)}, 'WEBSITE', ${esc(website)}, 0, '${now}');`
      );
      contactCount++;
    }
  }

  lines.push("");
  lines.push("SET FOREIGN_KEY_CHECKS = 1;");

  writeFileSync(OUTPUT, lines.join("\n"), "utf-8");
  console.log(`\nGenerated: ${OUTPUT}`);
  console.log(`  ${Object.keys(sportIds).length} sports`);
  console.log(`  ${AMENITIES.length} amenities`);
  console.log(`  ${citySet.size} locations`);
  console.log(`  ${facilityCount} facilities`);
  console.log(`  ${sportLinkCount} facility-sport links`);
  console.log(`  ${contactCount} contacts`);
}

main();

#!/usr/bin/env tsx
/**
 * Enrich hraju.cz facilities with phone numbers and websites from firmy.cz scrape data.
 *
 * Matching strategy:
 * 1. Exact name + city match (highest confidence)
 * 2. Normalized name + city match (lowercase, stripped diacritics/punctuation)
 * 3. Address + city match as fallback
 *
 * Only fills MISSING data — never overwrites existing contacts.
 *
 * Usage:
 *   npx tsx scripts/enrich-from-firmy.ts             # dry run (report only)
 *   npx tsx scripts/enrich-from-firmy.ts --apply      # update facilities-export.json + generate PHP
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(__dirname, "data");
const EXPORT_PATH = join(__dirname, "..", "src", "data", "facilities-export.json");
const PHP_OUTPUT = join(DATA_DIR, "firmy-enrich-contacts.php");
const REPORT_OUTPUT = join(DATA_DIR, "firmy-enrich-report.json");

const SPORTS = [
  "squash",
  "plavani",
  "fitness",
  "bowling",
];

interface FirmyEntry {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  website: string;
  description: string;
  sport: string;
}

interface FacilityExport {
  exportedAt: string;
  sports: unknown[];
  locations: Array<{
    id: string;
    city: string;
    region: string | null;
    country: string;
  }>;
  amenities: unknown[];
  facilities: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    address: string;
    postalCode: string | null;
    locationId: string;
    lat: number | null;
    lng: number | null;
    website: string | null;
    isActive: boolean;
    openingHours: unknown;
    [key: string]: unknown;
  }>;
  facilitySports: unknown[];
  contacts: Array<{
    id: string;
    facilityId: string;
    type: string;
    value: string;
    label: string | null;
    isPrimary: boolean;
  }>;
}

// Strip diacritics and normalize for fuzzy matching
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Strip common suffixes like "s.r.o.", "z.s.", "a.s." for name matching
function normalizeCompanyName(s: string): string {
  return normalize(s)
    .replace(/\b(sro|s r o|zs|z s|as|a s|spol|o p s|ops)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Normalize city name — strip neighborhood suffixes
function normalizeCity(city: string): string {
  // "Praha 6" → "praha", "Liberec XV-Starý Harcov" → "liberec"
  let c = city.split(",")[0].trim();
  c = c.replace(/\s+\d+$/, ""); // "Praha 6" → "Praha"
  c = c.replace(/\s+[IVXLCDM]+-.*$/, ""); // "Liberec XV-..." → "Liberec"
  c = c.replace(/\s+[IVXLCDM]+$/, ""); // "Přerov I" → "Přerov"
  return normalize(c);
}

function main() {
  const applyMode = process.argv.includes("--apply");

  console.log(`Mode: ${applyMode ? "APPLY (will update files)" : "DRY RUN (report only)"}`);
  console.log();

  // Load facility data
  const exportData: FacilityExport = JSON.parse(readFileSync(EXPORT_PATH, "utf-8"));
  const locations = new Map(exportData.locations.map((l) => [l.id, l]));

  // Build contact lookup: facilityId → Set<type>
  const facilityContacts = new Map<string, Set<string>>();
  for (const c of exportData.contacts) {
    if (!facilityContacts.has(c.facilityId)) {
      facilityContacts.set(c.facilityId, new Set());
    }
    facilityContacts.get(c.facilityId)!.add(c.type);
  }

  // Find facilities missing phone or website
  const activeFacilities = exportData.facilities.filter((f) => f.isActive);
  const missingPhone = new Set(
    activeFacilities
      .filter((f) => !facilityContacts.get(f.id)?.has("PHONE"))
      .map((f) => f.id)
  );
  const missingWebsite = new Set(
    activeFacilities
      .filter((f) => !facilityContacts.get(f.id)?.has("WEBSITE") && !f.website)
      .map((f) => f.id)
  );

  console.log(`Active facilities: ${activeFacilities.length}`);
  console.log(`Missing phone: ${missingPhone.size}`);
  console.log(`Missing website: ${missingWebsite.size}`);
  console.log();

  // Build facility lookup indices
  // Key: normalizedName|normalizedCity → facility
  const exactIndex = new Map<string, typeof activeFacilities[0][]>();
  const normIndex = new Map<string, typeof activeFacilities[0][]>();
  const addrIndex = new Map<string, typeof activeFacilities[0][]>();

  for (const fac of activeFacilities) {
    const loc = locations.get(fac.locationId);
    if (!loc) continue;

    const city = normalizeCity(loc.city);

    // Exact name|city
    const exactKey = `${normalize(fac.name)}|${city}`;
    if (!exactIndex.has(exactKey)) exactIndex.set(exactKey, []);
    exactIndex.get(exactKey)!.push(fac);

    // Normalized company name|city
    const normKey = `${normalizeCompanyName(fac.name)}|${city}`;
    if (!normIndex.has(normKey)) normIndex.set(normKey, []);
    normIndex.get(normKey)!.push(fac);

    // Address|city (for address-based fallback)
    const addrKey = `${normalize(fac.address)}|${city}`;
    if (!addrIndex.has(addrKey)) addrIndex.set(addrKey, []);
    addrIndex.get(addrKey)!.push(fac);
  }

  // Load all firmy.cz data
  const allFirmy: FirmyEntry[] = [];
  for (const sport of SPORTS) {
    const path = join(DATA_DIR, `firmy-${sport}.json`);
    const entries: FirmyEntry[] = JSON.parse(readFileSync(path, "utf-8"));
    allFirmy.push(...entries);
  }
  console.log(`Firmy.cz entries loaded: ${allFirmy.length}`);

  // Deduplicate firmy entries by name+city
  const seenFirmy = new Set<string>();
  const uniqueFirmy: FirmyEntry[] = [];
  for (const entry of allFirmy) {
    const key = `${normalize(entry.name)}|${normalizeCity(entry.city)}`;
    if (!seenFirmy.has(key)) {
      seenFirmy.add(key);
      uniqueFirmy.push(entry);
    }
  }
  console.log(`Unique firmy.cz entries: ${uniqueFirmy.length}`);
  console.log();

  // Match and collect enrichments
  interface Enrichment {
    facilityId: string;
    facilityName: string;
    matchType: "exact" | "normalized" | "address";
    firmyName: string;
    firmyCity: string;
    addPhone?: string;
    addWebsite?: string;
  }

  const enrichments: Enrichment[] = [];
  const matchedFacilities = new Set<string>();
  let matchExact = 0,
    matchNorm = 0,
    matchAddr = 0;

  for (const entry of uniqueFirmy) {
    const city = normalizeCity(entry.city);

    // Try exact match
    const exactKey = `${normalize(entry.name)}|${city}`;
    let matches = exactIndex.get(exactKey);
    let matchType: "exact" | "normalized" | "address" = "exact";

    if (!matches || matches.length === 0) {
      // Try normalized company name
      const normKey = `${normalizeCompanyName(entry.name)}|${city}`;
      matches = normIndex.get(normKey);
      matchType = "normalized";
    }

    if (!matches || matches.length === 0) {
      // Try address match
      if (entry.address) {
        const addrKey = `${normalize(entry.address)}|${city}`;
        matches = addrIndex.get(addrKey);
        matchType = "address";
      }
    }

    if (!matches || matches.length !== 1) continue; // Skip ambiguous or no match

    const fac = matches[0];
    if (matchedFacilities.has(fac.id)) continue; // Already matched
    matchedFacilities.add(fac.id);

    if (matchType === "exact") matchExact++;
    else if (matchType === "normalized") matchNorm++;
    else matchAddr++;

    const needsPhone = missingPhone.has(fac.id) && entry.phone;
    const needsWebsite = missingWebsite.has(fac.id) && entry.website;

    if (needsPhone || needsWebsite) {
      enrichments.push({
        facilityId: fac.id,
        facilityName: fac.name,
        matchType,
        firmyName: entry.name,
        firmyCity: entry.city,
        addPhone: needsPhone ? entry.phone : undefined,
        addWebsite: needsWebsite ? entry.website : undefined,
      });
    }
  }

  console.log("=== MATCHING RESULTS ===");
  console.log(`Matched facilities: ${matchedFacilities.size}`);
  console.log(`  Exact: ${matchExact}`);
  console.log(`  Normalized: ${matchNorm}`);
  console.log(`  Address: ${matchAddr}`);
  console.log();

  const phoneFills = enrichments.filter((e) => e.addPhone).length;
  const websiteFills = enrichments.filter((e) => e.addWebsite).length;
  console.log("=== ENRICHMENT SUMMARY ===");
  console.log(`Phone numbers to add: ${phoneFills}`);
  console.log(`Websites to add: ${websiteFills}`);
  console.log(`Total enrichment actions: ${enrichments.length}`);
  console.log();

  // Save report
  writeFileSync(REPORT_OUTPUT, JSON.stringify({ enrichments, stats: {
    matchExact, matchNorm, matchAddr,
    phoneFills, websiteFills,
    totalMatched: matchedFacilities.size,
  } }, null, 2), "utf-8");
  console.log(`Report saved: ${REPORT_OUTPUT}`);

  if (!applyMode) {
    console.log("\nDry run complete. Use --apply to update files.");
    return;
  }

  // Apply: update contacts in export and generate PHP
  let nextContactId = 1;
  const newContacts: Array<{
    facilityId: string;
    type: string;
    value: string;
  }> = [];

  for (const e of enrichments) {
    if (e.addPhone) {
      exportData.contacts.push({
        id: `firmy-phone-${nextContactId++}`,
        facilityId: e.facilityId,
        type: "PHONE",
        value: e.addPhone,
        label: null,
        isPrimary: true,
      });
      newContacts.push({
        facilityId: e.facilityId,
        type: "PHONE",
        value: e.addPhone,
      });
    }
    if (e.addWebsite) {
      // Update facility website field too
      const fac = exportData.facilities.find((f) => f.id === e.facilityId);
      if (fac) fac.website = e.addWebsite;

      exportData.contacts.push({
        id: `firmy-web-${nextContactId++}`,
        facilityId: e.facilityId,
        type: "WEBSITE",
        value: e.addWebsite,
        label: null,
        isPrimary: false,
      });
      newContacts.push({
        facilityId: e.facilityId,
        type: "WEBSITE",
        value: e.addWebsite,
      });
    }
  }

  // Save updated export
  writeFileSync(EXPORT_PATH, JSON.stringify(exportData, null, 2), "utf-8");
  console.log(`\nUpdated: ${EXPORT_PATH}`);
  console.log(`  Added ${phoneFills} phone contacts`);
  console.log(`  Added ${websiteFills} website contacts`);

  // Generate PHP for DB deployment
  const phpEsc = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  let php = `<?php
/**
 * Firmy.cz contact enrichment — generated by enrich-from-firmy.ts
 * Adds missing phone numbers and websites from firmy.cz data.
 *
 * Run via SSH tunnel:
 *   ssh -L 3307:127.0.0.1:3306 user@server
 *   php scripts/data/firmy-enrich-contacts.php
 */

\$pdo = new PDO(
    'mysql:host=127.0.0.1;port=3307;dbname=hraju_cz;charset=utf8mb4',
    'hraju_cz',
    getenv('DB_PASSWORD') ?: die("Set DB_PASSWORD env var\\n")
);
\$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

function generateId(\$len = 16) {
    \$chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    \$id = '';
    for (\$i = 0; \$i < \$len; \$i++) {
        \$id .= \$chars[random_int(0, strlen(\$chars) - 1)];
    }
    return \$id;
}

\$insertContact = \$pdo->prepare(
    "INSERT INTO Contact (id, facilityId, type, value, label, isPrimary, createdAt)
     VALUES (:id, :fid, :type, :val, NULL, :primary, NOW())
     ON DUPLICATE KEY UPDATE id=id"
);

\$updateWebsite = \$pdo->prepare(
    "UPDATE Facility SET website = :website, updatedAt = NOW() WHERE id = :id AND (website IS NULL OR website = '')"
);

\$added = 0;
\$errors = 0;

`;

  for (const c of newContacts) {
    const isPrimary = c.type === "PHONE" ? 1 : 0;
    php += `try {
    \$insertContact->execute(['id' => generateId(), 'fid' => '${phpEsc(c.facilityId)}', 'type' => '${c.type}', 'val' => '${phpEsc(c.value)}', 'primary' => ${isPrimary}]);
    \$added++;
`;
    if (c.type === "WEBSITE") {
      php += `    \$updateWebsite->execute(['website' => '${phpEsc(c.value)}', 'id' => '${phpEsc(c.facilityId)}']);
`;
    }
    php += `} catch (Exception \$e) { echo "Error ${phpEsc(c.facilityId)}: " . \$e->getMessage() . "\\n"; \$errors++; }
`;
  }

  php += `
echo "Done. Added: \$added, Errors: \$errors\\n";
`;

  writeFileSync(PHP_OUTPUT, php, "utf-8");
  console.log(`PHP script: ${PHP_OUTPUT}`);
}

main();

#!/usr/bin/env tsx
/**
 * Enrich hraju.cz facilities with opening hours, amenities, and pricing
 * from firmy.cz detail pages.
 *
 * Uses Playwright to handle firmy.cz's SPA + CMP consent wall.
 * Processes in configurable batches with resume capability.
 *
 * Usage:
 *   npx tsx scripts/enrich-firmy-details.ts                    # process all (dry run)
 *   npx tsx scripts/enrich-firmy-details.ts --limit 50         # first 50
 *   npx tsx scripts/enrich-firmy-details.ts --resume           # resume from saved progress
 *   npx tsx scripts/enrich-firmy-details.ts --resume --limit 100  # resume, do 100 more
 *   npx tsx scripts/enrich-firmy-details.ts --apply            # write results to export + PHP
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { chromium, type Page, type BrowserContext } from "playwright";

const DATA_DIR = join(__dirname, "data");
const EXPORT_PATH = join(__dirname, "..", "src", "data", "facilities-export.json");
const RESULTS_PATH = join(DATA_DIR, "firmy-details-results.json");
const PHP_OUTPUT = join(DATA_DIR, "firmy-enrich-details.php");
const RATE_LIMIT_MS = 1500; // 1.5s between requests

// ── Types ──────────────────────────────────────────────────────────────────

interface FacilityExport {
  exportedAt: string;
  sports: unknown[];
  locations: Array<{
    id: string;
    city: string;
    region: string | null;
    country: string;
  }>;
  amenities: Array<{
    id: string;
    slug: string;
    name: string;
    nameCs: string;
    icon: string | null;
  }>;
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
    pricing: string | null;
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
  facilityAmenities?: Array<{
    id: string;
    facilityId: string;
    amenityId: string;
  }>;
}

interface DetailResult {
  facilityId: string;
  facilityName: string;
  firmyDetailUrl: string | null;
  openingHours: Record<string, { open: string; close: string }> | null;
  openingHoursRaw: string | string[] | null;
  amenitySlugs: string[];
  pricingText: string | null;
  matchConfidence: "exact" | "normalized" | "none";
  scrapedAt: string;
}

interface SavedProgress {
  results: DetailResult[];
  failedIds: string[];
  skippedIds: string[];
  lastProcessedIndex: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCity(city: string): string {
  let c = city.split(",")[0].trim();
  c = c.replace(/\s+\d+$/, "");
  c = c.replace(/\s+[IVXLCDM]+-.*$/, "");
  c = c.replace(/\s+[IVXLCDM]+$/, "");
  return normalize(c);
}

/**
 * Parse schema.org openingHours into per-day structure.
 * Input can be:
 *   - string: "Mo,Tu,We,Th,Fr 08:00–22:00"
 *   - array:  ["Th,Fr,Mo,Tu,We 8:00–22:00", "Sa,Su 8:00–18:00"]
 */
function parseOpeningHours(
  raw: string | string[]
): Record<string, { open: string; close: string }> | null {
  if (!raw) return null;

  const specs = Array.isArray(raw) ? raw : [raw];

  const dayMap: Record<string, string> = {
    Mo: "monday",
    Tu: "tuesday",
    We: "wednesday",
    Th: "thursday",
    Fr: "friday",
    Sa: "saturday",
    Su: "sunday",
  };
  const allDayKeys = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const result: Record<string, { open: string; close: string }> = {};

  for (const spec of specs) {
    // Match pattern: "Mo,Tu,We 9:00–21:00" or "Mo-Fr 08:00-22:00"
    const match = spec
      .trim()
      .match(
        /^([A-Za-z,\-\s]+?)\s+(\d{1,2}:\d{2})\s*[–\-]\s*(\d{1,2}:\d{2})$/
      );
    if (!match) continue;

    const [, daysPart, open, close] = match;
    const openPadded = open.padStart(5, "0");
    const closePadded = close.padStart(5, "0");

    // Check for range like "Mo-Fr"
    const rangeMatch = daysPart.match(/([A-Z][a-z])\s*-\s*([A-Z][a-z])/);
    if (rangeMatch) {
      const start = allDayKeys.indexOf(rangeMatch[1]);
      const end = allDayKeys.indexOf(rangeMatch[2]);
      if (start >= 0 && end >= 0) {
        for (let j = start; j <= end; j++) {
          const full = dayMap[allDayKeys[j]];
          if (full) result[full] = { open: openPadded, close: closePadded };
        }
        continue;
      }
    }

    // Comma-separated days: "Mo,Tu,We,Th,Fr"
    const dayTokens = daysPart.split(/[,\s]+/).filter(Boolean);
    for (const day of dayTokens) {
      const full = dayMap[day];
      if (full) result[full] = { open: openPadded, close: closePadded };
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

// Amenity keyword detection — uses word-boundary matching to reduce false positives.
// These are matched against the facility's LD+JSON description only (not the full page).
const AMENITY_PATTERNS: Record<string, RegExp[]> = {
  parking: [
    /\bparkování\b/i,
    /\bparkoviště\b/i,
    /\bparking\b/i,
    /\bparkovací\b/i,
  ],
  showers: [/\bsprch[yau]\b/i, /\bshower/i, /\bumývárn/i],
  "locker-room": [/\bšatn[ayě]\b/i, /\blocker/i, /\bpřevlékárn/i],
  cafe: [
    /\bkavárn[ayu]\b/i,
    /\bcafé\b/i,
    /\brestaurac[ei]\b/i,
    /\bobčerstven/i,
    /\bbistro\b/i,
    /\bbufet\b/i,
  ],
  "pro-shop": [/\bpro[\s-]?shop\b/i, /\bproshop\b/i],
};

function detectAmenities(text: string): string[] {
  const found: string[] = [];
  for (const [slug, patterns] of Object.entries(AMENITY_PATTERNS)) {
    if (patterns.some((re) => re.test(text))) {
      found.push(slug);
    }
  }
  return found;
}

// ── CMP Consent ────────────────────────────────────────────────────────────

async function acceptCmpConsent(page: Page): Promise<void> {
  // Navigate to a detail page — this triggers CMP consent redirect
  // (search pages don't require CMP, but detail pages do)
  await page.goto(
    "https://www.firmy.cz/detail/273187-sport-klub-171-kostelec-u-krizku.html",
    { waitUntil: "domcontentloaded", timeout: 15000 }
  );
  await sleep(3000);

  const url = page.url();
  if (url.includes("cmp.seznam.cz")) {
    console.log("  On CMP consent page, accepting...");
    try {
      await page.click('button:has-text("Souhlasím")');
      await sleep(4000);
      console.log("  Consent accepted, redirected to:", page.url());
    } catch {
      console.log("  Warning: Could not click consent button.");
    }
  } else if (
    (await page.evaluate(() => document.body.textContent || "")).includes(
      "Něco nám brání"
    )
  ) {
    // Error page — CMP script failed to load, try direct CMP URL
    console.log("  CMP script failed, trying direct consent URL...");
    await page.goto(
      "https://cmp.seznam.cz/nastaveni-souhlasu?service=bcr&return_url=https%3A%2F%2Fwww.firmy.cz%2F&service_id=firmy&reason=missing",
      { waitUntil: "domcontentloaded", timeout: 15000 }
    );
    await sleep(3000);
    try {
      await page.click('button:has-text("Souhlasím")');
      await sleep(4000);
      console.log("  Consent accepted via direct URL.");
    } catch {
      console.log("  Warning: Could not accept consent.");
    }
  } else {
    // Try cookie banner on the page itself
    try {
      const btn = await page.$('button[data-dot="accept-all"]');
      if (btn) {
        await btn.click();
        await sleep(1000);
        console.log("  Cookie banner accepted.");
      }
    } catch {}
  }

  // Verify consent works by checking if detail page loads
  await page.goto(
    "https://www.firmy.cz/detail/273187-sport-klub-171-kostelec-u-krizku.html",
    { waitUntil: "domcontentloaded", timeout: 15000 }
  );
  await sleep(6000);
  const isError = await page.evaluate(() =>
    (document.body.textContent || "").includes("Něco nám brání")
  );
  if (isError) {
    console.log("  WARNING: Detail pages still blocked after consent.");
    console.log("  CMP consent may not be working. Continuing anyway...");
  } else {
    console.log("  Detail page verified working.");
  }
}

// ── Scraping ───────────────────────────────────────────────────────────────

async function searchFirmy(
  page: Page,
  name: string,
  city: string
): Promise<{ detailUrl: string; matchName: string } | null> {
  const query = encodeURIComponent(`${name} ${city}`);
  await page.goto(`https://www.firmy.cz/?q=${query}&thru=cat`, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  await sleep(4000);

  // Extract first result from LD+JSON
  const result = await page.evaluate(() => {
    const articles = document.querySelectorAll("article.premiseBox");
    for (const article of articles) {
      const ld = article.querySelector('script[type="application/ld+json"]');
      if (!ld) continue;
      try {
        const data = JSON.parse(ld.textContent || "");
        if (data.url && data.name) {
          return {
            detailUrl: data.url as string,
            matchName: data.name as string,
          };
        }
      } catch {}
    }
    return null;
  });

  return result;
}

async function scrapeDetailPage(
  page: Page,
  detailUrl: string
): Promise<{
  openingHoursRaw: string | string[] | null;
  amenitySlugs: string[];
  pricingText: string | null;
}> {
  await page.goto(detailUrl, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  await sleep(6000);

  // Check for CMP redirect
  if (page.url().includes("cmp.seznam.cz")) {
    try {
      await page.click('button:has-text("Souhlasím")');
      await sleep(4000);
    } catch {}
    await sleep(5000);
  }

  const data = await page.evaluate(() => {
    const body = document.body.textContent || "";

    // Check for error page
    if (body.includes("Něco nám brání")) {
      return {
        openingHoursRaw: null as string | string[] | null,
        description: "",
        categories: "",
        isError: true,
      };
    }

    // Get opening hours + description from LD+JSON
    let openingHoursRaw: string | string[] | null = null;
    let description = "";
    const ldScripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    for (const s of ldScripts) {
      try {
        const parsed = JSON.parse(s.textContent || "");
        if (parsed.openingHours) {
          openingHoursRaw = parsed.openingHours;
        }
        if (parsed.description) {
          description = parsed.description;
        }
      } catch {}
    }

    // Extract categories/tags section text for amenity detection
    // This section appears after the main info and before the footer
    let categoriesText = "";
    const bodyText = body;
    const catIdx = bodyText.indexOf("Kategorie");
    const tagsIdx = bodyText.indexOf("Štítky");
    if (catIdx > 0 || tagsIdx > 0) {
      const startIdx = Math.min(
        catIdx > 0 ? catIdx : Infinity,
        tagsIdx > 0 ? tagsIdx : Infinity
      );
      // Take up to 1000 chars after the first marker
      categoriesText = bodyText.slice(startIdx, startIdx + 1000);
    }

    return { openingHoursRaw, description, categoriesText, isError: false };
  });

  if (data.isError) {
    return { openingHoursRaw: null, amenitySlugs: [], pricingText: null };
  }

  // Detect amenities from facility description + categories section
  const amenityText = `${data.description} ${data.categoriesText}`;
  const amenitySlugs = detectAmenities(amenityText);

  // Pricing: rare on firmy.cz, skip for now to avoid false positives
  const pricingText: string | null = null;

  return {
    openingHoursRaw: data.openingHoursRaw,
    amenitySlugs,
    pricingText,
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;
  const resume = args.includes("--resume");
  const applyMode = args.includes("--apply");

  console.log("=== firmy.cz Detail Enrichment ===");
  console.log(`Mode: ${applyMode ? "APPLY" : "SCRAPE"}`);

  // If --apply mode, skip scraping and just apply saved results
  if (applyMode) {
    applyResults();
    return;
  }

  // Load facility data
  const exportData: FacilityExport = JSON.parse(
    readFileSync(EXPORT_PATH, "utf-8")
  );
  const locations = new Map(exportData.locations.map((l) => [l.id, l]));

  // Get active facilities that need enrichment (no opening hours)
  const toEnrich = exportData.facilities.filter(
    (f) => f.isActive && !f.openingHours
  );
  console.log(`Active facilities needing enrichment: ${toEnrich.length}`);

  // Load previous progress if resuming
  let results: DetailResult[] = [];
  let failedIds: string[] = [];
  let skippedIds: string[] = [];
  let startIndex = 0;

  if (resume && existsSync(RESULTS_PATH)) {
    const saved: SavedProgress = JSON.parse(
      readFileSync(RESULTS_PATH, "utf-8")
    );
    results = saved.results;
    failedIds = saved.failedIds;
    skippedIds = saved.skippedIds || [];
    startIndex = saved.lastProcessedIndex + 1;
    console.log(
      `Resuming from index ${startIndex}. Already have ${results.length} results.`
    );
  }

  // Set of already-processed facility IDs
  const processedIds = new Set([
    ...results.map((r) => r.facilityId),
    ...failedIds,
    ...skippedIds,
  ]);

  const endIndex = Math.min(toEnrich.length, startIndex + limit);
  console.log(`Processing facilities ${startIndex} to ${endIndex - 1}...`);
  console.log();

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // Accept CMP consent
  console.log("Accepting CMP consent...");
  await acceptCmpConsent(page);
  console.log();

  let enrichedCount = 0;
  let noMatchCount = 0;
  let errorCount = 0;

  for (let i = startIndex; i < endIndex; i++) {
    const facility = toEnrich[i];
    const location = locations.get(facility.locationId);
    const city = location?.city || "";

    if (processedIds.has(facility.id)) {
      continue;
    }

    process.stdout.write(
      `[${i + 1}/${toEnrich.length}] ${facility.name} (${city})... `
    );

    try {
      // Step 1: Search firmy.cz
      const searchResult = await searchFirmy(page, facility.name, city);
      await sleep(RATE_LIMIT_MS);

      if (!searchResult) {
        console.log("no search results");
        noMatchCount++;
        skippedIds.push(facility.id);
        saveProgress(results, failedIds, skippedIds, i);
        continue;
      }

      // Check name match confidence
      const nameMatch =
        normalize(searchResult.matchName) === normalize(facility.name)
          ? "exact"
          : normalizeCity(searchResult.matchName).includes(
              normalizeCity(facility.name).slice(0, 5)
            )
          ? "normalized"
          : "none";

      if (nameMatch === "none") {
        console.log(
          `name mismatch: "${searchResult.matchName}" vs "${facility.name}"`
        );
        noMatchCount++;
        skippedIds.push(facility.id);
        saveProgress(results, failedIds, skippedIds, i);
        continue;
      }

      // Step 2: Visit detail page
      const detail = await scrapeDetailPage(page, searchResult.detailUrl);
      await sleep(RATE_LIMIT_MS);

      const parsedHours = detail.openingHoursRaw
        ? parseOpeningHours(detail.openingHoursRaw)
        : null;

      const result: DetailResult = {
        facilityId: facility.id,
        facilityName: facility.name,
        firmyDetailUrl: searchResult.detailUrl,
        openingHours: parsedHours,
        openingHoursRaw: detail.openingHoursRaw,
        amenitySlugs: detail.amenitySlugs,
        pricingText: detail.pricingText,
        matchConfidence: nameMatch as "exact" | "normalized",
        scrapedAt: new Date().toISOString(),
      };

      results.push(result);
      enrichedCount++;

      const hoursStr = parsedHours ? Object.keys(parsedHours).length + " days" : "none";
      const amenStr = detail.amenitySlugs.length > 0 ? detail.amenitySlugs.join(",") : "none";
      console.log(
        `hours=${hoursStr} amenities=${amenStr} pricing=${detail.pricingText ? "yes" : "no"}`
      );
    } catch (err) {
      console.log(`ERROR: ${(err as Error).message}`);
      errorCount++;
      failedIds.push(facility.id);
    }

    // Save progress every 10 facilities
    if ((i + 1) % 10 === 0 || i === endIndex - 1) {
      saveProgress(results, failedIds, skippedIds, i);
    }

    // Log progress every 100
    if ((i + 1) % 100 === 0) {
      console.log(
        `  [Progress: ${enrichedCount} enriched, ${noMatchCount} no-match, ${errorCount} errors]`
      );
    }
  }

  await browser.close();

  // Final save
  saveProgress(results, failedIds, skippedIds, endIndex - 1);

  // Summary
  console.log();
  console.log("=== Summary ===");
  console.log(`Enriched: ${enrichedCount}`);
  console.log(`No match: ${noMatchCount}`);
  console.log(`Errors: ${errorCount}`);
  const withHours = results.filter((r) => r.openingHours).length;
  const withAmenities = results.filter((r) => r.amenitySlugs.length > 0).length;
  const withPricing = results.filter((r) => r.pricingText).length;
  console.log(`Results with opening hours: ${withHours}`);
  console.log(`Results with amenities: ${withAmenities}`);
  console.log(`Results with pricing: ${withPricing}`);
  console.log(`\nResults saved to ${RESULTS_PATH}`);
  console.log(`Run with --apply to update facilities-export.json and generate PHP.`);
}

function saveProgress(
  results: DetailResult[],
  failedIds: string[],
  skippedIds: string[],
  lastIndex: number
): void {
  const progress: SavedProgress = {
    results,
    failedIds,
    skippedIds,
    lastProcessedIndex: lastIndex,
  };
  writeFileSync(RESULTS_PATH, JSON.stringify(progress, null, 2), "utf-8");
}

// ── Apply mode ─────────────────────────────────────────────────────────────

function applyResults(): void {
  if (!existsSync(RESULTS_PATH)) {
    console.error("No results file found. Run scraping first.");
    process.exit(1);
  }

  const { results }: SavedProgress = JSON.parse(
    readFileSync(RESULTS_PATH, "utf-8")
  );
  const exportData: FacilityExport = JSON.parse(
    readFileSync(EXPORT_PATH, "utf-8")
  );

  console.log(`Applying ${results.length} enrichment results...`);

  // Build facility lookup
  const facilityMap = new Map(
    exportData.facilities.map((f) => [f.id, f])
  );

  // Build amenity slug → id lookup
  const amenityMap = new Map(
    exportData.amenities.map((a) => [a.slug, a.id])
  );

  // Initialize facilityAmenities array if missing
  if (!exportData.facilityAmenities) {
    exportData.facilityAmenities = [];
  }
  const existingAmenities = new Set(
    exportData.facilityAmenities.map(
      (fa) => `${fa.facilityId}|${fa.amenityId}`
    )
  );

  let hoursUpdated = 0;
  let pricingUpdated = 0;
  let amenitiesAdded = 0;

  // PHP script parts
  const phpUpdates: string[] = [];
  const phpAmenities: string[] = [];

  for (const result of results) {
    const facility = facilityMap.get(result.facilityId);
    if (!facility) continue;

    // Update opening hours
    if (result.openingHours && !facility.openingHours) {
      facility.openingHours = result.openingHours;
      hoursUpdated++;

      const hoursJson = JSON.stringify(result.openingHours).replace(
        /'/g,
        "\\'"
      );
      phpUpdates.push(
        `    ['${facility.id}', 'openingHours', '${hoursJson}'],`
      );
    }

    // Update pricing
    if (result.pricingText && !facility.pricing) {
      facility.pricing = result.pricingText;
      pricingUpdated++;

      const pricingEsc = result.pricingText
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
      phpUpdates.push(
        `    ['${facility.id}', 'pricing', '${pricingEsc}'],`
      );
    }

    // Add amenities
    for (const slug of result.amenitySlugs) {
      const amenityId = amenityMap.get(slug);
      if (!amenityId) continue;
      const key = `${result.facilityId}|${amenityId}`;
      if (existingAmenities.has(key)) continue;
      existingAmenities.add(key);

      exportData.facilityAmenities!.push({
        id: `firmy-amenity-${amenitiesAdded + 1}`,
        facilityId: result.facilityId,
        amenityId,
      });
      amenitiesAdded++;

      phpAmenities.push(
        `    ['${result.facilityId}', '${amenityId}'],`
      );
    }
  }

  // Save updated export
  writeFileSync(EXPORT_PATH, JSON.stringify(exportData, null, 2), "utf-8");
  console.log(`Updated: ${EXPORT_PATH}`);
  console.log(`  Opening hours: ${hoursUpdated}`);
  console.log(`  Pricing: ${pricingUpdated}`);
  console.log(`  Amenities: ${amenitiesAdded}`);

  // Generate PHP migration script
  const php = generatePhp(phpUpdates, phpAmenities);
  writeFileSync(PHP_OUTPUT, php, "utf-8");
  console.log(`PHP script: ${PHP_OUTPUT}`);
}

function generatePhp(updates: string[], amenities: string[]): string {
  return `<?php
/**
 * Firmy.cz detail enrichment — generated by enrich-firmy-details.ts
 * Updates opening hours, pricing, and amenities from firmy.cz.
 *
 * Upload to server and run via SSH:
 *   ssh -p 2741 hraju_cz@replikant996.thinline.cz php hraju.cz/firmy-enrich-details.php
 */

$host = '127.0.0.1';
$port = 3306;
$db   = getenv('DB_NAME') ?: 'hraju_cz';
$user = getenv('DB_USER') ?: 'hraju_cz';
$pass = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected to database.\\n";
} catch (PDOException $e) {
    die("DB connection failed: " . $e->getMessage() . "\\n");
}

function generateId($len = 16) {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    $id = '';
    for ($i = 0; $i < $len; $i++) {
        $id .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $id;
}

// ── Opening Hours + Pricing Updates ──
$updates = [
${updates.join("\n")}
];

$stmtHours = $pdo->prepare("UPDATE Facility SET openingHours = :val, updatedAt = NOW() WHERE id = :id AND openingHours IS NULL");
$stmtPricing = $pdo->prepare("UPDATE Facility SET pricing = :val, updatedAt = NOW() WHERE id = :id AND pricing IS NULL");
$updated = 0;
$errors = 0;

foreach ($updates as $row) {
    try {
        if ($row[1] === 'openingHours') {
            $stmtHours->execute(['val' => $row[2], 'id' => $row[0]]);
        } else {
            $stmtPricing->execute(['val' => $row[2], 'id' => $row[0]]);
        }
        $updated++;
    } catch (PDOException $e) {
        $errors++;
        echo "Error updating " . $row[0] . ": " . $e->getMessage() . "\\n";
    }
}

echo "Facility updates: $updated done, $errors errors\\n";

// ── Amenity Links ──
$amenities = [
${amenities.join("\n")}
];

$stmtAmenity = $pdo->prepare(
    "INSERT INTO FacilityAmenity (id, facilityId, amenityId)
     VALUES (:id, :fid, :aid)
     ON DUPLICATE KEY UPDATE id=id"
);
$amenityAdded = 0;

foreach ($amenities as $row) {
    try {
        $stmtAmenity->execute(['id' => generateId(), 'fid' => $row[0], 'aid' => $row[1]]);
        $amenityAdded++;
    } catch (PDOException $e) {
        echo "Amenity error: " . $e->getMessage() . "\\n";
    }
}

echo "Amenities added: $amenityAdded\\n";
echo "Done.\\n";
`;
}

main().catch(console.error);

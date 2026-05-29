/**
 * KCT Tourist Event Crawler
 *
 * Crawls tourist events from kalendar.kct-db.cz and upserts them
 * into the TouristEvent table.
 *
 * Usage: npx tsx scripts/crawl-kct-events.ts
 */

import * as dotenv from "dotenv";
dotenv.config();

import * as cheerio from "cheerio";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BASE_URL = "https://kalendar.kct-db.cz/texty";
const LIST_URL = `${BASE_URL}/kalendarakci.php`;
const DETAIL_URL = `${BASE_URL}/kalendarakci-detail.php`;
const USER_AGENT = "hraju.cz-crawler/1.0 (+https://www.hraju.cz)";
const DELAY_MS = 500;

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

interface EventRow {
  xid: string;
  name: string;
  dateStart: Date;
  dateEnd: Date | null;
  city: string;
  region: string | null;
}

interface EventDetail {
  description: string | null;
  lat: number | null;
  lng: number | null;
  externalUrl: string | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(url: string, body?: URLSearchParams): Promise<string> {
  const options: RequestInit = {
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  if (body) {
    options.method = "POST";
    options.body = body.toString();
  }

  const res = await fetch(url, options);
  const buffer = await res.arrayBuffer();
  // KCT site uses windows-1250 encoding
  const decoder = new TextDecoder("windows-1250");
  return decoder.decode(buffer);
}

/**
 * Parse Czech date format: "21. 3. 2026" → Date
 */
function parseCzechDate(text: string): Date | null {
  const cleaned = text.trim().replace(/\s+/g, " ");
  const match = cleaned.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/**
 * Parse a list page and extract event rows
 */
function parseListPage(html: string): { events: EventRow[]; totalPages: number } {
  const $ = cheerio.load(html);
  const events: EventRow[] = [];

  // Extract total pages from "stránka: 1 / 3"
  let totalPages = 1;
  const pageInfo = $("p:contains('stránka:')").text();
  const pageMatch = pageInfo.match(/stránka:\s*\d+\s*\/\s*(\d+)/);
  if (pageMatch) {
    totalPages = Number(pageMatch[1]);
  }

  // Each event is a <tr> with a detail link
  $("table tr").each((_, row) => {
    const $row = $(row);
    const cells = $row.find("td");
    if (cells.length < 3) return;

    // Column 1: date
    const dateCell = $(cells[0]).text().trim();

    // Column 2: name + detail link
    const nameCell = $(cells[1]);
    const detailLink = nameCell.find("a[href*='kalendarakci-detail.php']").first();
    const href = detailLink.attr("href") || "";
    const xidMatch = href.match(/xid=(\d+)/);
    if (!xidMatch) return;

    const xid = xidMatch[1];

    // Extract event name from bold text
    const name = nameCell.find("b").first().text().trim();
    if (!name) return;

    // Parse date(s) - single date or range with "až"
    const dateText = dateCell.replace(/\s+/g, " ");
    let dateStart: Date | null = null;
    let dateEnd: Date | null = null;

    if (dateText.includes("až")) {
      const parts = dateText.split("až");
      dateStart = parseCzechDate(parts[0]);
      dateEnd = parseCzechDate(parts[1]);
    } else {
      dateStart = parseCzechDate(dateText);
    }

    if (!dateStart) return;

    // Column 3: city + optional district
    const locationCell = $(cells[2]);
    const cityText = locationCell.find("a").first().clone().children("i").remove().end().text().trim();
    const city = cityText || locationCell.text().trim().split("\n")[0].trim();
    const districtEl = locationCell.find("i");
    let region: string | null = null;
    if (districtEl.length) {
      const districtText = districtEl.text().trim();
      const okrMatch = districtText.match(/okr:\s*(.+)/);
      if (okrMatch) {
        region = okrMatch[1].trim();
      }
    }

    events.push({
      xid,
      name,
      dateStart,
      dateEnd,
      city: city.replace(/\u00a0/g, " ").trim(),
      region,
    });
  });

  return { events, totalPages };
}

/**
 * Fetch and parse an event detail page for description and GPS
 */
async function fetchEventDetail(xid: string): Promise<EventDetail> {
  const html = await fetchPage(`${DETAIL_URL}?xid=${xid}`);
  const $ = cheerio.load(html);

  // Extract description - look for main text content
  let description: string | null = null;
  // The description is typically in a <p> or <td> after event metadata
  const descCandidates = $("td").filter((_, el) => {
    const text = $(el).text().trim();
    return text.length > 100 && !text.includes("Filtry pro vyhledání");
  });
  if (descCandidates.length) {
    description = $(descCandidates[0]).text().trim().slice(0, 2000);
  }

  // Extract GPS from data attributes
  let lat: number | null = null;
  let lng: number | null = null;

  const gpsN = $("[data_startgpsn]").attr("data_startgpsn") ||
    $("[data_stredgpsn]").attr("data_stredgpsn");
  const gpsE = $("[data_startgpse]").attr("data_startgpse") ||
    $("[data_stredgpse]").attr("data_stredgpse");

  if (gpsN && gpsE) {
    const parsedLat = parseFloat(gpsN);
    const parsedLng = parseFloat(gpsE);
    if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0 && parsedLng !== 0) {
      lat = parsedLat;
      lng = parsedLng;
    }
  }

  // External URL (organizer website)
  let externalUrl: string | null = null;
  $("a[href^='http']").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (
      !href.includes("kct-db.cz") &&
      !href.includes("mapy.cz") &&
      !href.includes("seznam.cz") &&
      !href.includes("akcekct")
    ) {
      externalUrl = href;
      return false; // break
    }
  });

  return { description, lat, lng, externalUrl };
}

// KCT regions 101–114 cover all of Czech Republic.
// There is no "all regions" option — each region must be queried separately.
const KCT_REGIONS = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];

async function crawlRegion(oblast: number, fromDate: string): Promise<EventRow[]> {
  const regionEvents: EventRow[] = [];
  const formData = new URLSearchParams({
    xfrom: fromDate,
    xto: "31. 12. 2027",
    xoblast: String(oblast),
    xlimit: "100",
    xpage: "1",
    xkalendar_stat: "1",
    xkalendar_oblast: "1",
  });

  console.log(`  Oblast ${oblast} — page 1...`);
  const firstPageHtml = await fetchPage(LIST_URL, formData);
  const { events: firstPageEvents, totalPages } = parseListPage(firstPageHtml);
  regionEvents.push(...firstPageEvents);
  console.log(`    ${firstPageEvents.length} events (${totalPages} pages)`);

  for (let page = 2; page <= totalPages; page++) {
    await sleep(DELAY_MS);
    console.log(`  Oblast ${oblast} — page ${page}...`);
    formData.set("xpage", String(page));
    const html = await fetchPage(LIST_URL, formData);
    const { events } = parseListPage(html);
    regionEvents.push(...events);
    console.log(`    ${events.length} events`);
  }

  return regionEvents;
}

async function crawlAllPages(): Promise<EventRow[]> {
  const fromDate = new Date().toLocaleDateString("cs-CZ");
  const seenXids = new Set<string>();
  const allEvents: EventRow[] = [];

  for (const oblast of KCT_REGIONS) {
    await sleep(DELAY_MS);
    const regionEvents = await crawlRegion(oblast, fromDate);
    for (const e of regionEvents) {
      if (!seenXids.has(e.xid)) {
        seenXids.add(e.xid);
        allEvents.push(e);
      }
    }
  }

  return allEvents;
}

async function main() {
  console.log("=== KCT Event Crawler ===\n");

  // Step 1: Crawl list pages
  const events = await crawlAllPages();
  console.log(`\nTotal events found: ${events.length}\n`);

  if (events.length === 0) {
    console.log("No events found. Exiting.");
    return;
  }

  let created = 0;
  let updated = 0;
  let errors = 0;

  // Step 2: Fetch details and upsert
  for (const event of events) {
    try {
      await sleep(DELAY_MS);
      console.log(`Processing: ${event.name} (xid=${event.xid})...`);

      const detail = await fetchEventDetail(event.xid);

      const sourceId = `kct-${event.xid}`;
      const existing = await prisma.touristEvent.findUnique({
        where: { sourceId },
        select: { id: true },
      });

      await prisma.touristEvent.upsert({
        where: { sourceId },
        create: {
          sourceId,
          name: event.name,
          dateStart: event.dateStart,
          dateEnd: event.dateEnd,
          city: event.city,
          region: event.region,
          description: detail.description,
          externalUrl: detail.externalUrl,
          lat: detail.lat,
          lng: detail.lng,
          source: "kct",
        },
        update: {
          name: event.name,
          dateStart: event.dateStart,
          dateEnd: event.dateEnd,
          city: event.city,
          region: event.region,
          description: detail.description,
          externalUrl: detail.externalUrl,
          lat: detail.lat,
          lng: detail.lng,
        },
      });

      if (existing) {
        updated++;
      } else {
        created++;
      }
    } catch (error) {
      errors++;
      console.error(`  Error processing ${event.name}:`, error);
    }
  }

  // Step 3: Cleanup old events
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { count: deactivated } = await prisma.touristEvent.updateMany({
    where: {
      source: "kct",
      isActive: true,
      dateStart: { lt: sevenDaysAgo },
      dateEnd: { lt: sevenDaysAgo },
    },
    data: { isActive: false },
  });

  // Also deactivate events without dateEnd that are past
  const { count: deactivatedSingle } = await prisma.touristEvent.updateMany({
    where: {
      source: "kct",
      isActive: true,
      dateEnd: null,
      dateStart: { lt: sevenDaysAgo },
    },
    data: { isActive: false },
  });

  console.log("\n=== Crawl Summary ===");
  console.log(`Events found:     ${events.length}`);
  console.log(`Created:          ${created}`);
  console.log(`Updated:          ${updated}`);
  console.log(`Errors:           ${errors}`);
  console.log(`Deactivated:      ${deactivated + deactivatedSingle}`);
  console.log("=====================\n");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Crawler failed:", error);
  process.exit(1);
});

/**
 * Scrapes route statistics from praha-prcice.cz for years 2019–2025.
 * Run with: npx tsx scripts/scrape-prcice.ts
 */

import * as https from "https";
import * as http from "http";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as never);

function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(
      url,
      { headers: { "User-Agent": "Mozilla/5.0 hraju.cz scraper" } },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      }
    );
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Timeout: ${url}`));
    });
  });
}

interface RouteData {
  year: number;
  routeName: string;
  distanceKm: number;
  participants: number;
}

function parseRoutes(html: string, year: number): RouteData[] {
  const routes: RouteData[] = [];

  // Extract table rows
  const rowRegex = /<tr[^>]*class="[^"]*(?:pesi|detska|cyklo|invalidni)[^"]*"[^>]*>([\s\S]*?)<\/tr>/g;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const row = rowMatch[1];

    // Route name from <a class="trasa_nazev">
    const nameMatch = row.match(/<a[^>]+class="trasa_nazev"[^>]*>([^<]+)<\/a>/);
    if (!nameMatch) continue;
    const routeName = nameMatch[1].trim();

    // Distance from <span class="delka">
    const distMatch = row.match(/<span class="delka">([\d+.]+)<\/span>/);
    if (!distMatch) continue;
    const distStr = distMatch[1].replace("+", "").trim();
    const distanceKm = parseFloat(distStr);
    if (isNaN(distanceKm)) continue;

    // Participants from <td class="pocet">
    const partMatch = row.match(/<td[^>]+class="pocet">(\d+)<\/td>/);
    if (!partMatch) continue;
    const participants = parseInt(partMatch[1], 10);
    if (isNaN(participants)) continue;

    routes.push({ year, routeName, distanceKm, participants });
  }

  return routes;
}

async function scrapeYear(year: number): Promise<RouteData[]> {
  const url = `https://praha-prcice.cz/${year}/trasa`;
  console.log(`Fetching ${url}...`);

  try {
    const html = await fetchHtml(url);

    // Check if this year's page exists
    if (html.includes("404") || html.includes("Stránka nenalezena") || html.length < 1000) {
      console.log(`  → Year ${year}: page not found or empty`);
      return [];
    }

    const routes = parseRoutes(html, year);
    console.log(`  → Year ${year}: found ${routes.length} routes`);
    return routes;
  } catch (err) {
    console.error(`  → Year ${year}: error - ${err}`);
    return [];
  }
}

async function main() {
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
  let totalUpserted = 0;

  for (const year of years) {
    const routes = await scrapeYear(year);

    for (const route of routes) {
      await prisma.prciceRoute.upsert({
        where: { year_routeName: { year: route.year, routeName: route.routeName } },
        create: {
          year: route.year,
          routeName: route.routeName,
          distanceKm: route.distanceKm,
          participants: route.participants,
        },
        update: {
          distanceKm: route.distanceKm,
          participants: route.participants,
        },
      });
      totalUpserted++;
    }

    // Small delay to be polite
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone. Upserted ${totalUpserted} routes total.`);

  const summary = await prisma.prciceRoute.groupBy({
    by: ["year"],
    _count: { id: true },
    _sum: { participants: true },
    orderBy: { year: "asc" },
  });

  console.log("\nSummary by year:");
  for (const row of summary) {
    console.log(`  ${row.year}: ${row._count.id} routes, ${row._sum.participants} total participants`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});

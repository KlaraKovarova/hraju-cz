#!/usr/bin/env tsx
/**
 * Scrape email addresses from facility websites.
 * Fetches homepage + common contact pages, extracts emails via regex.
 * Inserts as EMAIL contacts into the Contact table.
 *
 * Prioritizes Praha/Brno, tenis/squash facilities.
 *
 * Usage:
 *   npx tsx scripts/scrape-emails.ts              # dry run
 *   npx tsx scripts/scrape-emails.ts --apply      # insert into DB
 *   npx tsx scripts/scrape-emails.ts --limit 100  # limit to N facilities
 */

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";

dotenv.config();

const APPLY = process.argv.includes("--apply");
const LIMIT_FLAG = process.argv.indexOf("--limit");
const MAX_FACILITIES = LIMIT_FLAG !== -1 ? parseInt(process.argv[LIMIT_FLAG + 1], 10) : 0;
const RATE_LIMIT_MS = 1000; // 1 request per second
const TIMEOUT_MS = 8000;
const CONTACT_PAGES = ["", "/kontakt", "/contact", "/o-nas", "/kontakty"];

const MAX_EMAILS_PER_FACILITY = 2;

// Common junk emails/patterns to filter out
const JUNK_PATTERNS = [
  "example.com", "test@test", "email@email",
  "noreply@", "no-reply@", "mailer-daemon@",
  "vas@email", "wixpress.com", "sentry.io",
  "@w3.org", "@sentry", "support@wix",
  "kontakt@example", "wordpress@",
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractEmails(html: string): string[] {
  // Match mailto: links and email patterns in text
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = html.match(emailRegex) || [];

  // Deduplicate and filter
  const unique = [...new Set(matches.map((e) => e.toLowerCase()))];
  return unique.filter((email) => {
    // Filter out image/asset file extensions mistakenly matched
    if (/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|ttf|eot)$/i.test(email)) return false;
    // Filter junk patterns
    for (const junk of JUNK_PATTERNS) {
      if (email.includes(junk)) return false;
    }
    // Must have valid TLD
    if (!/\.[a-z]{2,}$/.test(email)) return false;
    return true;
  });
}

/** Rank emails: prefer info@, kontakt@, recepce@, then domain-matching, then others */
function rankEmails(emails: string[], websiteDomain: string): string[] {
  const preferred = ["info@", "kontakt@", "recepce@", "office@", "rezervace@"];
  return [...emails].sort((a, b) => {
    const aPref = preferred.findIndex((p) => a.startsWith(p));
    const bPref = preferred.findIndex((p) => b.startsWith(p));
    const aScore = aPref !== -1 ? aPref : 100;
    const bScore = bPref !== -1 ? bPref : 100;
    if (aScore !== bScore) return aScore - bScore;
    // Prefer same domain as website
    const aDomain = a.includes(websiteDomain) ? 0 : 1;
    const bDomain = b.includes(websiteDomain) ? 0 : 1;
    return aDomain - bDomain;
  });
}

function normalizeUrl(url: string): string {
  let u = url.trim();
  if (!u.startsWith("http://") && !u.startsWith("https://")) {
    u = "https://" + u;
  }
  // Remove trailing slash
  return u.replace(/\/+$/, "");
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; hraju.cz/1.0; +https://hraju.cz)",
        "Accept": "text/html",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log(`Mode: ${APPLY ? "APPLY (will insert into DB)" : "DRY RUN"}`);

  // Get facilities with website contacts but no email
  const facilitiesWithWebsite = await prisma.facility.findMany({
    where: {
      isActive: true,
      contacts: {
        some: { type: "WEBSITE" },
        none: { type: "EMAIL" },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      contacts: {
        where: { type: "WEBSITE" },
        select: { value: true },
      },
      location: { select: { city: true, region: true } },
      sports: { select: { sport: { select: { slug: true } } } },
    },
    orderBy: { name: "asc" },
  });

  console.log(`Found ${facilitiesWithWebsite.length} facilities with website but no email`);

  // Prioritize: Praha/Brno first, then squash/lezeni
  const prioritized = facilitiesWithWebsite.sort((a, b) => {
    const aScore = getPriorityScore(a);
    const bScore = getPriorityScore(b);
    return bScore - aScore;
  });

  function getPriorityScore(f: { location: { city: string }; sports: { sport: { slug: string } }[] }): number {
    let score = 0;
    if (f.location.city.startsWith("Praha")) score += 2;
    if (f.location.city === "Brno") score += 1;
    if (f.sports.some((s) => s.sport.slug === "squash")) score += 1;
    if (f.sports.some((s) => s.sport.slug === "lezeni")) score += 1;
    return score;
  }

  const toProcess = MAX_FACILITIES > 0 ? prioritized.slice(0, MAX_FACILITIES) : prioritized;
  console.log(`Processing ${toProcess.length} facilities...\n`);

  let totalScraped = 0;
  let totalEmailsFound = 0;
  let totalInserted = 0;
  const results: { facility: string; city: string; website: string; emails: string[] }[] = [];

  for (const facility of toProcess) {
    const website = facility.contacts[0]?.value;
    if (!website) continue;

    const baseUrl = normalizeUrl(website);
    const foundEmails = new Set<string>();

    for (const path of CONTACT_PAGES) {
      const url = baseUrl + path;
      const html = await fetchPage(url);
      if (html) {
        for (const email of extractEmails(html)) {
          foundEmails.add(email);
        }
      }
      await sleep(RATE_LIMIT_MS);
    }

    totalScraped++;
    // Rank and limit emails
    const domain = new URL(baseUrl).hostname.replace(/^www\./, "");
    const emails = rankEmails([...foundEmails], domain).slice(0, MAX_EMAILS_PER_FACILITY);

    if (emails.length > 0) {
      totalEmailsFound += emails.length;
      results.push({
        facility: facility.name,
        city: facility.location.city,
        website: baseUrl,
        emails,
      });

      console.log(`[${totalScraped}/${toProcess.length}] ${facility.name} (${facility.location.city}) — ${emails.join(", ")}`);

      if (APPLY) {
        // Insert first email as primary, rest as non-primary
        for (let i = 0; i < emails.length; i++) {
          await prisma.contact.create({
            data: {
              facilityId: facility.id,
              type: "EMAIL",
              value: emails[i],
              isPrimary: i === 0,
            },
          });
          totalInserted++;
        }
      }
    } else {
      if (totalScraped % 50 === 0) {
        console.log(`[${totalScraped}/${toProcess.length}] ${facility.name} — no emails found`);
      }
    }
  }

  console.log("\n--- Results ---");
  console.log(`Facilities scraped: ${totalScraped}`);
  console.log(`Facilities with emails: ${results.length}`);
  console.log(`Total emails found: ${totalEmailsFound}`);
  if (APPLY) {
    console.log(`Emails inserted into DB: ${totalInserted}`);
  } else {
    console.log("(Dry run — use --apply to insert into DB)");
  }
  console.log(`Success rate: ${((results.length / totalScraped) * 100).toFixed(1)}%`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

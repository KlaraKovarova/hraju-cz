/**
 * firmy.cz scraper
 * Scrapes facility data for 8 sport categories and saves as JSON.
 * Run: npx tsx scripts/scrape-firmy.ts
 */

import { chromium, type Browser, type Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface Facility {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  website: string;
  description: string;
  sport: string;
}

const SPORTS = [
  { slug: 'squash', query: 'squash', label: 'squash' },
  { slug: 'plavani', query: 'plaveck%C3%A9+baz%C3%A9ny', label: 'plavecké bazény' },
  { slug: 'golf', query: 'golf+h%C5%99i%C5%A1t%C4%9B', label: 'golf hřiště' },
  { slug: 'fitness', query: 'fitness+centrum', label: 'fitness centrum' },
  { slug: 'bowling', query: 'bowling', label: 'bowling' },
  { slug: 'stolni-tenis', query: 'stoln%C3%AD+tenis', label: 'stolní tenis' },
  { slug: 'florbal', query: 'florbal', label: 'florbal' },
];

const DATA_DIR = path.join(__dirname, 'data');
const DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract city from addressLocality (e.g. "Brno, Žabovřesky" → "Brno")
 */
function cityFromLocality(addressLocality?: string): string {
  if (!addressLocality) return '';
  return addressLocality.split(',')[0].trim();
}

/**
 * Extract city from full address text (fallback when addressLocality missing).
 * E.g. "Žabovřeská 581/3, Brno, Žabovřesky" → "Brno"
 *      "Golfová 2285/8, Říčany" → "Říčany"
 *      "Kostelec u Křížků 171" → "Kostelec u Křížků"
 */
function cityFromAddressText(addressText: string): string {
  const parts = addressText.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    // "Street, City, District" → City
    return parts[1];
  }
  if (parts.length === 2) {
    // "Street, City" → City
    return parts[1];
  }
  // Single part: "Village HouseNum" → strip trailing digits
  return addressText.replace(/\s+\d+[/\d]*$/, '').trim();
}

function extractWebsite(sameAs?: string[]): string {
  if (!sameAs) return '';
  for (const url of sameAs) {
    if (!url.includes('firmy.cz') && url.startsWith('http')) {
      return url;
    }
  }
  return '';
}

async function acceptCookies(page: Page): Promise<void> {
  try {
    const selectors = [
      'button[data-dot="accept-all"]',
      'button:has-text("Přijmout vše")',
      'button:has-text("Souhlasím")',
      'button:has-text("Přijmout")',
    ];
    for (const sel of selectors) {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        await sleep(1000);
        return;
      }
    }
  } catch {
    // No cookie banner present
  }
}

async function scrapePage(page: Page): Promise<Omit<Facility, 'sport'>[]> {
  // Extract ld+json from each premiseBox and HTML address text for city fallback
  const raw = await page.$$eval('article.premiseBox', articles => {
    return articles.map(article => {
      const ldEl = article.querySelector('script[type="application/ld+json"]');
      let ld: Record<string, unknown> | null = null;
      try { ld = JSON.parse(ldEl?.textContent || ''); } catch { ld = null; }

      // Fallback: HTML address text for city
      const addrEl = article.querySelector('[data-dot="address"]');
      const addressText = addrEl?.textContent?.trim() || '';

      return { ld, addressText };
    });
  });

  const results: Omit<Facility, 'sport'>[] = [];

  for (const { ld, addressText } of raw) {
    if (!ld?.name) continue;
    const addr = ld.address as Record<string, string> | undefined;
    const localityCity = cityFromLocality(addr?.addressLocality);
    const city = localityCity || cityFromAddressText(addressText);

    results.push({
      name: String(ld.name),
      address: addr?.streetAddress || '',
      city,
      postalCode: addr?.postalCode || '',
      phone: String(ld.telephone || ''),
      website: extractWebsite(ld.sameAs as string[] | undefined),
      description: String(ld.description || ''),
    });
  }

  return results;
}

async function scrapeSport(browser: Browser, sport: typeof SPORTS[0]): Promise<Facility[]> {
  const page = await browser.newPage();
  const allFacilities: Facility[] = [];
  const seen = new Set<string>();
  let pageNum = 1;
  let cookiesAccepted = false;

  console.log(`\n[${sport.slug}] Scraping "${sport.label}"...`);

  while (true) {
    const url = pageNum === 1
      ? `https://www.firmy.cz/?q=${sport.query}&thru=cat`
      : `https://www.firmy.cz/?q=${sport.query}&page=${pageNum}`;

    console.log(`  Page ${pageNum}: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await sleep(DELAY_MS);

      if (!cookiesAccepted) {
        await acceptCookies(page);
        cookiesAccepted = true;
        await sleep(500);
      }

      const count = await page.$$eval('article.premiseBox', els => els.length).catch(() => 0);
      if (count === 0) {
        console.log(`  No results on page ${pageNum}, stopping.`);
        break;
      }

      const items = await scrapePage(page);
      let newCount = 0;
      for (const item of items) {
        const key = `${item.name}|${item.postalCode}|${item.address}`;
        if (!seen.has(key)) {
          seen.add(key);
          allFacilities.push({ ...item, sport: sport.slug });
          newCount++;
        }
      }

      console.log(`  Got ${items.length} items, ${newCount} new (total: ${allFacilities.length})`);

      const hasNext = await page.$('[data-dot="next"]').then(el => !!el).catch(() => false);
      if (!hasNext) {
        console.log(`  No next page, done.`);
        break;
      }

      pageNum++;
      await sleep(DELAY_MS);
    } catch (err) {
      console.error(`  Error on page ${pageNum}:`, (err as Error).message);
      break;
    }
  }

  await page.close();
  return allFacilities;
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Optional: filter by sport slugs via CLI args (e.g. npx tsx scrape-firmy.ts squash fitness)
  const filterSlugs = process.argv.slice(2).filter(a => !a.startsWith('-'));
  const sportsToScrape = filterSlugs.length > 0
    ? SPORTS.filter(s => filterSlugs.includes(s.slug))
    : SPORTS;

  if (filterSlugs.length > 0) {
    console.log(`Filtering to sports: ${sportsToScrape.map(s => s.slug).join(', ')}`);
  }

  const browser = await chromium.launch({ headless: true });
  const totals: Record<string, number> = {};

  for (const sport of sportsToScrape) {
    const facilities = await scrapeSport(browser, sport);
    totals[sport.slug] = facilities.length;

    const outPath = path.join(DATA_DIR, `firmy-${sport.slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(facilities, null, 2), 'utf-8');
    console.log(`  Saved ${facilities.length} to ${outPath}`);
  }

  await browser.close();

  console.log('\n=== SUMMARY ===');
  let total = 0;
  for (const [sport, count] of Object.entries(totals)) {
    console.log(`  ${sport}: ${count}`);
    total += count;
  }
  console.log(`  Total: ${total}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

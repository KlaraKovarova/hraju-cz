/**
 * firmy.cz → DB import via Adminer
 * Alternative to import-firmy.ts when direct DB connection is unavailable.
 * Generates SQL from JSON files and executes via Adminer HTTP API.
 *
 * Run: npx tsx scripts/import-firmy-adminer.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ADMINER_URL = 'https://hraju.cz/adminer-5.4.2-cs.php';
const BATCH_SIZE = 80; // facilities per Adminer request

// ─── Czech regions map ───────────────────────────────────────────────────────

const CITY_TO_REGION: Record<string, string> = {
  Praha: 'Praha',
  Brno: 'Jihomoravský kraj',
  Ostrava: 'Moravskoslezský kraj',
  Plzeň: 'Plzeňský kraj',
  Liberec: 'Liberecký kraj',
  Olomouc: 'Olomoucký kraj',
  'Hradec Králové': 'Královéhradecký kraj',
  Pardubice: 'Pardubický kraj',
  'České Budějovice': 'Jihočeský kraj',
  'Ústí nad Labem': 'Ústecký kraj',
  Zlín: 'Zlínský kraj',
  Jihlava: 'Kraj Vysočina',
  'Karlovy Vary': 'Karlovarský kraj',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ð/g, 'd')
    .replace(/ø/g, 'o')
    .replace(/þ/g, 'th');
}

function generateSlug(name: string): string {
  return removeDiacritics(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 200);
}

function escSql(val: string): string {
  return val
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x00/g, '\\0');
}

function s(val: string | null | undefined, maxLen = 191): string {
  if (val == null || val === '') return 'NULL';
  const truncated = val.length > maxLen ? val.substring(0, maxLen) : val;
  return `'${escSql(truncated)}'`;
}

// ─── Adminer helpers ──────────────────────────────────────────────────────────

function parseDbUrl(url: string) {
  const u = new URL(url);
  return {
    user: u.username,
    password: u.password,
    database: u.pathname.replace(/^\//, ''),
  };
}

function extractCookies(headers: Headers): string[] {
  const raw = headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(';')[0]);
}

function mergeCookies(existing: string, newCookies: string[]): string {
  const map = new Map<string, string>();
  for (const c of existing.split('; ').filter(Boolean)) {
    const [k] = c.split('=', 1);
    map.set(k, c);
  }
  for (const c of newCookies) {
    const [k] = c.split('=', 1);
    map.set(k, c);
  }
  return [...map.values()].join('; ');
}

async function adminerLogin(
  user: string,
  password: string,
  db: string
): Promise<{ cookies: string; token: string }> {
  const initResp = await fetch(ADMINER_URL, { redirect: 'manual' });
  let cookies = mergeCookies('', extractCookies(initResp.headers));

  const loginBody = new URLSearchParams({
    'auth[driver]': 'server',
    'auth[server]': '',
    'auth[username]': user,
    'auth[password]': password,
    'auth[db]': db,
  });

  const loginResp = await fetch(ADMINER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookies },
    body: loginBody.toString(),
    redirect: 'manual',
  });
  cookies = mergeCookies(cookies, extractCookies(loginResp.headers));

  const loc = loginResp.headers.get('location');
  if (loc) {
    const redirectUrl = loc.startsWith('http')
      ? loc
      : `https://hraju.cz/${loc.replace(/^\//, '')}`;
    const followResp = await fetch(redirectUrl, { headers: { Cookie: cookies }, redirect: 'manual' });
    cookies = mergeCookies(cookies, extractCookies(followResp.headers));
  }

  const sqlPageResp = await fetch(
    `${ADMINER_URL}?server=&username=${user}&db=${db}&sql=`,
    { headers: { Cookie: cookies }, redirect: 'manual' }
  );
  cookies = mergeCookies(cookies, extractCookies(sqlPageResp.headers));
  const sqlHtml = await sqlPageResp.text();

  const tokenMatch = sqlHtml.match(/name='token' value='([^']+)'/);
  if (!tokenMatch) {
    if (sqlHtml.includes('auth[username]')) throw new Error('Not logged in — wrong credentials?');
    throw new Error('Failed to extract CSRF token from Adminer');
  }

  return { cookies, token: tokenMatch[1] };
}

async function execSql(
  sql: string,
  user: string,
  db: string,
  cookies: string,
  token: string
): Promise<{ errors: string[]; token: string }> {
  const params = new URLSearchParams();
  params.append('token', token);
  params.append('query', sql);
  params.append('limit', '');
  params.append('error_stops', '0');
  params.append('only_errors', '1');

  const resp = await fetch(
    `${ADMINER_URL}?server=&username=${user}&db=${db}&sql=`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookies },
      body: params.toString(),
    }
  );
  const resultHtml = await resp.text();

  // Refresh token from response if available
  const newTokenMatch = resultHtml.match(/name='token' value='([^']+)'/);
  const nextToken = newTokenMatch ? newTokenMatch[1] : token;

  const errors = (resultHtml.match(/<div class='error'>(.*?)<\/div>/gs) ?? [])
    .map((m) => m.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);

  return { errors, token: nextToken };
}

// ─── SQL generation ───────────────────────────────────────────────────────────

interface FacilityData {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  website: string;
  description: string;
  sport: string;
}

interface ProcessedFacility {
  slug: string;
  name: string;
  address: string;
  postalCode: string;
  phone: string | null;
  website: string | null;
  description: string | null;
  city: string;
  region: string | null;
  sportSlug: string;
}

function buildLocationSql(city: string, region: string | null): string {
  const cond = region != null
    ? `city = ${s(city)} AND region = ${s(region)}`
    : `city = ${s(city)} AND region IS NULL`;
  return (
    `INSERT INTO \`Location\` (id, city, region, country, createdAt, updatedAt)\n` +
    `SELECT UUID(), ${s(city)}, ${s(region)}, 'CZ', NOW(3), NOW(3)\n` +
    `WHERE NOT EXISTS (SELECT 1 FROM \`Location\` WHERE ${cond});\n`
  );
}

function buildFacilitySql(f: ProcessedFacility): string {
  const locCond = f.region != null
    ? `city = ${s(f.city)} AND region = ${s(f.region)}`
    : `city = ${s(f.city)} AND region IS NULL`;

  let sql =
    `INSERT IGNORE INTO \`Facility\` (id, name, slug, description, address, postalCode, locationId, website, isActive, isClaimed, isPremium, createdAt, updatedAt)\n` +
    `SELECT UUID(), ${s(f.name)}, ${s(f.slug)}, ${s(f.description)}, ${s(f.address)}, ${s(f.postalCode)}, ` +
    `(SELECT id FROM \`Location\` WHERE ${locCond} LIMIT 1), ` +
    `${s(f.website)}, 1, 0, 0, NOW(3), NOW(3);\n`;

  // FacilitySport link
  sql +=
    `INSERT IGNORE INTO \`FacilitySport\` (id, facilityId, sportId, createdAt)\n` +
    `SELECT UUID(), fac.id, spt.id, NOW(3)\n` +
    `FROM \`Facility\` fac, \`Sport\` spt\n` +
    `WHERE fac.slug = ${s(f.slug)} AND spt.slug = ${s(f.sportSlug)};\n`;

  // Phone contact
  if (f.phone) {
    sql +=
      `INSERT INTO \`Contact\` (id, facilityId, type, value, label, isPrimary, createdAt)\n` +
      `SELECT UUID(), fac.id, 'PHONE', ${s(f.phone)}, 'Recepce', 1, NOW(3)\n` +
      `FROM \`Facility\` fac\n` +
      `WHERE fac.slug = ${s(f.slug)}\n` +
      `AND NOT EXISTS (SELECT 1 FROM \`Contact\` c WHERE c.facilityId = fac.id AND c.type = 'PHONE');\n`;
  }

  // Website contact
  if (f.website) {
    sql +=
      `INSERT INTO \`Contact\` (id, facilityId, type, value, isPrimary, createdAt)\n` +
      `SELECT UUID(), fac.id, 'WEBSITE', ${s(f.website)}, ${f.phone ? 0 : 1}, NOW(3)\n` +
      `FROM \`Facility\` fac\n` +
      `WHERE fac.slug = ${s(f.slug)}\n` +
      `AND NOT EXISTS (SELECT 1 FROM \`Contact\` c WHERE c.facilityId = fac.id AND c.type = 'WEBSITE');\n`;
  }

  return sql;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const config = parseDbUrl(dbUrl);
  const DATA_DIR = path.join(__dirname, 'data');
  const SPORTS = ['tenis', 'squash', 'badminton', 'volejbal', 'plavani', 'golf', 'fitness', 'bowling'];

  console.log('hraju.cz — importing firmy.cz data via Adminer');
  console.log(`DB: ${dbUrl.replace(/:([^:@]+)@/, ':***@')}`);

  // ── Load & process all JSON files ──
  const slugSet = new Set<string>();
  const allFacilities: ProcessedFacility[] = [];
  const uniqueLocations = new Map<string, { city: string; region: string | null }>();

  for (const sportSlug of SPORTS) {
    const jsonPath = path.join(DATA_DIR, `firmy-${sportSlug}.json`);
    if (!fs.existsSync(jsonPath)) {
      console.log(`  [${sportSlug}] file not found, skipping`);
      continue;
    }

    const data: FacilityData[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`  [${sportSlug}] loaded ${data.length} entries`);

    for (const f of data) {
      // Slug deduplication
      let baseSlug = generateSlug(f.name) || `facility-${Date.now()}`;
      let slug = baseSlug;
      let counter = 2;
      while (slugSet.has(slug)) {
        slug = `${baseSlug}-${counter++}`;
      }
      slugSet.add(slug);

      const city = f.city || f.address.split(',').pop()?.trim() || 'Neznámé';
      const region = CITY_TO_REGION[city] ?? null;
      const locKey = `${city}|||${region ?? '__null__'}`;
      if (!uniqueLocations.has(locKey)) {
        uniqueLocations.set(locKey, { city, region });
      }

      allFacilities.push({
        slug,
        name: f.name,
        address: f.address,
        postalCode: f.postalCode || null,
        phone: f.phone || null,
        website: f.website || null,
        description: f.description || null,
        city,
        region,
        sportSlug,
      });
    }
  }

  console.log(`\nTotal: ${allFacilities.length} facilities, ${uniqueLocations.size} unique locations`);

  // ── Login to Adminer ──
  console.log(`\nLogging into Adminer as ${config.user}...`);
  let { cookies, token } = await adminerLogin(config.user, config.password, config.database);
  console.log('Authenticated.');

  // ── Step 1: Insert all locations ──
  console.log(`\nInserting ${uniqueLocations.size} locations...`);
  const locationSql = Array.from(uniqueLocations.values())
    .map(({ city, region }) => buildLocationSql(city, region))
    .join('\n');

  const locResult = await execSql(locationSql, config.user, config.database, cookies, token);
  token = locResult.token;
  if (locResult.errors.length > 0) {
    console.error('  Location errors:', locResult.errors.slice(0, 5));
  } else {
    console.log('  Locations done.');
  }

  // ── Step 2: Insert facilities in batches ──
  const totalBatches = Math.ceil(allFacilities.length / BATCH_SIZE);
  console.log(`\nInserting ${allFacilities.length} facilities in ${totalBatches} batches of ${BATCH_SIZE}...`);

  let totalErrors = 0;
  for (let i = 0; i < allFacilities.length; i += BATCH_SIZE) {
    const batch = allFacilities.slice(i, i + BATCH_SIZE);
    const batchSql = batch.map(buildFacilitySql).join('\n');
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    process.stdout.write(`  Batch ${batchNum}/${totalBatches}... `);
    const result = await execSql(batchSql, config.user, config.database, cookies, token);
    token = result.token;

    if (result.errors.length > 0) {
      totalErrors += result.errors.length;
      console.log(`${result.errors.length} errors`);
      for (const e of result.errors.slice(0, 3)) {
        console.error(`    ${e}`);
      }
    } else {
      console.log('ok');
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Processed ${allFacilities.length} facilities`);
  if (totalErrors > 0) {
    console.log(`Completed with ${totalErrors} SQL errors (some records may not have imported)`);
  } else {
    console.log('No errors.');
  }
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});

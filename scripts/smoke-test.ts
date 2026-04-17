#!/usr/bin/env tsx
/**
 * Restore-day smoke-test for hraju.cz (sections A/E/F of restore playbook)
 *
 * Usage:
 *   npm run smoke                                # defaults to https://hraju.cz
 *   npm run smoke -- https://hraju.cz
 *   npm run smoke -- http://localhost:3000 --verbose
 *   npm run smoke -- https://hraju.cz --facility-slug=some-ferrata --user-id=abc
 *
 * Flags:
 *   --verbose            Print response body snippet on failure
 *   --sport=ferraty      Sport category to sample (default: ferraty)
 *   --facility-slug=X    Override auto-discovered facility slug
 *   --user-id=Y          Override auto-discovered user id (for A8/A9)
 *   --trip-report-id=Z   Override auto-discovered trip report id (for A6)
 *
 * Exits 0 if all pass, 1 on any failure. SKIPs do not fail the run.
 */

type Result = {
  id: string;
  label: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  detail: string;
  ms: number;
  bodySnippet?: string;
};

const args = process.argv.slice(2);
let baseUrl = 'https://hraju.cz';
const flags: Record<string, string | boolean> = {};
for (const a of args) {
  if (a.startsWith('--')) {
    const [k, v] = a.slice(2).split('=');
    flags[k] = v ?? true;
  } else if (!a.startsWith('-')) {
    baseUrl = a;
  }
}
baseUrl = baseUrl.replace(/\/$/, '');

const verbose = Boolean(flags.verbose);
const sport = (flags.sport as string) || 'ferraty';
let facilitySlug = flags['facility-slug'] as string | undefined;
let userId = flags['user-id'] as string | undefined;
let tripReportId = flags['trip-report-id'] as string | undefined;

const results: Result[] = [];

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const t0 = Date.now();
  const value = await fn();
  return { value, ms: Date.now() - t0 };
}

async function fetchText(
  url: string,
  init?: RequestInit & { manualRedirect?: boolean },
): Promise<{ status: number; body: string; location: string | null; ms: number }> {
  const t0 = Date.now();
  const res = await fetch(url, {
    redirect: init?.manualRedirect ? 'manual' : 'follow',
    headers: { 'User-Agent': 'hraju-smoke-test/1.0' },
    ...init,
  });
  const body = await res.text();
  return {
    status: res.status,
    body,
    location: res.headers.get('location'),
    ms: Date.now() - t0,
  };
}

function record(
  id: string,
  label: string,
  status: Result['status'],
  detail: string,
  ms: number,
  body?: string,
) {
  results.push({ id, label, status, detail, ms, bodySnippet: body?.slice(0, 400) });
}

async function check(
  id: string,
  label: string,
  fn: () => Promise<{ detail: string; ms: number; ok: boolean; body?: string }>,
) {
  try {
    const r = await fn();
    record(id, label, r.ok ? 'PASS' : 'FAIL', r.detail, r.ms, r.ok ? undefined : r.body);
  } catch (err) {
    record(id, label, 'FAIL', `threw: ${(err as Error).message}`, 0);
  }
}

function skip(id: string, label: string, reason: string) {
  record(id, label, 'SKIP', reason, 0);
}

async function discoverFacilitySlug(): Promise<string | null> {
  if (facilitySlug) return facilitySlug;
  const { body, status } = await fetchText(`${baseUrl}/sport/${sport}`);
  if (status !== 200) return null;
  const re = new RegExp(`/sport/${sport}/([a-z0-9][a-z0-9-]+)(?:"|')`, 'g');
  const matches = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const s = m[1];
    if (s === 'fotky' || s === 'vystup' || s === 'zaznam-vystupu') continue;
    matches.add(s);
  }
  return matches.size > 0 ? [...matches][0] : null;
}

async function discoverTripReportId(slug: string): Promise<string | null> {
  if (tripReportId) return tripReportId;
  const { body, status } = await fetchText(
    `${baseUrl}/sport/${sport}/${slug}/zaznam-vystupu`,
  );
  if (status !== 200) return null;
  const re = new RegExp(`/sport/${sport}/${slug}/vystup/([a-z0-9-]+)`);
  const m = re.exec(body);
  return m ? m[1] : null;
}

async function discoverUserId(): Promise<string | null> {
  if (userId) return userId;
  const { body, status } = await fetchText(`${baseUrl}/`);
  if (status !== 200) return null;
  const m = /\/uzivatel\/([a-z0-9-]+)(?:"|'|\/)/.exec(body);
  return m ? m[1] : null;
}

async function main() {
  console.log(`=== Smoke test: ${baseUrl} ===\n`);

  // ---- Discovery (needed for A3–A6, A8, A9) ----
  const discoveredSlug = await discoverFacilitySlug();
  if (discoveredSlug) facilitySlug = discoveredSlug;

  const discoveredTripId = facilitySlug ? await discoverTripReportId(facilitySlug) : null;
  if (discoveredTripId) tripReportId = discoveredTripId;

  const discoveredUser = await discoverUserId();
  if (discoveredUser) userId = discoveredUser;

  // ---- Section A: anonymous browsing ----
  await check('A1', 'homepage', async () => {
    const r = await fetchText(`${baseUrl}/`);
    const ok = r.status === 200 && /hraju/i.test(r.body);
    return { ok, detail: `${r.status} (${r.ms}ms)`, ms: r.ms, body: r.body };
  });

  await check('A2', `/sport/${sport}`, async () => {
    const r = await fetchText(`${baseUrl}/sport/${sport}`);
    const ok = r.status === 200 && new RegExp(`/sport/${sport}/`).test(r.body);
    return { ok, detail: `${r.status} (${r.ms}ms)`, ms: r.ms, body: r.body };
  });

  if (facilitySlug) {
    await check('A3', `facility /sport/${sport}/${facilitySlug}`, async () => {
      const r = await fetchText(`${baseUrl}/sport/${sport}/${facilitySlug}`);
      const ok = r.status === 200 && /schema\.org/i.test(r.body);
      return { ok, detail: `${r.status} (${r.ms}ms)`, ms: r.ms, body: r.body };
    });

    await check('A4', `gallery /sport/${sport}/${facilitySlug}/fotky`, async () => {
      const r = await fetchText(`${baseUrl}/sport/${sport}/${facilitySlug}/fotky`);
      const ok = r.status === 200;
      return { ok, detail: `${r.status} (${r.ms}ms)`, ms: r.ms, body: r.body };
    });

    await check('A5', `trip-report list /${facilitySlug}/zaznam-vystupu`, async () => {
      const r = await fetchText(
        `${baseUrl}/sport/${sport}/${facilitySlug}/zaznam-vystupu`,
      );
      const ok = r.status === 200;
      return { ok, detail: `${r.status} (${r.ms}ms)`, ms: r.ms, body: r.body };
    });
  } else {
    skip('A3', 'facility detail', 'no facility slug discovered');
    skip('A4', 'photo gallery', 'no facility slug discovered');
    skip('A5', 'trip-report list', 'no facility slug discovered');
  }

  if (facilitySlug && tripReportId) {
    await check(
      'A6',
      `trip-report deep-link /${facilitySlug}/vystup/${tripReportId}`,
      async () => {
        const r = await fetchText(
          `${baseUrl}/sport/${sport}/${facilitySlug}/vystup/${tripReportId}`,
        );
        const hasArticleLd =
          /"@type"\s*:\s*"Article"/i.test(r.body) ||
          /application\/ld\+json/i.test(r.body);
        const ok = r.status === 200 && hasArticleLd;
        return {
          ok,
          detail: `${r.status} (${r.ms}ms)${hasArticleLd ? ', Article JSON-LD present' : ', missing Article JSON-LD'}`,
          ms: r.ms,
          body: r.body,
        };
      },
    );
  } else {
    skip('A6', 'trip-report deep-link', 'no trip-report id discovered (list may be empty)');
  }

  await check('A7', 'image sitemap /sitemap-images.xml', async () => {
    const r = await fetchText(`${baseUrl}/sitemap-images.xml`);
    const urlCount = (r.body.match(/<url>/g) || []).length;
    const imgCount = (r.body.match(/<image:image>/g) || []).length;
    const ok = r.status === 200 && /<urlset/.test(r.body) && urlCount > 0;
    return {
      ok,
      detail: `${r.status}, ${urlCount} urls, ${imgCount} images (${r.ms}ms)`,
      ms: r.ms,
      body: r.body,
    };
  });

  if (userId) {
    await check('A8', `user profile /uzivatel/${userId}`, async () => {
      const r = await fetchText(`${baseUrl}/uzivatel/${userId}`);
      const ok = r.status === 200;
      return { ok, detail: `${r.status} (${r.ms}ms)`, ms: r.ms, body: r.body };
    });

    await check('A9', `user trip reports /uzivatel/${userId}/vystupy`, async () => {
      const r = await fetchText(`${baseUrl}/uzivatel/${userId}/vystupy`);
      const ok = r.status === 200;
      return { ok, detail: `${r.status} (${r.ms}ms)`, ms: r.ms, body: r.body };
    });
  } else {
    skip('A8', 'user profile', 'no user id discoverable (pass --user-id=X to include)');
    skip('A9', 'user trip reports', 'no user id discoverable (pass --user-id=X to include)');
  }

  // ---- Section E: SEO ----
  await check('E22', '/sitemap.xml', async () => {
    const r = await fetchText(`${baseUrl}/sitemap.xml`);
    // sitemap index or urlset
    const urlCount = (r.body.match(/<(?:url|sitemap)>/g) || []).length;
    const ok = r.status === 200 && /<(?:urlset|sitemapindex)/.test(r.body) && urlCount > 0;
    return {
      ok,
      detail: `${r.status}, ${urlCount} urls (${r.ms}ms)`,
      ms: r.ms,
      body: r.body,
    };
  });

  await check('E23', '/robots.txt', async () => {
    const r = await fetchText(`${baseUrl}/robots.txt`);
    const ok = r.status === 200 && /user-agent/i.test(r.body);
    return { ok, detail: `${r.status} (${r.ms}ms)`, ms: r.ms, body: r.body };
  });

  await check('E24', '/llms.txt', async () => {
    const r = await fetchText(`${baseUrl}/llms.txt`);
    const ok = r.status === 200 && r.body.length > 100;
    return {
      ok,
      detail: `${r.status}, ${r.body.length} bytes (${r.ms}ms)`,
      ms: r.ms,
      body: r.body,
    };
  });

  await check('E25', '/en/ → 301 → /', async () => {
    const r = await fetchText(`${baseUrl}/en/`, { manualRedirect: true });
    const is301 = r.status === 301 || r.status === 308;
    const locOk = !!r.location && !/\/en\//.test(r.location);
    const ok = is301 && locOk;
    return {
      ok,
      detail: `${r.status} → ${r.location ?? '(no Location)'} (${r.ms}ms)`,
      ms: r.ms,
      body: r.body,
    };
  });

  // ---- Section F: AdSense ----
  await check('F26', 'AdSense script on homepage', async () => {
    const r = await fetchText(`${baseUrl}/`);
    const ok = r.status === 200 && /pagead2\.googlesyndication\.com/.test(r.body);
    return {
      ok,
      detail: ok ? `found pagead2 reference (${r.ms}ms)` : `no pagead2 ref (${r.ms}ms)`,
      ms: r.ms,
      body: r.body,
    };
  });

  if (facilitySlug) {
    await check('F27', 'banner ad placeholder on facility page', async () => {
      const r = await fetchText(`${baseUrl}/sport/${sport}/${facilitySlug}`);
      // banners are medfeet/Joma — look for common markers
      const ok =
        r.status === 200 &&
        (/medfeet|joma|banner-ad|ad-banner|\/ads\//i.test(r.body) ||
          /pagead2\.googlesyndication\.com/.test(r.body));
      return {
        ok,
        detail: ok ? `banner markers found (${r.ms}ms)` : `no banner markers (${r.ms}ms)`,
        ms: r.ms,
        body: r.body,
      };
    });
  } else {
    skip('F27', 'banner ad placeholder', 'no facility slug discovered');
  }

  // ---- Report ----
  const pad = (s: string, n: number) => s.padEnd(n, ' ');
  for (const r of results) {
    const statusColor =
      r.status === 'PASS' ? '\x1b[32m' : r.status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
    console.log(
      `[${pad(r.id, 3)}] ${pad(r.label, 48)} ${statusColor}${r.status}\x1b[0m  ${r.detail}`,
    );
    if (verbose && r.bodySnippet && r.status === 'FAIL') {
      console.log(`      body: ${r.bodySnippet.replace(/\s+/g, ' ').trim()}`);
    }
  }

  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;

  console.log('');
  if (fail === 0) {
    console.log(
      `\x1b[32m${pass}/${total} PASS\x1b[0m${skipped ? ` (${skipped} skipped)` : ''} — site is healthy`,
    );
    process.exit(0);
  } else {
    console.log(
      `\x1b[31m${fail} FAIL\x1b[0m, ${pass} pass${skipped ? `, ${skipped} skip` : ''} — site is NOT healthy`,
    );
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Smoke test crashed:', err);
  process.exit(2);
});

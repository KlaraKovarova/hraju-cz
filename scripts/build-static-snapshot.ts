/**
 * SIL-681 — Plan B: static fallback snapshot of hraju.cz
 *
 * Crawls a locally-running Next.js server and writes a static snapshot to
 * out-static/. The result is deployable to any free-tier static host
 * (Netlify, Cloudflare Pages, GitHub Pages).
 *
 * Pages snapshotted:
 *   - Homepage
 *   - /sport/{sport} for all SPORTS in src/lib/sports.ts
 *   - Top N facilities (default 100) by check-in (Visit) count
 *   - All blog posts in content/blog/ with publishDate <= today
 *   - Static surfaces: /o-nas, /kontakt, /podminky-pouziti, /ochrana-osobnich-udaju,
 *     /akce, /komunita, /hledat, /pruvodce, /llms.txt, /llms-full.txt,
 *     /robots.txt, /sitemap.xml, /sitemap-images.xml
 *
 * HTML rewriting:
 *   - Prepends a sticky "dočasný režim" banner to <body>
 *   - Disables forms whose action starts with /api/
 *   - Leaves AdSense + analytics scripts intact
 *
 * After the crawl, public/* and .next/static are copied into out-static/
 * so CSS/JS/fonts and image assets resolve.
 *
 * Env overrides:
 *   SNAPSHOT_BASE_URL     default http://localhost:3000
 *   SNAPSHOT_FACILITY_LIMIT  default 100
 *   SNAPSHOT_SKIP_ASSETS  skip copying .next/static + public
 */
import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";
import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";

import { SPORTS } from "../src/lib/sports";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "out-static");
const BASE_URL = (process.env.SNAPSHOT_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const FACILITY_LIMIT = Number(process.env.SNAPSHOT_FACILITY_LIMIT ?? 100);
const SKIP_ASSETS = process.env.SNAPSHOT_SKIP_ASSETS === "1";
const SKIP_FACILITIES = process.env.SNAPSHOT_SKIP_FACILITIES === "1";

const BANNER_HTML =
  '<div id="rescue-banner" role="alert" style="position:sticky;top:0;z-index:99999;background:#fef3c7;border-bottom:2px solid #f59e0b;color:#92400e;padding:10px 16px;text-align:center;font-size:14px;line-height:1.5;font-family:system-ui,-apple-system,sans-serif">' +
  '⚠️ <strong>hraju.cz je v dočasném režimu</strong> — některé funkce jsou nedostupné. Plný provoz brzy obnovíme.' +
  "</div>";

const STATIC_URLS: Array<{ url: string; rewrite?: boolean }> = [
  { url: "/" },
  { url: "/blog" },
  { url: "/akce" },
  { url: "/komunita" },
  { url: "/hledat" },
  { url: "/pruvodce" },
  { url: "/o-nas" },
  { url: "/kontakt" },
  { url: "/podminky-pouziti" },
  { url: "/ochrana-osobnich-udaju" },
  { url: "/pridat-sportoviste" },
  { url: "/vitejte" },
  { url: "/robots.txt", rewrite: false },
  { url: "/sitemap.xml", rewrite: false },
  { url: "/sitemap-images.xml", rewrite: false },
  { url: "/llms.txt", rewrite: false },
  { url: "/llms-full.txt", rewrite: false },
];

type CrawlResult = { ok: number; fail: number; skipped: number };

async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "hraju-snapshot/1.0 (+SIL-681)" },
        redirect: "follow",
      });
      if (res.ok || res.status === 404) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 750 * (i + 1)));
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function urlToFilePath(url: string): string {
  let clean = url.split("?")[0].split("#")[0];
  // Decode percent-encoded URL paths so the filesystem filename matches what
  // a static host (Netlify/nginx) looks up after URL-decoding the request.
  try {
    clean = decodeURIComponent(clean);
  } catch {
    // leave as-is if malformed percent-encoding
  }
  if (clean === "/") return "index.html";
  const stripped = clean.replace(/^\//, "").replace(/\/$/, "");
  if (/\.[a-z0-9]+$/i.test(stripped)) return stripped;
  return path.join(stripped, "index.html");
}

function rewriteHtml(html: string): { html: string; assets: string[] } {
  const $ = cheerio.load(html);
  const assets = new Set<string>();

  $("body").prepend(BANNER_HTML);

  $("form").each((_, el) => {
    const action = $(el).attr("action") ?? "";
    if (action.startsWith("/api/") || action.includes("/api/")) {
      $(el).removeAttr("action");
      $(el).attr("data-rescue-disabled", "true");
      $(el).attr(
        "onsubmit",
        "event.preventDefault();window.alert('Tato funkce je v dočasném režimu nedostupná. Děkujeme za trpělivost.');return false;",
      );
    }
  });

  $("button[formaction]").each((_, el) => {
    const fa = $(el).attr("formaction") ?? "";
    if (fa.includes("/api/")) $(el).attr("disabled", "disabled");
  });

  const collect = (href: string | undefined) => {
    if (!href) return;
    if (!href.startsWith("/")) return;
    if (href.startsWith("//")) return;
    if (href.startsWith("/api/")) return;
    if (href.startsWith("/_next/image")) return;
    assets.add(href);
  };

  $('link[href]').each((_, el) => collect($(el).attr("href")));
  $('script[src]').each((_, el) => collect($(el).attr("src")));
  $('img[src]').each((_, el) => collect($(el).attr("src")));
  $('source[src]').each((_, el) => collect($(el).attr("src")));
  $('source[srcset]').each((_, el) => {
    const set = $(el).attr("srcset") ?? "";
    for (const candidate of set.split(",")) {
      const url = candidate.trim().split(/\s+/)[0];
      collect(url);
    }
  });
  $('img[srcset]').each((_, el) => {
    const set = $(el).attr("srcset") ?? "";
    for (const candidate of set.split(",")) {
      const url = candidate.trim().split(/\s+/)[0];
      collect(url);
    }
  });

  return { html: $.html(), assets: Array.from(assets) };
}

async function writeOutput(url: string, body: string | Buffer) {
  const outPath = path.join(OUT_DIR, urlToFilePath(url));
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, body);
}

async function snapshotOne(
  url: string,
  opts: { rewrite?: boolean } = {},
): Promise<{ status: "ok" | "missing" | "fail"; assets?: string[] }> {
  try {
    const res = await fetchWithRetry(BASE_URL + url);
    if (res.status === 404) return { status: "missing" };
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("text/html")) {
      const html = await res.text();
      if (opts.rewrite === false) {
        await writeOutput(url, html);
        return { status: "ok" };
      }
      const { html: out, assets } = rewriteHtml(html);
      await writeOutput(url, out);
      return { status: "ok", assets };
    } else if (
      ct.startsWith("text/") ||
      ct.includes("xml") ||
      ct.includes("json") ||
      ct.includes("javascript")
    ) {
      await writeOutput(url, await res.text());
      return { status: "ok" };
    } else {
      await writeOutput(url, Buffer.from(await res.arrayBuffer()));
      return { status: "ok" };
    }
  } catch (e) {
    process.stderr.write(`    ✗ ${url}: ${(e as Error).message}\n`);
    return { status: "fail" };
  }
}

async function downloadAsset(url: string): Promise<"ok" | "fail" | "skip"> {
  // Skip if file already exists (avoid redundant refetch across pages).
  const outPath = path.join(OUT_DIR, urlToFilePath(url));
  try {
    await fs.access(outPath);
    return "skip";
  } catch {
    // continue
  }
  try {
    const res = await fetchWithRetry(BASE_URL + url, 2);
    if (res.status === 404) return "fail";
    const ct = res.headers.get("content-type") ?? "";
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    if (ct.startsWith("text/") || ct.includes("javascript") || ct.includes("json") || ct.includes("xml")) {
      await fs.writeFile(outPath, await res.text());
    } else {
      await fs.writeFile(outPath, Buffer.from(await res.arrayBuffer()));
    }
    return "ok";
  } catch {
    return "fail";
  }
}

async function copyDir(src: string, dest: string) {
  try {
    await fs.cp(src, dest, { recursive: true, force: true });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
}

function makePool() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL or DIRECT_URL must be set in .env");
  return new Pool({ connectionString: url });
}

async function collectUrls(): Promise<Array<{ url: string; rewrite?: boolean }>> {
  const set = new Map<string, { url: string; rewrite?: boolean }>();
  for (const entry of STATIC_URLS) set.set(entry.url, entry);

  console.log(`[1/3] Sport pages: ${SPORTS.length}`);
  for (const s of SPORTS) set.set(`/sport/${s.slug}`, { url: `/sport/${s.slug}` });

  if (SKIP_FACILITIES) {
    console.log("[2/3] SNAPSHOT_SKIP_FACILITIES=1 — skipping facility detail pages");
    console.log("[3/3] Loading blog posts from content/blog...");
    return loadBlogPosts(set);
  }

  console.log(`[2/3] Loading top ${FACILITY_LIMIT} facilities by check-ins...`);
  const pool = makePool();
  const { rows } = await pool.query<{ slug: string; sport_slug: string; visits: number }>(
    `SELECT f.slug AS slug,
            s.slug AS sport_slug,
            COUNT(v.id)::int AS visits
     FROM "Facility" f
     JOIN "FacilitySport" fs ON fs."facilityId" = f.id
     JOIN "Sport" s ON s.id = fs."sportId"
     LEFT JOIN "Visit" v ON v."facilityId" = f.id
     WHERE f."isActive" = true AND f."isApproved" = true
     GROUP BY f.id, f.slug, s.slug
     ORDER BY visits DESC, f."reviewCount" DESC NULLS LAST, f.name ASC
     LIMIT $1`,
    [FACILITY_LIMIT],
  );
  await pool.end();

  const visibleSportSlugs = new Set<string>(SPORTS.map((s) => s.slug));
  let facilityCount = 0;
  for (const r of rows) {
    if (!visibleSportSlugs.has(r.sport_slug)) continue;
    const url = `/sport/${r.sport_slug}/${r.slug}`;
    if (!set.has(url)) {
      set.set(url, { url });
      facilityCount++;
    }
  }
  console.log(`    queued ${facilityCount} facility pages`);

  console.log("[3/3] Loading blog posts from content/blog...");
  return loadBlogPosts(set);
}

async function loadBlogPosts(
  set: Map<string, { url: string; rewrite?: boolean }>,
): Promise<Array<{ url: string; rewrite?: boolean }>> {
  const blogDir = path.join(ROOT, "content", "blog");
  const files = await fs.readdir(blogDir);
  const today = new Date().toISOString().slice(0, 10);
  let blogCount = 0;
  for (const f of files) {
    if (!f.endsWith(".md") && !f.endsWith(".mdx")) continue;
    const raw = await fs.readFile(path.join(blogDir, f), "utf-8");
    const dateMatch = raw.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m);
    const publishDate = dateMatch?.[1];
    if (!publishDate || publishDate > today) continue;
    const slug = f.replace(/\.mdx?$/, "");
    const url = `/blog/${slug}`;
    if (!set.has(url)) {
      set.set(url, { url });
      blogCount++;
    }
  }
  console.log(`    queued ${blogCount} blog posts`);

  return Array.from(set.values());
}

async function copyPublicAssets(): Promise<void> {
  console.log("Copying public/ assets...");
  await copyDir(path.join(ROOT, "public"), OUT_DIR);
}

async function copyNextStatic(): Promise<void> {
  const nextStatic = path.join(ROOT, ".next", "static");
  try {
    await fs.access(nextStatic);
  } catch {
    console.warn("  ⚠ .next/static not found — skipping (dev-mode snapshot; JS/CSS chunks may not resolve).");
    return;
  }
  console.log("Copying .next/static assets...");
  await copyDir(nextStatic, path.join(OUT_DIR, "_next", "static"));
}

async function rewriteNextChunkReferences(): Promise<void> {
  // In dev mode, Next serves chunks under /_next/static/chunks but also emits
  // /_next/static/css/* etc. We can't fully reproduce dev asset paths. This
  // helper inlines any small critical CSS it can detect in the homepage HTML
  // as a best-effort fallback. For now, just warn if no chunks copied.
}

async function writeFallbackPages() {
  const notFound =
    '<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"><title>Nenalezeno — hraju.cz</title>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    "</head><body style=\"font-family:system-ui,-apple-system,sans-serif;max-width:640px;margin:0 auto;padding:0 20px;line-height:1.6;color:#1f2937\">" +
    BANNER_HTML +
    '<div style="padding:48px 0"><h1>Stránka není v dočasném režimu dostupná</h1>' +
    '<p>Některé stránky hraju.cz jsou momentálně nedostupné. Plný provoz obnovíme co nejdříve.</p>' +
    '<p><a href="/" style="color:#1d4ed8">Zpět na úvodní stránku</a></p></div></body></html>';
  await writeOutput("/404.html", notFound);
}

async function main() {
  console.log(`hraju.cz snapshot → ${OUT_DIR}`);
  console.log(`Base URL: ${BASE_URL}`);

  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  const urls = await collectUrls();
  console.log(`\nCrawling ${urls.length} URLs...`);

  const result: CrawlResult = { ok: 0, fail: 0, skipped: 0 };
  const assetSet = new Set<string>();
  for (let i = 0; i < urls.length; i++) {
    const entry = urls[i];
    const r = await snapshotOne(entry.url, { rewrite: entry.rewrite });
    if (r.status === "ok") result.ok++;
    else if (r.status === "missing") result.skipped++;
    else result.fail++;
    if (r.assets) for (const a of r.assets) assetSet.add(a);
    if ((i + 1) % 25 === 0 || i + 1 === urls.length) {
      console.log(
        `  progress: ${i + 1}/${urls.length} — ${result.ok} ok, ${result.skipped} 404, ${result.fail} fail`,
      );
    }
  }

  await writeFallbackPages();

  if (!SKIP_ASSETS) {
    await copyPublicAssets();
    await copyNextStatic();
  }

  if (assetSet.size > 0) {
    const assetList = Array.from(assetSet);
    console.log(`\nDownloading ${assetList.length} referenced assets (pass 2)...`);
    let aOk = 0;
    let aFail = 0;
    let aSkip = 0;
    for (let i = 0; i < assetList.length; i++) {
      const status = await downloadAsset(assetList[i]);
      if (status === "ok") aOk++;
      else if (status === "skip") aSkip++;
      else aFail++;
      if ((i + 1) % 50 === 0 || i + 1 === assetList.length) {
        console.log(
          `  assets: ${i + 1}/${assetList.length} — ${aOk} ok, ${aSkip} cached, ${aFail} fail`,
        );
      }
    }
  }

  console.log(
    `\n✓ Snapshot complete: ${result.ok} saved, ${result.skipped} missing (404), ${result.fail} failed`,
  );
  console.log(`  Output: ${OUT_DIR}`);
  if (result.fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

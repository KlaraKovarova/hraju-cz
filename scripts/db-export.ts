/**
 * Database export script for hraju.cz
 * Exports all tables via Adminer HTTP API to a SQL file.
 *
 * Usage:
 *   npx tsx scripts/db-export.ts                 # exports to scripts/data/db-dump.sql
 *   npx tsx scripts/db-export.ts my-backup.sql   # exports to custom path
 *
 * Requires DATABASE_URL to be set (for DB credentials).
 * Connects via Adminer at https://hraju.cz/adminer-5.4.2-cs.php
 */

import * as fs from "fs";
import * as path from "path";

const ADMINER_URL = "https://hraju.cz/adminer-5.4.2-cs.php";

const TABLES = [
  "Amenity",
  "Contact",
  "Facility",
  "FacilityAmenity",
  "FacilityImage",
  "FacilitySport",
  "Location",
  "Sport",
  "_prisma_migrations",
];

function parseDbUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: u.username,
    password: u.password,
    database: u.pathname.replace(/^\//, ""),
  };
}

function extractCookies(headers: Headers): string[] {
  const raw = headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(";")[0]);
}

function mergeCookies(existing: string, newCookies: string[]): string {
  const map = new Map<string, string>();
  for (const c of existing.split("; ").filter(Boolean)) {
    const [k] = c.split("=", 1);
    map.set(k, c);
  }
  for (const c of newCookies) {
    const [k] = c.split("=", 1);
    map.set(k, c);
  }
  return [...map.values()].join("; ");
}

async function adminerLogin(
  user: string,
  password: string,
  db: string
): Promise<{ cookies: string; token: string }> {
  // Step 1: Get initial cookies from login page
  const initResp = await fetch(ADMINER_URL, { redirect: "manual" });
  let cookies = mergeCookies("", extractCookies(initResp.headers));

  // Step 2: Login
  const loginBody = new URLSearchParams({
    "auth[driver]": "server",
    "auth[server]": "",
    "auth[username]": user,
    "auth[password]": password,
    "auth[db]": db,
  });

  const loginResp = await fetch(ADMINER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies,
    },
    body: loginBody.toString(),
    redirect: "manual",
  });
  cookies = mergeCookies(cookies, extractCookies(loginResp.headers));

  // Follow redirect after login
  const location = loginResp.headers.get("location");
  if (location) {
    const redirectUrl = location.startsWith("http")
      ? location
      : `https://hraju.cz/${location.replace(/^\//, "")}`;
    const followResp = await fetch(redirectUrl, {
      headers: { Cookie: cookies },
      redirect: "manual",
    });
    cookies = mergeCookies(cookies, extractCookies(followResp.headers));
  }

  // Step 3: Get export page for CSRF token
  const exportResp = await fetch(
    `${ADMINER_URL}?server=&username=${user}&db=${db}&dump=`,
    { headers: { Cookie: cookies }, redirect: "manual" }
  );
  cookies = mergeCookies(cookies, extractCookies(exportResp.headers));
  const exportHtml = await exportResp.text();

  const tokenMatch = exportHtml.match(/name='token' value='([^']+)'/);
  if (!tokenMatch) {
    // Debug: show what we got
    if (exportHtml.includes("auth[username]")) {
      throw new Error("Not logged in — Adminer returned the login page");
    }
    throw new Error("Failed to extract CSRF token from Adminer export page");
  }

  return { cookies, token: tokenMatch[1] };
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL not set. Create a .env file or export it.");
    process.exit(1);
  }

  const outPath =
    process.argv[2] || path.join(__dirname, "data", "db-dump.sql");
  const config = parseDbUrl(dbUrl);

  console.log(`Logging into Adminer as ${config.user}...`);
  const { cookies, token } = await adminerLogin(
    config.user,
    config.password,
    config.database
  );
  console.log("Authenticated. Exporting...");

  // Build export POST body
  const params = new URLSearchParams();
  params.append("output", "text");
  params.append("format", "sql");
  params.append("table_style", "DROP+CREATE");
  params.append("data_style", "INSERT");
  params.append("auto_increment", "1");
  params.append("token", token);
  for (const t of TABLES) {
    params.append("tables[]", t);
    params.append("data[]", t);
  }

  const resp = await fetch(
    `${ADMINER_URL}?server=&username=${config.user}&db=${config.database}&dump=`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies,
      },
      body: params.toString(),
    }
  );

  const sql = await resp.text();

  // Verify it's actual SQL (not an error HTML page)
  if (sql.includes("<!DOCTYPE html>") || sql.includes("<html")) {
    console.error("Export returned HTML instead of SQL — auth or parameter error.");
    console.error(sql.slice(0, 500));
    process.exit(1);
  }

  // Ensure output directory exists
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(outPath, sql, "utf-8");
  console.log(`Exported to: ${outPath}`);
  console.log(`Size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});

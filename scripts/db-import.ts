/**
 * Database import script for hraju.cz
 * Imports a SQL dump file via Adminer's SQL command endpoint.
 *
 * Usage:
 *   npx tsx scripts/db-import.ts                 # imports from scripts/data/db-dump.sql
 *   npx tsx scripts/db-import.ts my-backup.sql   # imports from custom path
 *
 * Requires DATABASE_URL to be set (for DB credentials).
 * Connects via Adminer at https://hraju.cz/adminer-5.4.2-cs.php
 */

import * as fs from "fs";
import * as path from "path";

const ADMINER_URL = "https://hraju.cz/adminer-5.4.2-cs.php";

function parseDbUrl(url: string) {
  const u = new URL(url);
  return {
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
  const initResp = await fetch(ADMINER_URL, { redirect: "manual" });
  let cookies = mergeCookies("", extractCookies(initResp.headers));

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

  // Get SQL page for token
  const sqlPageResp = await fetch(
    `${ADMINER_URL}?server=&username=${user}&db=${db}&sql=`,
    { headers: { Cookie: cookies }, redirect: "manual" }
  );
  cookies = mergeCookies(cookies, extractCookies(sqlPageResp.headers));
  const sqlHtml = await sqlPageResp.text();

  const tokenMatch = sqlHtml.match(/name='token' value='([^']+)'/);
  if (!tokenMatch) {
    if (sqlHtml.includes("auth[username]")) {
      throw new Error("Not logged in — Adminer returned the login page");
    }
    throw new Error("Failed to extract CSRF token from Adminer SQL page");
  }

  return { cookies, token: tokenMatch[1] };
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL not set. Create a .env file or export it.");
    process.exit(1);
  }

  const inPath =
    process.argv[2] || path.join(__dirname, "data", "db-dump.sql");
  if (!fs.existsSync(inPath)) {
    console.error(`File not found: ${inPath}`);
    console.error("Run db-export.ts first, or specify a valid SQL file.");
    process.exit(1);
  }

  const config = parseDbUrl(dbUrl);
  const sql = fs.readFileSync(inPath, "utf-8");
  console.log(
    `Importing ${(Buffer.byteLength(sql) / 1024).toFixed(1)} KB from ${inPath}...`
  );

  console.log(`Logging into Adminer as ${config.user}...`);
  const { cookies, token } = await adminerLogin(
    config.user,
    config.password,
    config.database
  );
  console.log("Authenticated. Executing SQL...");

  // Use Adminer's SQL command endpoint
  const params = new URLSearchParams();
  params.append("token", token);
  params.append("query", sql);
  params.append("limit", "");
  params.append("error_stops", "1");
  params.append("only_errors", "1");

  const resp = await fetch(
    `${ADMINER_URL}?server=&username=${config.user}&db=${config.database}&sql=`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies,
      },
      body: params.toString(),
    }
  );

  const resultHtml = await resp.text();

  // Check for errors
  const errorMatches = resultHtml.match(/<div class='error'>(.*?)<\/div>/gs);
  if (errorMatches) {
    for (const m of errorMatches) {
      console.error(`Error: ${m.replace(/<[^>]+>/g, "").trim()}`);
    }
  }

  // Check for success messages
  const msgMatches = resultHtml.match(/<p class='message [^']*'>(.*?)<\/p>/gs);
  if (msgMatches) {
    for (const m of msgMatches) {
      console.log(`OK: ${m.replace(/<[^>]+>/g, "").trim()}`);
    }
  }

  if (!errorMatches && !msgMatches) {
    console.log("Import completed (no messages from Adminer).");
  }
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});

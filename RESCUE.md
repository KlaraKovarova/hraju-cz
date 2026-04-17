# RESCUE.md — hraju.cz static fallback runbook (SIL-681)

When Vercel is unavailable or deployment is disabled, hraju.cz can be
served read-only from a free-tier static host while the primary
infrastructure is restored. This document is the runbook.

## When to deploy the rescue

Trigger criteria (any one):

- Vercel deployment disabled (HTTP 402 `DEPLOYMENT_DISABLED`) for more
  than **4 hours** with no ETA
- hraju.cz returning 5xx or unreachable for more than **4 hours**
- Scheduled Vercel outage known to exceed 2 hours

If the outage is expected to clear in under 4 hours, do nothing — the
time to snapshot, deploy, and revert DNS is comparable.

## What the rescue provides

- Static copy of the homepage, all active sport category pages, top 100
  facilities by check-in count, every published blog post, and the
  standard static surfaces (`/o-nas`, `/kontakt`, `/podminky-pouziti`,
  `/ochrana-osobnich-udaju`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`).
- A persistent banner on every page: *"hraju.cz je v dočasném
  režimu — některé funkce jsou nedostupné."*
- Disabled forms (anything posting to `/api/*`).
- AdSense script preserved — revenue continues during outage.
- Same URL structure as production, so inbound links and search results
  continue to resolve once DNS is pointed.

## What the rescue does NOT provide

- Dynamic features: user login, registration, posting reviews, creating
  events, check-ins, photo uploads, owner claim flow.
- Search, filters, and pagination (they submit to `/api/*` and are
  intentionally disabled).
- Any page not in the snapshot set (uncommon facilities, admin, user
  dashboards).

## Building the snapshot

Requires a working `DATABASE_URL` in `.env` (the Neon production DB).
Vercel does not need to be healthy — the snapshot builds locally.

```bash
cd /Users/klara/Weby/hraju.cz
npm install                # if node_modules is stale
npm run snapshot            # runs next build, starts next start on :3930, crawls
```

Output lands in `out-static/`. The run typically takes 10–15 minutes
(most of which is `next build`). For quick re-snapshots during an
extended outage, skip the build step:

```bash
SNAPSHOT_SKIP_BUILD=1 npm run snapshot
```

Environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SNAPSHOT_PORT` | `3930` | Port for the temporary `next start` |
| `SNAPSHOT_BASE_URL` | `http://localhost:3930` | Crawl target |
| `SNAPSHOT_FACILITY_LIMIT` | `100` | Top-N facilities by check-ins |
| `SNAPSHOT_SKIP_BUILD` | `0` | Skip `next build` before crawl |
| `SNAPSHOT_SKIP_ASSETS` | `0` | Skip copying `public/` + `.next/static` |

## Deploying to Netlify (primary free tier)

First-time setup (one-time):

1. Create a Netlify account at <https://app.netlify.com/> using
   `zach.michal@gmail.com`. Free tier; no card required.
2. Create a new site named `hraju-cz-rescue` (or let Netlify generate
   a name — note the site ID).
3. Generate a personal access token in **User settings → Applications
   → New access token**.
4. Export it:

   ```bash
   export NETLIFY_AUTH_TOKEN=nfp_…
   export NETLIFY_SITE_ID=<site-id>
   ```

Then, for every rescue deploy:

```bash
npx netlify-cli deploy \
  --prod \
  --dir=out-static \
  --site="$NETLIFY_SITE_ID" \
  --message "SIL-681 rescue snapshot $(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

Netlify will return a `https://hraju-cz-rescue.netlify.app` URL (or
whatever name was chosen). Verify the banner, homepage, and a
sport/blog page before broadcasting.

## Deploying to Cloudflare Pages (backup)

If Netlify is unavailable or rate-limits the deploy:

```bash
npx wrangler pages deploy out-static \
  --project-name hraju-cz-rescue \
  --branch main
```

Requires `CLOUDFLARE_API_TOKEN` with Pages edit permission. Account
setup at <https://dash.cloudflare.com/>.

## DNS cutover (only if board grants access)

If the outage continues and the board grants DNS access, point
`hraju.cz` to the rescue host. **Lower TTL first** so you can revert
quickly once Vercel returns.

Netlify path (recommended — supports apex via ALIAS/ANAME):

1. In Netlify, **Domain management → Custom domains → Add
   `hraju.cz`**. Netlify prints the required DNS records.
2. In the DNS registrar (currently: check with CEO/board — registrar
   unknown to agents):
   - Set TTL to 300 for `A` and `CNAME` records for `hraju.cz` and
     `www.hraju.cz`.
   - Replace the Vercel A/ALIAS records with Netlify's (usually
     `75.2.60.5` A-record for apex and
     `hraju-cz-rescue.netlify.app` CNAME for `www`).
3. Wait 5–15 minutes, verify from `dig hraju.cz +short`.

Cloudflare Pages path: add `hraju.cz` as a custom domain in the
project, and cut the DNS records Cloudflare prints.

## Reverting once Vercel is healthy

1. Deploy or redeploy the main Next.js app to Vercel; confirm
   `https://<vercel-url>` returns 200 with live data.
2. Restore the original DNS records (or flip Netlify's custom-domain
   binding off).
3. Wait for DNS TTL to expire.
4. Verify `hraju.cz` serves fresh, dynamic content again (check for a
   form working, a new check-in rendering).
5. Leave the `hraju-cz-rescue.netlify.app` site live — it's valuable as
   a defensive baseline for the next outage. Re-snapshot monthly so it
   doesn't go stale.

## Re-snapshotting during extended outages

If the rescue stays live for more than 6 hours:

- Re-run `SNAPSHOT_SKIP_BUILD=1 npm run snapshot` every 6 hours to
  capture fresh reviews, check-ins, blog posts.
- Re-deploy with the same `netlify-cli deploy --prod …` command.

## Schema-drift pre-flight (occasionally required)

The facility detail page renders a trip-reports rail that queries
`prisma.tripReport.findMany()`. The `TripReport` model was merged in
SIL-677 but its `prisma db push` is queued for restore-day (see the
SIL-647 playbook), so the table is missing in production right now.
If the table is missing, every facility page returns HTTP 500 and the
snapshot skips them.

To include facility pages in a rescue snapshot, first apply the scoped
shim after obtaining CEO / CTO approval for prod DDL:

```bash
psql "$DATABASE_URL" -f scripts/rescue-schema-shim.sql
# or, if DIRECT_URL is set to the unpooled endpoint:
psql "$DIRECT_URL" -f scripts/rescue-schema-shim.sql
```

The shim is idempotent and strictly subset-compatible with the
restore-day `prisma db push` — applying it early does not create drift
that needs fixing later.

If the shim cannot be applied right now, run the snapshot with
`SNAPSHOT_SKIP_FACILITIES=1 npm run snapshot` to produce a valid
(though facility-less) rescue snapshot without the 500-storm.

## Known limitations / gotchas

- The snapshot includes a local copy of `.next/static` (hashed JS/CSS
  chunks). Re-snapshotting after a code change regenerates these
  hashes — always re-deploy the whole `out-static/` dir, don't cherry
  pick.
- `/_next/image` URLs may 404 on Netlify (no image optimization).
  Most hero images use `/images/*` under `public/` and resolve fine;
  user-uploaded photos on Vercel Blob also resolve via their own CDN.
- Forms are disabled with a JS `onsubmit` handler. Users on JS-disabled
  browsers will still see the form but the submission fails silently —
  acceptable for the rescue window.
- Search (`/hledat`) snapshots the empty state only. That's
  intentional; dynamic search requires the live API.

## Related tickets

- SIL-647 — Site outage (the originating incident for v1 of this
  runbook)
- SIL-589 — Original Vercel invocation-limit warning filed 7 days
  before SIL-647
- SIL-680 — Post-mortem draft
- SIL-681 — This runbook + snapshot pipeline

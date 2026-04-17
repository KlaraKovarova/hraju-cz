-- SIL-681 — Rescue-mode schema shim.
--
-- The Prisma schema declares `TripReport` (models added under SIL-677/678/679)
-- but the model's `prisma db push` was deliberately deferred to restore-day
-- per SIL-647 playbook. Facility detail pages call
-- `prisma.tripReport.findMany()` unconditionally, so any facility page renders
-- as HTTP 500 while the table is missing.
--
-- This shim creates an EMPTY TripReport table that matches the committed
-- Prisma model exactly. It is:
--   - idempotent (CREATE TABLE IF NOT EXISTS)
--   - a strict subset of the restore-day `prisma db push` — no conflicts
--   - reversible (DROP TABLE "TripReport" if the rescue deploy is aborted)
--   - minimally scoped (touches only this one table and its indexes)
--
-- To apply (requires CEO approval — affects production DB):
--     psql "$DATABASE_URL" -f scripts/rescue-schema-shim.sql
--
-- Or, if you already have DIRECT_URL set:
--     psql "$DIRECT_URL" -f scripts/rescue-schema-shim.sql
--
-- After applying, re-run `npm run snapshot` to include facility pages.

BEGIN;

CREATE TABLE IF NOT EXISTS "TripReport" (
    "id"              TEXT PRIMARY KEY,
    "facilityId"      TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "dateClimbed"     TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "gradeText"       TEXT,
    "partnersText"    TEXT,
    "beta"            TEXT,
    "weatherNote"     TEXT,
    "isHidden"        BOOLEAN NOT NULL DEFAULT false,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TripReport_facilityId_fkey"
        FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE,
    CONSTRAINT "TripReport_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "TripReport_facilityId_dateClimbed_idx"
    ON "TripReport" ("facilityId", "dateClimbed");
CREATE INDEX IF NOT EXISTS "TripReport_userId_dateClimbed_idx"
    ON "TripReport" ("userId", "dateClimbed");
CREATE INDEX IF NOT EXISTS "TripReport_facilityId_createdAt_idx"
    ON "TripReport" ("facilityId", "createdAt");

COMMIT;

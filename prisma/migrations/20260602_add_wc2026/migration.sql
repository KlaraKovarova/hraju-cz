-- HRAA-33: MS ve fotbale 2026 — match schedule and group standings tables

CREATE TABLE IF NOT EXISTS "Wc2026Match" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "kickoffUtc" TIMESTAMP(3) NOT NULL,
    "venue" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "homeGoals" INTEGER,
    "awayGoals" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wc2026Match_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Wc2026Standing" (
    "id" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "drawn" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wc2026Standing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Wc2026Match_matchId_key" ON "Wc2026Match"("matchId");
CREATE INDEX IF NOT EXISTS "Wc2026Match_group_idx" ON "Wc2026Match"("group");
CREATE INDEX IF NOT EXISTS "Wc2026Match_kickoffUtc_idx" ON "Wc2026Match"("kickoffUtc");
CREATE INDEX IF NOT EXISTS "Wc2026Match_status_idx" ON "Wc2026Match"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "Wc2026Standing_group_team_key" ON "Wc2026Standing"("group", "team");
CREATE INDEX IF NOT EXISTS "Wc2026Standing_group_idx" ON "Wc2026Standing"("group");
CREATE INDEX IF NOT EXISTS "Wc2026Standing_points_idx" ON "Wc2026Standing"("points");

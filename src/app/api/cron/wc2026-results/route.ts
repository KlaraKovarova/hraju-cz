import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/cron/wc2026-results
// Fetches finished WC2026 match results from football-data.org and updates DB.
// Requires env: CRON_SECRET, FOOTBALL_DATA_API_KEY (optional — skips gracefully if missing).
// Schedule: every 30 min from June 11 to July 19, 2026 (see .github/workflows).
//
// Idempotent: upserts by matchId, only updates rows where status changes.

const CRON_SECRET = process.env.CRON_SECRET;
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;
const FD_BASE = "https://api.football-data.org/v4";

interface FdMatch {
  id: number;
  status: string; // "SCHEDULED" | "LIVE" | "IN_PLAY" | "PAUSED" | "FINISHED"
  matchday: number;
  stage: string;
  group: string | null;
  homeTeam: { name: string; shortName: string; tla: string };
  awayTeam: { name: string; shortName: string; tla: string };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

// Maps football-data.org team names to our canonical names.
// Add entries here if the API returns a different name for a team.
const FD_TEAM_MAP: Record<string, string> = {
  "Czech Republic": "Czech Republic",
  Czechia: "Czech Republic",
  México: "Mexico",
  "Saudi Arabia": "Saudi Arabia",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  "Ivory Coast": "Ivory Coast",
  "Côte d'Ivoire": "Ivory Coast",
  "Curaçao": "Curaçao",
  Curacao: "Curaçao",
  "DR Congo": "DR Congo",
  "Congo DR": "DR Congo",
  "New Zealand": "New Zealand",
  "Cape Verde": "Cape Verde",
  "United States": "United States",
  "USA": "United States",
};

function normalizeTeamName(name: string): string {
  return FD_TEAM_MAP[name] ?? name;
}

function mapFdStatus(s: string): string {
  if (s === "FINISHED") return "finished";
  if (s === "LIVE" || s === "IN_PLAY" || s === "PAUSED") return "live";
  return "scheduled";
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!FOOTBALL_DATA_KEY) {
    return NextResponse.json({
      success: true,
      message: "FOOTBALL_DATA_API_KEY not set — skipping results fetch",
      updated: 0,
    });
  }

  let fdMatches: FdMatch[] = [];
  try {
    const res = await fetch(
      `${FD_BASE}/competitions/WC/matches?season=2026&stage=GROUP_STAGE`,
      {
        headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
        next: { revalidate: 0 },
      }
    );
    if (!res.ok) {
      const text = await res.text();
      console.error("football-data.org error:", res.status, text);
      return NextResponse.json(
        { error: "Upstream API error", status: res.status },
        { status: 502 }
      );
    }
    const data = await res.json();
    fdMatches = data.matches ?? [];
  } catch (err) {
    console.error("WC2026 cron fetch error:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }

  const finished = fdMatches.filter((m) => m.status === "FINISHED");
  let updated = 0;
  let skipped = 0;

  for (const fdMatch of finished) {
    const homeGoals = fdMatch.score.fullTime.home;
    const awayGoals = fdMatch.score.fullTime.away;
    if (homeGoals === null || awayGoals === null) {
      skipped++;
      continue;
    }

    const homeTeam = normalizeTeamName(fdMatch.homeTeam.name);
    const awayTeam = normalizeTeamName(fdMatch.awayTeam.name);

    // Find the matching row by teams (match IDs differ between sources)
    const existing = await prisma.wc2026Match.findFirst({
      where: { homeTeam, awayTeam, status: { not: "finished" } },
    });

    if (!existing) {
      skipped++;
      continue;
    }

    await prisma.wc2026Match.update({
      where: { id: existing.id },
      data: { homeGoals, awayGoals, status: "finished" },
    });

    // Recalculate standings for this group
    await recalculateStandings(existing.group);
    updated++;
  }

  return NextResponse.json({ success: true, updated, skipped, total: finished.length });
}

async function recalculateStandings(group: string) {
  const matches = await prisma.wc2026Match.findMany({
    where: { group, status: "finished" },
  });

  // Aggregate stats per team
  const stats = new Map<string, { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; pts: number }>();

  const ensure = (team: string) => {
    if (!stats.has(team)) stats.set(team, { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 });
    return stats.get(team)!;
  };

  for (const m of matches) {
    if (m.homeGoals === null || m.awayGoals === null) continue;
    const home = ensure(m.homeTeam);
    const away = ensure(m.awayTeam);
    home.played++;
    away.played++;
    home.gf += m.homeGoals;
    home.ga += m.awayGoals;
    away.gf += m.awayGoals;
    away.ga += m.homeGoals;
    if (m.homeGoals > m.awayGoals) {
      home.won++; home.pts += 3; away.lost++;
    } else if (m.homeGoals < m.awayGoals) {
      away.won++; away.pts += 3; home.lost++;
    } else {
      home.drawn++; home.pts++; away.drawn++; away.pts++;
    }
  }

  for (const [team, s] of stats) {
    await prisma.wc2026Standing.upsert({
      where: { group_team: { group, team } },
      create: { group, team, played: s.played, won: s.won, drawn: s.drawn, lost: s.lost, goalsFor: s.gf, goalsAgainst: s.ga, points: s.pts },
      update: { played: s.played, won: s.won, drawn: s.drawn, lost: s.lost, goalsFor: s.gf, goalsAgainst: s.ga, points: s.pts },
    });
  }
}

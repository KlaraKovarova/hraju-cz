import { NextRequest, NextResponse } from "next/server";
import { WC2026_MATCHES, WC2026_TEAMS, getMatchesForTeam, getTeamBySlug } from "@/lib/wc2026-data";

// GET /api/ms-2026/ics
// GET /api/ms-2026/ics?team=czech-republic
// Returns an iCalendar (.ics) file with all group-stage matches (or filtered by team).

function icsDate(utcStr: string): string {
  // Format: 20260611T190000Z
  return utcStr.replace(/[-:]/g, "").replace(".000", "").slice(0, 15) + "Z";
}

function escapeIcs(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function buildIcs(matches: typeof WC2026_MATCHES, calName: string): string {
  const now = icsDate(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//hraju.cz//MS ve fotbale 2026//CS",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(calName)}`,
    "X-WR-TIMEZONE:Europe/Prague",
    "X-WR-CALDESC:MS ve fotbale 2026 – skupinová fáze",
  ];

  for (const match of matches) {
    const home = WC2026_TEAMS.find((t) => t.name === match.homeTeam);
    const away = WC2026_TEAMS.find((t) => t.name === match.awayTeam);
    const homeCs = home?.nameCs ?? match.homeTeam;
    const awayCs = away?.nameCs ?? match.awayTeam;
    const homeFlag = home?.flag ?? "";
    const awayFlag = away?.flag ?? "";

    const summary = `MS 2026: ${homeFlag} ${homeCs} – ${awayFlag} ${awayCs}`;
    const dtstart = icsDate(match.kickoffUtc);
    // Matches last ~2 hours
    const endMs = new Date(match.kickoffUtc).getTime() + 2 * 60 * 60 * 1000;
    const dtend = icsDate(new Date(endMs).toISOString());
    const uid = `wc2026-${match.id}@hraju.cz`;
    const description = `Skupina ${match.group} · ${match.venue}, ${match.city} · hraju.cz/ms-2026`;
    const location = `${match.venue}, ${match.city}`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      `LOCATION:${escapeIcs(location)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export async function GET(request: NextRequest) {
  const teamSlug = request.nextUrl.searchParams.get("team");

  let matches = WC2026_MATCHES;
  let calName = "MS ve fotbale 2026";
  let filename = "ms-fotbal-2026.ics";

  if (teamSlug) {
    const team = getTeamBySlug(teamSlug);
    if (!team) {
      return NextResponse.json({ error: "Tým nenalezen" }, { status: 404 });
    }
    matches = getMatchesForTeam(team.name);
    calName = `MS 2026 – ${team.nameCs}`;
    filename = `ms-2026-${team.slug}.ics`;
  }

  const ics = buildIcs(matches, calName);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

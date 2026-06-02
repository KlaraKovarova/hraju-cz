"use client";

import { useState } from "react";
import { Calendar, MapPin, Download } from "lucide-react";
import type { Wc2026Group, Wc2026Team } from "@/lib/wc2026-data";

export interface MatchWithResult {
  id: string;
  group: string;
  homeTeam: string;
  awayTeam: string;
  kickoffUtc: string;
  venue: string;
  city: string;
  homeGoals: number | null;
  awayGoals: number | null;
  status: string;
}

interface Standing {
  group: string;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

interface GroupsClientProps {
  groups: Wc2026Group[];
  matches: MatchWithResult[];
  standings: Standing[];
  teams: Wc2026Team[];
}

function formatKickoff(utcStr: string): { date: string; time: string } {
  const d = new Date(utcStr);
  const date = d.toLocaleDateString("cs-CZ", {
    timeZone: "Europe/Prague",
    day: "numeric",
    month: "long",
    weekday: "short",
  });
  const time = d.toLocaleTimeString("cs-CZ", {
    timeZone: "Europe/Prague",
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}

function MatchRow({ match, teams }: { match: MatchWithResult; teams: Wc2026Team[] }) {
  const home = teams.find((t) => t.name === match.homeTeam);
  const away = teams.find((t) => t.name === match.awayTeam);
  const { date, time } = formatKickoff(match.kickoffUtc);
  const hasResult =
    match.homeGoals !== null && match.homeGoals !== undefined &&
    match.awayGoals !== null && match.awayGoals !== undefined;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-white px-3 py-2.5 text-sm">
      <div className="w-20 shrink-0 text-xs text-zinc-400">
        <div>{date}</div>
        <div className="font-medium text-zinc-600">{time} SELČ</div>
      </div>
      <div className="flex flex-1 items-center justify-between gap-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span>{home?.flag}</span>
          <span className="truncate font-medium text-zinc-800">{home?.nameCs ?? match.homeTeam}</span>
        </div>
        <div className="shrink-0 w-14 text-center">
          {hasResult ? (
            <span className="font-bold text-zinc-900">{match.homeGoals} : {match.awayGoals}</span>
          ) : (
            <span className="text-xs text-zinc-400">vs</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 justify-end min-w-0">
          <span className="truncate font-medium text-zinc-800">{away?.nameCs ?? match.awayTeam}</span>
          <span>{away?.flag}</span>
        </div>
      </div>
      <div className="hidden shrink-0 w-28 text-xs text-zinc-400 sm:flex items-center gap-1">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">{match.city}</span>
      </div>
    </div>
  );
}

function StandingsTable({
  standings,
  teams,
}: {
  standings: Standing[];
  teams: Wc2026Team[];
}) {
  const sorted = [...standings].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-xs text-zinc-400">
            <th className="py-1.5 pl-2 text-left">#</th>
            <th className="py-1.5 text-left">Tým</th>
            <th className="py-1.5 text-center">Z</th>
            <th className="py-1.5 text-center">V</th>
            <th className="py-1.5 text-center">R</th>
            <th className="py-1.5 text-center">P</th>
            <th className="py-1.5 text-center">G</th>
            <th className="py-1.5 pr-2 text-center font-bold text-zinc-600">B</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => {
            const team = teams.find((t) => t.name === s.team);
            const isCzech = s.team === "Czech Republic";
            return (
              <tr
                key={s.team}
                className={`border-b border-zinc-50 last:border-0 ${i < 2 ? "bg-emerald-50/60" : ""} ${isCzech ? "ring-1 ring-inset ring-emerald-200" : ""}`}
              >
                <td className="py-1.5 pl-2 text-zinc-400">{i + 1}</td>
                <td className="py-1.5">
                  <span className="flex items-center gap-1.5">
                    <span>{team?.flag}</span>
                    <span className={`font-medium ${isCzech ? "text-emerald-700" : "text-zinc-800"}`}>
                      {team?.nameCs ?? s.team}
                    </span>
                  </span>
                </td>
                <td className="py-1.5 text-center text-zinc-600">{s.played}</td>
                <td className="py-1.5 text-center text-zinc-600">{s.won}</td>
                <td className="py-1.5 text-center text-zinc-600">{s.drawn}</td>
                <td className="py-1.5 text-center text-zinc-600">{s.lost}</td>
                <td className="py-1.5 text-center text-zinc-500 text-xs">{s.goalsFor}:{s.goalsAgainst}</td>
                <td className="py-1.5 pr-2 text-center font-bold text-zinc-900">{s.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-1 px-2 text-xs text-zinc-400">Zelené pozice = postup do 2. kola</p>
    </div>
  );
}

export function GroupsClient({ groups, matches, standings, teams }: GroupsClientProps) {
  const [activeGroup, setActiveGroup] = useState("A");

  const group = groups.find((g) => g.letter === activeGroup)!;
  const groupMatches = matches.filter((m) => m.group === activeGroup);
  const groupStandings = standings.filter((s) => s.group === activeGroup);

  return (
    <div>
      {/* Group tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {groups.map((g) => (
          <button
            key={g.letter}
            onClick={() => setActiveGroup(g.letter)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              g.letter === activeGroup
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white border border-zinc-200 text-zinc-600 hover:border-emerald-300 hover:text-emerald-700"
            }`}
          >
            Skupina {g.letter}
            {g.teams.some((t) => t.name === "Czech Republic") && (
              <span className="ml-1 text-xs">🇨🇿</span>
            )}
          </button>
        ))}
      </div>

      {/* Active group */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Standings */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="border-b border-zinc-100 px-4 py-3 flex items-center justify-between">
            <h3 className="font-bold text-zinc-900">Tabulka — Skupina {activeGroup}</h3>
            <a
              href={`/api/ms-2026/ics?team=${encodeURIComponent(group.teams[0]?.slug ?? "")}`}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:underline"
            >
              <Download className="h-3 w-3" />
              .ics
            </a>
          </div>
          <div className="divide-y divide-zinc-50">
            {/* Team list header */}
            <div className="flex flex-wrap gap-2 px-4 py-3">
              {group.teams.map((t) => (
                <a
                  key={t.slug}
                  href={`/api/ms-2026/ics?team=${t.slug}`}
                  title={`Stáhnout zápasy: ${t.nameCs}`}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-1.5 text-sm hover:border-emerald-200 hover:bg-emerald-50 transition"
                >
                  <span>{t.flag}</span>
                  <span className={`font-medium ${t.name === "Czech Republic" ? "text-emerald-700" : "text-zinc-700"}`}>
                    {t.nameCs}
                  </span>
                </a>
              ))}
            </div>
            <StandingsTable standings={groupStandings} teams={teams} />
          </div>
        </div>

        {/* Matches */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden">
          <div className="border-b border-zinc-100 bg-white px-4 py-3">
            <h3 className="flex items-center gap-2 font-bold text-zinc-900">
              <Calendar className="h-4 w-4 text-emerald-600" />
              Zápasy — Skupina {activeGroup}
            </h3>
          </div>
          <div className="flex flex-col gap-2 p-3">
            {groupMatches.map((m) => (
              <MatchRow key={m.id} match={m} teams={teams} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

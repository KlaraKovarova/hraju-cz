import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Download, Globe, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { safeJsonLd } from "@/lib/seo";
import { WC2026_GROUPS, WC2026_MATCHES, WC2026_TEAMS } from "@/lib/wc2026-data";
import { GroupsClient } from "./GroupsClient";

export const revalidate = 300; // 5 min — cron updates standings every 30 min

export const metadata: Metadata = {
  title: "MS ve fotbale 2026 — rozpis zápasů, skupiny, výsledky | hraju.cz",
  description:
    "Kompletní průvodce MS ve fotbale 2026 (USA/Kanada/Mexiko, 11. 6.–19. 7.). Rozpis zápasů České republiky, tabulky skupin a export do Google Kalendáře.",
  openGraph: {
    title: "MS ve fotbale 2026 — skupiny, zápasy, výsledky",
    description:
      "Česká republika ve skupině A. Rozpis všech 72 zápasů, live tabulky a export do Google Kalendáře.",
    url: "https://www.hraju.cz/ms-2026",
    type: "website",
    siteName: "hraju.cz",
    locale: "cs_CZ",
  },
  alternates: { canonical: "https://www.hraju.cz/ms-2026" },
};

async function getStandings() {
  try {
    return await prisma.wc2026Standing.findMany({
      orderBy: [{ group: "asc" }, { points: "desc" }],
    });
  } catch {
    return [];
  }
}

async function getMatchResults() {
  try {
    return await prisma.wc2026Match.findMany({
      where: { status: "finished" },
      select: { matchId: true, homeGoals: true, awayGoals: true, status: true },
    });
  } catch {
    return [];
  }
}

export default async function Ms2026Page() {
  const [standings, results] = await Promise.all([getStandings(), getMatchResults()]);

  // Merge DB results into static match data
  const resultMap = new Map(results.map((r) => [r.matchId, r]));
  const matchesWithResults = WC2026_MATCHES.map((m) => {
    const r = resultMap.get(m.id);
    return {
      ...m,
      homeGoals: r?.homeGoals ?? null,
      awayGoals: r?.awayGoals ?? null,
      status: r?.status ?? "scheduled",
    };
  });

  // Czech Republic matches for the featured section
  const czMatches = matchesWithResults.filter(
    (m) => m.homeTeam === "Czech Republic" || m.awayTeam === "Czech Republic"
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: "FIFA World Cup 2026",
    startDate: "2026-06-11",
    endDate: "2026-07-19",
    location: {
      "@type": "Place",
      name: "USA, Kanada, Mexiko",
    },
    organizer: { "@type": "Organization", name: "FIFA" },
    url: "https://www.hraju.cz/ms-2026",
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {/* Nav */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-extrabold tracking-tight text-zinc-900">
              hraju
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                .cz
              </span>
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
              <Trophy className="h-4 w-4 text-emerald-600" />
              MS ve fotbale 2026
            </span>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
          >
            Zpět na úvod
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                  11. 6. – 19. 7. 2026
                </span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                  48 týmů · 12 skupin · 104 zápasů
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                MS ve fotbale 2026
              </h1>
              <p className="mt-2 text-zinc-500">
                USA, Kanada, Mexiko · Skupiny A–L · Česká republika ve{" "}
                <span className="font-semibold text-emerald-700">skupině A</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/api/ms-2026/ics"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                <Download className="h-4 w-4" />
                Stáhnout celý turnaj (.ics)
              </a>
              <a
                href="/api/ms-2026/ics?team=czech-republic"
                className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                🇨🇿 Jen ČR (.ics)
              </a>
            </div>
          </div>

          {/* Tournament facts */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Hostitelé", value: "🇺🇸 🇨🇦 🇲🇽", sub: "USA, Kanada, Mexiko" },
              { label: "Stadiony", value: "16", sub: "měst po celé Sev. Americe" },
              { label: "Skupiny", value: "12", sub: "A až L, 4 týmy každá" },
              { label: "Do 2. kola", value: "32 týmů", sub: "top 2 + 8 třetích" },
            ].map((f) => (
              <div key={f.label} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-xl font-extrabold text-zinc-900">{f.value}</p>
                <p className="text-xs font-semibold text-zinc-600">{f.label}</p>
                <p className="text-xs text-zinc-400">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Czech Republic spotlight */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Česká republika — Skupina A
          </p>
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🇨🇿</span>
                <div>
                  <p className="font-extrabold text-zinc-900">Česká republika</p>
                  <p className="text-sm text-zinc-500">Skupina A · Mexiko, Jižní Afrika, Jižní Korea</p>
                </div>
              </div>
              <div className="sm:ml-auto flex flex-wrap gap-2">
                <a
                  href="/api/ms-2026/ics?team=czech-republic"
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  <Calendar className="h-4 w-4" />
                  Přidat do kalendáře
                </a>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {czMatches.map((m) => {
                const { date, time } = formatKickoffStatic(m.kickoffUtc);
                const isCzHome = m.homeTeam === "Czech Republic";
                const opponent = WC2026_TEAMS.find(
                  (t) => t.name === (isCzHome ? m.awayTeam : m.homeTeam)
                );
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2.5 text-sm"
                  >
                    <div className="w-36 shrink-0">
                      <p className="font-semibold text-zinc-800">{date}</p>
                      <p className="text-xs text-zinc-500">{time} SELČ</p>
                    </div>
                    <div className="flex flex-1 items-center gap-2 font-medium">
                      {isCzHome ? (
                        <>
                          <span>🇨🇿</span>
                          <span className="text-emerald-700">Česká republika</span>
                          <span className="text-zinc-400 text-xs">vs</span>
                          <span>{opponent?.flag}</span>
                          <span className="text-zinc-800">{opponent?.nameCs}</span>
                        </>
                      ) : (
                        <>
                          <span>{opponent?.flag}</span>
                          <span className="text-zinc-800">{opponent?.nameCs}</span>
                          <span className="text-zinc-400 text-xs">vs</span>
                          <span>🇨🇿</span>
                          <span className="text-emerald-700">Česká republika</span>
                        </>
                      )}
                    </div>
                    {m.homeGoals !== null && m.awayGoals !== null ? (
                      <span className="shrink-0 font-bold text-zinc-900">
                        {m.homeGoals} : {m.awayGoals}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* All groups */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-zinc-900">Všechny skupiny</h2>
          <a
            href="/api/ms-2026/ics"
            className="flex items-center gap-1.5 text-sm text-emerald-600 hover:underline"
          >
            <Globe className="h-4 w-4" />
            Celý turnaj (.ics)
          </a>
        </div>
        <GroupsClient
          groups={WC2026_GROUPS}
          matches={matchesWithResults}
          standings={standings.map((s) => ({
            team: s.team,
            group: s.group,
            played: s.played,
            won: s.won,
            drawn: s.drawn,
            lost: s.lost,
            goalsFor: s.goalsFor,
            goalsAgainst: s.goalsAgainst,
            points: s.points,
          }))}
          teams={WC2026_TEAMS}
        />
      </section>

      {/* Calendar export */}
      <section className="mx-auto max-w-6xl px-6 py-8 border-t border-zinc-100">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-8">
          <h2 className="text-xl font-bold text-zinc-900">Přidat do Google Kalendáře</h2>
          <p className="mt-2 text-sm text-zinc-600 max-w-lg">
            Stáhněte si zápasy přímo do kalendáře. Každý zápas obsahuje datum, čas v SELČ,
            stadion a týmy.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/api/ms-2026/ics"
              download="ms-fotbal-2026.ics"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Celý turnaj (72 zápasů)
            </a>
            <a
              href="/api/ms-2026/ics?team=czech-republic"
              download="ms-2026-ceska-republika.ics"
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              🇨🇿 Jen Česká republika (3 zápasy)
            </a>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Po stažení: otevřete soubor → automaticky se přidá do Google Kalendáře / Apple Kalendáře.
            Nebo klikněte pravým tlačítkem → &quot;Otevřít s&quot; → váš kalendář.
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center">
          <p className="text-xs text-zinc-400">
            Data:{" "}
            <a
              href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-500"
            >
              FIFA.com
            </a>{" "}
            · Časy v SELČ (UTC+2) · Automatická aktualizace výsledků každých 30 minut
          </p>
        </div>
      </div>
    </main>
  );
}

// Server-side date formatter (avoids hydration mismatch)
function formatKickoffStatic(utcStr: string): { date: string; time: string } {
  const d = new Date(utcStr);
  const date = d.toLocaleDateString("cs-CZ", {
    timeZone: "Europe/Prague",
    day: "numeric",
    month: "long",
    weekday: "long",
  });
  const time = d.toLocaleTimeString("cs-CZ", {
    timeZone: "Europe/Prague",
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}

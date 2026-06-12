import Link from "next/link";
import { MapPin, ArrowRight, ChevronDown, Calendar, PlusCircle, Flame, Trophy } from "lucide-react";
import { SPORTS } from "@/lib/sports";
import { safeJsonLd } from "@/lib/seo";
import {
  getTotalFacilityCount,
  getTotalSportCount,
  getTopCitiesOverall,
  getMostActiveFacilities,
  getRecentConditionReports,
  getRecentTripReports,
} from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { WC2026_MATCHES, WC2026_TEAMS } from "@/lib/wc2026-data";
import { HeroSearchForm } from "@/components/HeroSearchForm";
import { HomeRecentConditions } from "@/components/HomeRecentConditions";
import { HomeRecentTripReports } from "@/components/HomeRecentTripReports";
import { AdSlot } from "@/components/AdSlot";
import { WeekendEvents } from "@/components/WeekendEvents";
import { MonthlyChallenges } from "@/components/MonthlyChallenges";
import { getActiveChallenges } from "@/lib/monthly-challenges";

// ISR: 30 min during MS 2026 tournament (Jun 11–Jul 19) to keep match results fresh
export const revalidate = 1800;

export default async function Home() {
  const totalFacilities = getTotalFacilityCount();
  const totalSports = getTotalSportCount();
  const [topCities, mostActiveFacilities, recentConditions, recentTripReports] =
    await Promise.all([
      getTopCitiesOverall(10),
      getMostActiveFacilities(30, 5),
      getRecentConditionReports(6, 7),
      getRecentTripReports(6),
    ]);
  const conditionsLcpThumb = recentConditions.find((r) => r.thumbnailUrl)?.thumbnailUrl ?? null;

  // WC2026: fetch today's matches sequentially (CloudLinux pg-thread limit)
  const todayWcMatches = await getTodayWc2026Matches();

  // FAQ data for structured markup
  const faqItems = [
    {
      question: "Kolik sportovišť je na hraju.cz?",
      answer: `Na hraju.cz najdete přes ${Math.floor(totalFacilities / 100) * 100} sportovišť v ${totalSports} sportech po celé České republice. Databázi průběžně rozšiřujeme.`,
    },
    {
      question: "Jak přidat své sportoviště?",
      answer: "Pokud provozujete sportoviště, můžete si svůj profil převzít zdarma na stránce /moje-sportoviste. Stačí zadat e-mail spojený s vaším areálem a obdržíte přihlašovací odkaz.",
    },
    {
      question: "Je hraju.cz zdarma?",
      answer: "Základní zápis sportoviště je zcela zdarma. Pro provozovatele nabízíme Premium předplatné, které zahrnuje zvýraznění ve výsledcích, fotogalerii, tlačítko pro rezervaci a další funkce.",
    },
  ];

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "hraju.cz",
    url: "https://www.hraju.cz",
    logo: "https://www.hraju.cz/og-image.jpg",
    description: "Sportoviště v České republice — squash, bazény, fitness, lezecké stěny, ferraty a další.",
    areaServed: {
      "@type": "Country",
      name: "Czech Republic",
    },
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "hraju.cz",
    url: "https://www.hraju.cz",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.hraju.cz/hledat?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  // Event JSON-LD for active monthly challenges
  const activeChallenges = getActiveChallenges();
  const challengeEventsLd = activeChallenges.length > 0 ? activeChallenges.map((c) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: c.title,
    description: c.description,
    startDate: c.startDate,
    endDate: c.endDate,
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    organizer: {
      "@type": "Organization",
      name: "hraju.cz",
      url: "https://www.hraju.cz",
    },
    location: {
      "@type": "VirtualLocation",
      url: `https://www.hraju.cz/sport/${c.sportSlug}`,
    },
    url: `https://www.hraju.cz/sport/${c.sportSlug}`,
  })) : [];

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteLd) }}
      />
      {challengeEventsLd.map((ld, i) => (
        <script
          key={`challenge-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(ld) }}
        />
      ))}
      {/* LCP preload for first conditions rail thumbnail */}
      {conditionsLcpThumb && (
        <link rel="preload" as="image" href={conditionsLcpThumb} fetchPriority="high" />
      )}
      {/* Navigation */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-zinc-900">
              hraju
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                .cz
              </span>
            </span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-zinc-500 sm:flex">
            {SPORTS.slice(0, 5).map((sport) => (
              <Link
                key={sport.slug}
                href={`/sport/${sport.slug}`}
                className="transition hover:text-zinc-900"
              >
                {sport.icon} {sport.nameCs}
              </Link>
            ))}
            <Link
              href="/akce"
              className="transition hover:text-zinc-900"
            >
              <Calendar className="inline h-3.5 w-3.5" /> Akce
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMGI5ODEiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="relative mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              Kam dnes{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                půjdete hrát?
              </span>
            </h1>
            <p className="mt-4 text-lg text-zinc-600 sm:text-xl">
              Najděte sportoviště poblíž vás. Squash, bazény, fitness,
              lezecké stěny i ferraty po celé České republice.
            </p>

            {/* Search Box */}
            <HeroSearchForm />

            {/* Quick city links */}
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-zinc-400">Oblíbená města:</span>
              {topCities.slice(0, 5).map((city) => (
                <Link
                  key={city.citySlug}
                  href={`/mesto/${city.citySlug}`}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-zinc-600 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  {city.city}
                </Link>
              ))}
            </div>

            <div className="mt-4">
              <Link
                href="/pridat-sportoviste"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
              >
                <PlusCircle className="h-4 w-4" />
                Chybí vám sportoviště? Přidejte ho
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-8 px-6 py-5 text-center sm:gap-16">
          <div>
            <span className="text-2xl font-extrabold text-zinc-900">{totalFacilities.toLocaleString("cs-CZ")}+</span>
            <p className="text-xs text-zinc-500">sportovišť</p>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-zinc-900">{totalSports}</span>
            <p className="text-xs text-zinc-500">sportů</p>
          </div>
        </div>
      </section>

      {/* Recent Conditions Rail (SIL-655) */}
      <HomeRecentConditions reports={recentConditions} />

      {/* Recent Trip Reports Rail (SIL-678) — ferraty + lezení only */}
      <HomeRecentTripReports reports={recentTripReports} />

      {/* Sports Grid */}
      <section id="sports" className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Vyberte si aktivitu
          </h2>
          <p className="mt-2 text-zinc-500">
            Najděte sportoviště ve svém okolí
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {SPORTS.map((sport) => (
            <Link
              key={sport.slug}
              href={`/sport/${sport.slug}`}
              className={`group relative flex flex-col items-center gap-4 rounded-3xl border-2 border-transparent ${sport.lightBg} p-8 text-center transition-all hover:border-current hover:shadow-lg hover:shadow-${sport.color}-100/50 hover:scale-[1.02]`}
            >
              <span className="text-5xl transition-transform group-hover:scale-110">
                {sport.icon}
              </span>
              <div>
                <span className="text-base font-bold text-zinc-800">
                  {sport.nameCs}
                </span>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {sport.description.replace(" v České republice", "")}
                </p>
              </div>
              <span
                className={`${sport.accent} flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100`}
              >
                Zobrazit <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* MS ve fotbale 2026 — today's matches */}
      {todayWcMatches.length > 0 && (
        <section className="border-t border-zinc-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-zinc-900">MS ve fotbale 2026 — dnešní zápasy</h2>
              </div>
              <Link
                href="/ms-2026"
                className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline"
              >
                Všechny skupiny <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {todayWcMatches.map((m) => {
                const homeTeam = WC2026_TEAMS.find((t) => t.name === m.homeTeam);
                const awayTeam = WC2026_TEAMS.find((t) => t.name === m.awayTeam);
                const kickoffTime = new Date(m.kickoffUtc).toLocaleTimeString("cs-CZ", {
                  timeZone: "Europe/Prague",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const isCzMatch = m.homeTeam === "Czech Republic" || m.awayTeam === "Czech Republic";
                return (
                  <div
                    key={m.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                      isCzMatch
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-zinc-100 bg-zinc-50/50"
                    }`}
                  >
                    <div className="w-12 shrink-0 text-center">
                      {m.status === "finished" ? (
                        <span className="text-xs font-medium text-zinc-400">konec</span>
                      ) : m.status === "live" ? (
                        <span className="text-xs font-bold text-red-500">LIVE</span>
                      ) : (
                        <span className="text-xs font-medium text-zinc-500">{kickoffTime}</span>
                      )}
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2 text-sm font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{homeTeam?.flag}</span>
                        <span className={isCzMatch && m.homeTeam === "Czech Republic" ? "text-emerald-700 font-bold" : "text-zinc-800"}>
                          {homeTeam?.nameCs ?? m.homeTeam}
                        </span>
                      </div>
                      {m.homeGoals !== null && m.awayGoals !== null ? (
                        <span className="shrink-0 rounded bg-zinc-900 px-2 py-0.5 text-xs font-extrabold text-white tabular-nums">
                          {m.homeGoals} : {m.awayGoals}
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs text-zinc-400">vs</span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className={isCzMatch && m.awayTeam === "Czech Republic" ? "text-emerald-700 font-bold" : "text-zinc-800"}>
                          {awayTeam?.nameCs ?? m.awayTeam}
                        </span>
                        <span>{awayTeam?.flag}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-right text-xs text-zinc-400">Časy v SELČ · aktualizace každých 30 min</p>
          </div>
        </section>
      )}

      {/* Ad: between Featured and Top Cities */}
      <div className="mx-auto max-w-6xl px-6 py-4">
        <AdSlot slot="1234567890" format="horizontal" />
      </div>

      {/* Most Active Facilities */}
      {mostActiveFacilities.length > 0 && (
        <section className="border-t border-zinc-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Nejaktivnější sportoviště
              </h2>
              <p className="mt-2 text-zinc-500">
                Sportoviště s nejvíce check-iny za posledních 30 dní
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {mostActiveFacilities.map((facility, index) => (
                <Link
                  key={facility.id}
                  href={facility.sportSlug ? `/sport/${facility.sportSlug}/${facility.slug}` : `/${facility.slug}`}
                  className="group rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5 transition hover:border-emerald-200 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0 ? "bg-amber-100 text-amber-700"
                      : index === 1 ? "bg-zinc-200 text-zinc-600"
                      : index === 2 ? "bg-orange-100 text-orange-700"
                      : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900 group-hover:text-emerald-600">
                        {facility.name}
                      </p>
                      <p className="text-xs text-zinc-400">{facility.city}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-500" />
                      {facility.activityCount} aktivit
                    </span>
                  </div>
                  {facility.sportName && (
                    <p className="mt-2 text-[11px] font-medium text-emerald-600">
                      {facility.sportName}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Cities */}
      {topCities.length > 0 && (
        <section className="border-t border-zinc-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Sportoviště ve městech
              </h2>
              <p className="mt-2 text-zinc-500">
                Nejoblíbenější města podle počtu sportovišť
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {topCities.map((city) => (
                <Link
                  key={city.citySlug}
                  href={`/mesto/${city.citySlug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition hover:border-emerald-200 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-medium text-zinc-700 group-hover:text-zinc-900">
                      {city.city}
                    </span>
                    <p className="text-xs text-zinc-400">
                      {city.facilityCount} sportovišť
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Monthly Challenges hidden for now */}
      {/* <MonthlyChallenges /> */}

      {/* Weekend Tourist Events */}
      <WeekendEvents />

      {/* CTA / Info Section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-10 text-center text-white sm:p-14">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Provozujete sportoviště?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-emerald-100">
            Zaregistrujte svůj areál zdarma a oslovte tisíce sportovců hledajících
            místo, kde si zahrají.
          </p>
          <Link
            href="/moje-sportoviste"
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-emerald-700 shadow-lg transition hover:shadow-xl"
          >
            Zaregistrovat sportoviště
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-zinc-100 bg-zinc-50/50">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-zinc-900">
            Časté dotazy
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <details key={i} className="group rounded-2xl border border-zinc-100 bg-white">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-semibold text-zinc-900">
                  {item.question}
                  <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-4 text-sm text-zinc-600">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

async function getTodayWc2026Matches() {
  const now = new Date();
  // "sv-SE" locale produces YYYY-MM-DD — reliable for date comparison
  const todayPrague = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Prague" });

  // Static filter — never fails; section always renders on match days
  const todayMatches = WC2026_MATCHES.filter((m) => {
    const d = new Date(m.kickoffUtc).toLocaleDateString("sv-SE", { timeZone: "Europe/Prague" });
    return d === todayPrague;
  });

  if (todayMatches.length === 0) return [];

  // DB results are best-effort — if Prisma throws (CloudLinux thread limit),
  // we still show the scheduled matches with kickoff times.
  let resultMap = new Map<string, { homeGoals: number | null; awayGoals: number | null; status: string }>();
  try {
    const matchIds = todayMatches.map((m) => m.id);
    const results = await prisma.wc2026Match.findMany({
      where: { matchId: { in: matchIds } },
      select: { matchId: true, homeGoals: true, awayGoals: true, status: true },
    });
    resultMap = new Map(results.map((r) => [r.matchId, r]));
  } catch {
    // Silently degrade — show matches without scores
  }

  return todayMatches.map((m) => {
    const r = resultMap.get(m.id);
    return {
      ...m,
      homeGoals: r?.homeGoals ?? null,
      awayGoals: r?.awayGoals ?? null,
      status: r?.status ?? "scheduled",
    };
  });
}

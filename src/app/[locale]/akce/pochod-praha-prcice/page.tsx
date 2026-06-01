import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Footprints } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { safeJsonLd } from "@/lib/seo";
import PrciceClient from "./PrciceClient";

export const revalidate = 86400; // 24 hours

export const metadata: Metadata = {
  title: "Pochod Praha–Prčice — statistiky tras a účastníků | hraju.cz",
  description:
    "Statistiky tras a počty účastníků pochodu Praha–Prčice pro roky 2019–2024. Jeden z největších turistických pochodů v České republice.",
  openGraph: {
    title: "Pochod Praha–Prčice — statistiky tras a účastníků",
    description:
      "Statistiky tras a počty účastníků pochodu Praha–Prčice. Jeden z největších turistických pochodů v ČR.",
    url: "https://www.hraju.cz/akce/pochod-praha-prcice",
    type: "website",
    siteName: "hraju.cz",
    locale: "cs_CZ",
  },
  alternates: { canonical: "https://www.hraju.cz/akce/pochod-praha-prcice" },
};

async function getRoutes() {
  return prisma.prciceRoute.findMany({
    orderBy: [{ year: "desc" }, { distanceKm: "desc" }],
    select: {
      id: true,
      year: true,
      routeName: true,
      distanceKm: true,
      participants: true,
      mapEmbed: true,
    },
  });
}

export default async function PochodyPrcicePage() {
  const routes = await getRoutes().catch(() => []);

  const years = [...new Set(routes.map((r) => r.year))].sort((a, b) => b - a);
  const totalParticipants = routes.reduce((s, r) => s + r.participants, 0);
  const latestYear = years[0] ?? null;
  const latestCount =
    latestYear != null
      ? routes.filter((r) => r.year === latestYear).reduce((s, r) => s + r.participants, 0)
      : 0;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hraju.cz", item: "https://www.hraju.cz" },
      { "@type": "ListItem", position: 2, name: "Akce", item: "https://www.hraju.cz/akce" },
      {
        "@type": "ListItem",
        position: 3,
        name: "Pochod Praha–Prčice",
        item: "https://www.hraju.cz/akce/pochod-praha-prcice",
      },
    ],
  };

  const eventLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: "Pochod Praha–Prčice",
    description:
      "Jeden z největších turistických pochodů v České republice. Desítky tisíc účastníků každoročně překonávají trasy různých délek z Prahy až do Prčice.",
    location: {
      "@type": "Place",
      name: "Praha–Prčice",
      address: { "@type": "PostalAddress", addressCountry: "CZ" },
    },
    organizer: { "@type": "Organization", name: "Klub českých turistů", url: "https://kct.cz" },
    url: "https://praha-prcice.cz",
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(eventLd) }}
      />

      {/* Nav */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-zinc-900">
            hraju
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              .cz
            </span>
          </Link>
          <span className="text-zinc-300">/</span>
          <Link
            href="/akce"
            className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-700"
          >
            <Calendar className="h-4 w-4" />
            Akce
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
            <Footprints className="h-4 w-4 text-emerald-600" />
            Praha–Prčice
          </span>
          <div className="ml-auto">
            <Link
              href="/akce"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
            >
              ← Akce
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                Pochod Praha–Prčice
              </h1>
              <p className="mt-2 max-w-2xl text-zinc-500">
                Jeden z největších turistických pochodů v České republice. Pořádá ho Klub českých
                turistů každý rok v květnu. Trasy různých délek startují z různých míst a všechny
                vedou do Prčice.
              </p>
            </div>
            <a
              href="https://praha-prcice.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 transition"
            >
              Oficiální web →
            </a>
          </div>

          {/* KPI chips */}
          {routes.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-4">
              {latestYear && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                  <div className="text-zinc-400">Poslední ročník</div>
                  <div className="font-bold text-zinc-900 text-xl">{latestYear}</div>
                  <div className="text-emerald-600 font-medium">
                    {latestCount.toLocaleString("cs-CZ")} účastníků
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                <div className="text-zinc-400">Celkem ročníků</div>
                <div className="font-bold text-zinc-900 text-xl">{years.length}</div>
                <div className="text-zinc-500">({years[years.length - 1]}–{years[0]})</div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                <div className="text-zinc-400">Celkem účastníků</div>
                <div className="font-bold text-zinc-900 text-xl">
                  {totalParticipants.toLocaleString("cs-CZ")}
                </div>
                <div className="text-zinc-500">přes všechny ročníky</div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                <div className="text-zinc-400">Trasy</div>
                <div className="font-bold text-zinc-900 text-xl">21</div>
                <div className="text-zinc-500">každý ročník</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Interactive table + filters */}
      {routes.length > 0 ? (
        <PrciceClient routes={routes} />
      ) : (
        <div className="mx-auto max-w-6xl px-6 py-12 text-center text-zinc-400">
          Data se nepodařilo načíst.
        </div>
      )}

      {/* Source */}
      <div className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center">
          <p className="text-xs text-zinc-400">
            Zdrojová data:{" "}
            <a
              href="https://praha-prcice.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-500"
            >
              praha-prcice.cz
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

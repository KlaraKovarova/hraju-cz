import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, MapPin, PlusCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { REGIONS } from "@/lib/regions";
import { safeJsonLd } from "@/lib/seo";
import { AdSlot } from "@/components/AdSlot";
import { EventsClient } from "./EventsClient";

export const revalidate = 7200; // 2 hours (optimization: events update weekly)

export const metadata: Metadata = {
  title: "Turistické akce v ČR — kalendář akcí | hraju.cz",
  description:
    "Přehled turistických akcí v České republice. Kalendář akcí KČT i komunitních událostí — najdi, kam vyrazit o víkendu.",
  openGraph: {
    title: "Turistické akce v ČR — kalendář akcí",
    description:
      "Přehled turistických akcí v České republice. Kalendář akcí KČT i komunitních událostí.",
    url: "https://www.hraju.cz/akce",
    type: "website",
    siteName: "hraju.cz",
    locale: "cs_CZ",
  },
  alternates: { canonical: "https://www.hraju.cz/akce" },
};

async function getEventsData() {
  const now = new Date();
  const twoMonthsLater = new Date(now);
  twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

  const where = {
    isActive: true,
    dateStart: { gte: now, lte: twoMonthsLater },
  };

  // Run sequentially to stay within CloudLinux thread limits
  const events = await prisma.touristEvent.findMany({
    where,
    orderBy: { dateStart: "asc" },
    take: 200,
    select: {
      id: true,
      sourceId: true,
      name: true,
      dateStart: true,
      dateEnd: true,
      city: true,
      region: true,
      description: true,
      externalUrl: true,
      lat: true,
      lng: true,
      source: true,
    },
  });

  const regionCounts = await prisma.touristEvent.groupBy({
    by: ["region"],
    where: { ...where, region: { not: null } },
    _count: true,
  });

  const totalCount = await prisma.touristEvent.count({ where });

  return { events, regionCounts, totalCount };
}

function kctEventUrl(sourceId: string): string {
  const xid = sourceId.replace("kct-", "");
  return `https://kalendar.kct-db.cz/texty/kalendarakci-detail.php?xid=${xid}`;
}

export default async function AkcePage() {
  const data = await getEventsData().catch(() => ({
    events: [] as Awaited<ReturnType<typeof getEventsData>>["events"],
    regionCounts: [] as Awaited<ReturnType<typeof getEventsData>>["regionCounts"],
    totalCount: 0,
  }));
  const { events, regionCounts, totalCount } = data;

  // Prepare data for client component
  const serializedEvents = events.map((e) => ({
    id: e.id,
    name: e.name,
    dateStart: e.dateStart.toISOString(),
    dateEnd: e.dateEnd?.toISOString() ?? null,
    city: e.city,
    region: e.region,
    description: e.description
      ? e.description.length > 150
        ? e.description.slice(0, 150) + "..."
        : e.description
      : null,
    externalUrl:
      e.source === "kct" ? kctEventUrl(e.sourceId) : e.externalUrl,
    lat: e.lat,
    lng: e.lng,
  }));

  // Region filter options — match DB region values against canonical REGIONS list.
  // Newly scraped events store the Czech kraj name; old records had district (okr)
  // names that don't match, so fall back to raw distinct values when needed.
  const getCount = (c: { _count: { _all: number } | number }) =>
    typeof c._count === "object" ? (c._count as { _all: number })._all : (c._count as number);

  const regionCountMap = new Map(regionCounts.map((rc) => [rc.region as string, getCount(rc)]));

  let activeRegions = REGIONS.filter((r) => regionCountMap.has(r.name)).map((r) => ({
    name: r.name,
    count: regionCountMap.get(r.name) ?? 0,
  }));

  // Fallback: if no canonical REGIONS matched (legacy district data), use raw distinct values
  if (activeRegions.length === 0 && regionCounts.length > 0) {
    activeRegions = regionCounts
      .filter((rc) => rc.region != null)
      .map((rc) => ({ name: rc.region as string, count: getCount(rc) }))
      .sort((a, b) => b.count - a.count);
  }

  // JSON-LD Event markup for the first 20 events
  const eventsLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Turistické akce v České republice",
    numberOfItems: totalCount,
    itemListElement: events.slice(0, 20).map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Event",
        name: e.name,
        startDate: e.dateStart.toISOString(),
        ...(e.dateEnd ? { endDate: e.dateEnd.toISOString() } : {}),
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "Place",
          name: e.city,
          ...(e.region ? { address: { "@type": "PostalAddress", addressRegion: e.region } } : {}),
          ...(e.lat && e.lng
            ? { geo: { "@type": "GeoCoordinates", latitude: e.lat, longitude: e.lng } }
            : {}),
        },
        organizer: {
          "@type": "Organization",
          name: "Klub českých turistů",
          url: "https://kct.cz",
        },
        ...(e.description ? { description: e.description.slice(0, 200) } : {}),
        ...(e.externalUrl || e.source === "kct"
          ? { url: e.source === "kct" ? kctEventUrl(e.sourceId) : e.externalUrl }
          : {}),
      },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hraju.cz", item: "https://www.hraju.cz" },
      { "@type": "ListItem", position: 2, name: "Akce", item: "https://www.hraju.cz/akce" },
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(eventsLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />

      {/* Header */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xl font-extrabold tracking-tight text-zinc-900"
            >
              hraju
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                .cz
              </span>
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
              <Calendar className="h-4 w-4 text-emerald-600" />
              Akce
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                Turistické akce v ČR
              </h1>
              <p className="mt-2 text-zinc-500">
                Přehled{" "}
                <span className="font-semibold text-zinc-900">{totalCount}</span>{" "}
                nadcházejících akcí v{" "}
                <span className="font-semibold text-zinc-900">{activeRegions.length}</span>{" "}
                krajích. Akce KČT i komunitní události.
              </p>
            </div>
            <Link
              href="/pridat-akci"
              className="hidden shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 sm:inline-flex"
            >
              <PlusCircle className="h-4 w-4" />
              Přidat akci
            </Link>
          </div>
          {/* Mobile CTA */}
          <Link
            href="/pridat-akci"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700 sm:hidden"
          >
            <PlusCircle className="h-4 w-4" />
            Přidat akci
          </Link>
        </div>
      </section>

      {/* Client-side interactive content */}
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-6 py-12 text-center text-zinc-400">
            Načítání akcí...
          </div>
        }
      >
        <EventsClient
          events={serializedEvents}
          regions={activeRegions}
        />
      </Suspense>

      {/* Ad slot */}
      <div className="mx-auto max-w-6xl px-6 py-4">
        <AdSlot slot="1234567895" format="horizontal" />
      </div>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-12 border-t border-zinc-100">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-8 text-center">
          <h2 className="text-xl font-bold text-zinc-900">
            Pořádáte turistickou akci?
          </h2>
          <p className="mt-2 text-sm text-zinc-600 max-w-lg mx-auto">
            Přidejte ji zdarma do kalendáře na hraju.cz. Oslovíte tisíce sportovců a turistů po celé České republice.
          </p>
          <div className="mt-6">
            <Link
              href="/pridat-akci"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <PlusCircle className="h-4 w-4" />
              Přidat akci zdarma
            </Link>
          </div>
        </div>
      </section>

      {/* Source attribution */}
      <div className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center">
          <p className="text-xs text-zinc-400">
            Zdroj akcí: Kalendář akcí{" "}
            <a
              href="https://kalendar.kct-db.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-500"
            >
              Klub českých turistů
            </a>{" "}
            + komunitní příspěvky
          </p>
        </div>
      </div>
    </main>
  );
}

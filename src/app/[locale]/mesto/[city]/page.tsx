import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ChevronRight, Building2, BookOpen } from "lucide-react";
import { getFacilitiesByCity, getTopCitiesOverallForMesto } from "@/lib/data";
import { SPORTS, getSportBySlug } from "@/lib/sports";
import { getPostsBySport } from "@/lib/blog";
import { FacilityCard } from "@/components/FacilityCard";
import { FacilityMap } from "@/components/FacilityMap";
import { TrackPageView } from "@/components/TrackPageView";
import { getCityInPhrase } from "@/lib/locative";

// ISR: revalidate city pages every 12 hours (optimization)
export const revalidate = 43200;

type Props = {
  params: Promise<{ city: string }>;
};

export async function generateStaticParams() {
  const cities = await getTopCitiesOverallForMesto(20);
  return cities.map((c) => ({ city: c.citySlug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const { cityName, facilities, sportGroups } = await getFacilitiesByCity(citySlug);
  if (!cityName || facilities.length === 0) return {};

  const title = `Sportoviště ${cityName} \u2014 ${facilities.length} sportovišť v ${sportGroups.length} sportech`;
  const description = `Najděte ${facilities.length} sportovišť ${getCityInPhrase(cityName)}. ${sportGroups.map((g) => g.sport.nameCs).join(", ")}. Adresy, kontakty, otevírací doby.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.hraju.cz/mesto/${citySlug}`,
      siteName: "hraju.cz",
      locale: "cs_CZ",
      type: "website",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `Sportoviště ${cityName} — hraju.cz` }],
    },
    twitter: { card: "summary_large_image" },
    alternates: {
      canonical: `https://www.hraju.cz/mesto/${citySlug}`,
    },
  };
}

export default async function CrossSportCityPage({ params }: Props) {
  const { city: citySlug } = await params;
  const { facilities, cityName, sportGroups } = await getFacilitiesByCity(citySlug);

  if (!cityName || facilities.length === 0) notFound();

  const mapMarkers = facilities
    .filter((f) => f.lat && f.lng)
    .map((f) => {
      const sportSlug = f.sports[0]?.sport.slug ?? "squash";
      return {
        lat: f.lat!,
        lng: f.lng!,
        name: f.name,
        address: f.address,
        url: `/sport/${sportSlug}/${f.slug}`,
      };
    });

  // Deduplicate facilities (a facility may appear in multiple sport groups)
  const uniqueFacilityCount = new Set(facilities.map((f) => f.id)).size;

  // Find top sport
  const topSport = sportGroups[0];

  // Collect related blog posts for sports present in this city (deduplicated, max 3)
  const citySportSlugs = sportGroups.map((g) => g.sport.slug);
  const seenSlugs = new Set<string>();
  const cityBlogPosts = citySportSlugs
    .flatMap((slug) => getPostsBySport(slug))
    .filter((p) => {
      if (seenSlugs.has(p.slug)) return false;
      seenSlugs.add(p.slug);
      return true;
    })
    .slice(0, 3);

  // JSON-LD ItemList
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Sportoviště ${cityName}`,
    numberOfItems: uniqueFacilityCount,
    itemListElement: facilities.slice(0, 50).map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: f.name,
      url: `https://www.hraju.cz/sport/${f.sports[0]?.sport.slug ?? "squash"}/${f.slug}`,
    })),
  };

  // BreadcrumbList JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hraju.cz", item: "https://www.hraju.cz" },
      { "@type": "ListItem", position: 2, name: "Města", item: "https://www.hraju.cz/mesta" },
      { "@type": "ListItem", position: 3, name: cityName, item: `https://www.hraju.cz/mesto/${citySlug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <TrackPageView
        eventName="city_page_view"
        params={{ city: cityName }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Breadcrumb Header */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <Link
              href="/"
              className="font-extrabold text-zinc-900 hover:text-emerald-600"
            >
              hraju
              <span className="text-emerald-600">.cz</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <Link href="/mesta" className="hover:text-zinc-900">
              Města
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <span className="font-medium text-zinc-900">{cityName}</span>
          </div>
        </div>
      </nav>

      {/* City Hero */}
      <section className="border-b border-zinc-100 bg-gradient-to-br from-emerald-50 to-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
              <Building2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                Sportoviště {getCityInPhrase(cityName)}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-zinc-500">
                <MapPin className="h-4 w-4" />
                {uniqueFacilityCount} sportovišť v {sportGroups.length} sportech
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-6 py-4 text-sm text-zinc-600">
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-900">{uniqueFacilityCount}</span> sportovišť
          </span>
          <span className="h-4 w-px bg-zinc-200" />
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-900">{sportGroups.length}</span> sportů
          </span>
          {topSport && (
            <>
              <span className="h-4 w-px bg-zinc-200" />
              <span className="flex items-center gap-1.5">
                Top sport: <span className="font-semibold text-zinc-900">{topSport.sport.icon} {topSport.sport.nameCs}</span>
              </span>
            </>
          )}
        </div>
      </section>

      {/* Map */}
      {mapMarkers.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-8">
          <FacilityMap markers={mapMarkers} />
        </section>
      )}

      {/* Sport Sections */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-10">
          {sportGroups.map((group) => {
            const sport = getSportBySlug(group.sport.slug);
            const showFacilities = group.facilities.slice(0, 4);
            const hasMore = group.facilities.length > 4;

            return (
              <div key={group.sport.slug}>
                <div className="mb-4 flex items-center justify-between">
                  <Link
                    href={`/sport/${group.sport.slug}/${citySlug}`}
                    className="group flex items-center gap-2"
                  >
                    <h2 className="text-xl font-bold text-zinc-900 group-hover:text-emerald-600">
                      {group.sport.icon} {group.sport.nameCs}
                      <span className="ml-2 text-sm font-normal text-zinc-400">
                        ({group.facilities.length})
                      </span>
                    </h2>
                  </Link>
                  <Link
                    href={`/sport/${group.sport.slug}/${citySlug}`}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Zobrazit všech {group.facilities.length} &rarr;
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {showFacilities.map((facility) => (
                    <FacilityCard
                      key={`${group.sport.slug}-${facility.id}`}
                      facility={facility}
                      sportSlug={group.sport.slug}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-4 text-center">
                    <Link
                      href={`/sport/${group.sport.slug}/${citySlug}`}
                      className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition hover:shadow-sm ${
                        sport
                          ? `${sport.lightBg} ${sport.accent} ${sport.borderColor}`
                          : "bg-zinc-50 text-zinc-700 border-zinc-200"
                      }`}
                    >
                      Zobrazit všech {group.facilities.length} {group.sport.nameCs.toLowerCase()} sportovišť
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Related Blog Posts */}
      {cityBlogPosts.length > 0 && (
        <section className="border-t border-zinc-100 bg-zinc-50/50">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <h3 className="mb-6 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <BookOpen className="h-4 w-4" />
              Články ze světa sportu
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {cityBlogPosts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white transition hover:border-zinc-200 hover:shadow-md"
                >
                  {p.image && (
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-bold text-zinc-900 group-hover:text-emerald-700">
                      {p.title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {new Date(p.date).toLocaleDateString("cs-CZ", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <p className="mt-4 text-center">
              <Link
                href="/blog"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Zobrazit všechny články &rarr;
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* All Sports Quick Links */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Sporty {getCityInPhrase(cityName)}
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {sportGroups.map((group) => {
              const sport = SPORTS.find((s) => s.slug === group.sport.slug);
              return (
                <Link
                  key={group.sport.slug}
                  href={`/sport/${group.sport.slug}/${citySlug}`}
                  className={`flex items-center gap-2 rounded-full border border-zinc-100 ${
                    sport?.lightBg ?? "bg-zinc-50"
                  } px-4 py-2 text-sm font-medium text-zinc-700 transition hover:shadow-sm`}
                >
                  <span>{group.sport.icon}</span>
                  {group.sport.nameCs} ({group.facilities.length})
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

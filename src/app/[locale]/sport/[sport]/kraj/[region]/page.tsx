import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, ChevronRight, Star, Map as MapIcon } from "lucide-react";
import { getSportBySlug, SPORTS } from "@/lib/sports";
import { getRegionBySlug, REGIONS } from "@/lib/regions";
import {
  getCitiesByRegionAndSport,
  getTopFacilitiesByRegionAndSport,
  getRegionSportReviewStats,
  getFacilityMapMarkersByRegionAndSport,
} from "@/lib/data";
import {
  getSportFacilityTypePluralGenitive,
  getSportFacilityTypeInstrumental,
  safeJsonLd,
} from "@/lib/seo";
import { FacilityCard } from "@/components/FacilityCard";
import { FacilityMap } from "@/components/FacilityMap";
import { AdSlot } from "@/components/AdSlot";
import { BannerSlot } from "@/components/BannerSlot";
import type { Metadata } from "next";

// ISR: revalidate region pages every 12 hours (optimization)
export const revalidate = 43200;

export function generateStaticParams() {
  return SPORTS.flatMap((s) =>
    REGIONS.map((r) => ({ sport: s.slug, region: r.slug }))
  );
}

interface RegionPageProps {
  params: Promise<{ sport: string; region: string }>;
}

export async function generateMetadata({
  params,
}: RegionPageProps): Promise<Metadata> {
  const { sport: sportSlug, region: regionSlug } = await params;
  const sport = getSportBySlug(sportSlug);
  const region = getRegionBySlug(regionSlug);
  if (!sport || !region) return {};

  const cities = await getCitiesByRegionAndSport(regionSlug, sport.slug);
  const totalFacilities = cities.reduce((sum, c) => sum + c.facilityCount, 0);

  const title = `${sport.nameCs} v kraji ${region.name} | ${totalFacilities} sportovišť`;
  const description = `${totalFacilities} ${getSportFacilityTypePluralGenitive(sport.slug)} v kraji ${region.name}. Přehled měst s ${getSportFacilityTypeInstrumental(sport.slug)} — vyberte město a najděte sportoviště s kontakty, recenzemi a mapou.`;
  const url = `https://www.hraju.cz/sport/${sportSlug}/kraj/${regionSlug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "hraju.cz",
      locale: "cs_CZ",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: `${sport.nameCs} v kraji ${region.name} — hraju.cz`,
        },
      ],
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: url },
  };
}

export default async function RegionPage({ params }: RegionPageProps) {
  const { sport: sportSlug, region: regionSlug } = await params;
  const sport = getSportBySlug(sportSlug);
  const region = getRegionBySlug(regionSlug);

  if (!sport || !region) {
    notFound();
  }

  const [cities, topFacilities, reviewStats] = await Promise.all([
    getCitiesByRegionAndSport(regionSlug, sport.slug),
    getTopFacilitiesByRegionAndSport(regionSlug, sport.slug, 20),
    getRegionSportReviewStats(regionSlug, sport.slug),
  ]);

  const totalFacilities = cities.reduce((sum, c) => sum + c.facilityCount, 0);
  const mapMarkers = getFacilityMapMarkersByRegionAndSport(
    regionSlug,
    sportSlug
  );

  // Other regions that have facilities for this sport
  const otherRegions = REGIONS.filter((r) => r.slug !== regionSlug);

  // BreadcrumbList JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "hraju.cz",
        item: "https://www.hraju.cz",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: sport.nameCs,
        item: `https://www.hraju.cz/sport/${sportSlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: region.name,
        item: `https://www.hraju.cz/sport/${sportSlug}/kraj/${regionSlug}`,
      },
    ],
  };

  // CollectionPage JSON-LD
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${sport.nameCs} v kraji ${region.name}`,
    description: `${totalFacilities} ${getSportFacilityTypePluralGenitive(sport.slug)} v kraji ${region.name}`,
    url: `https://www.hraju.cz/sport/${sportSlug}/kraj/${regionSlug}`,
    numberOfItems: totalFacilities,
    ...(reviewStats.totalReviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewStats.averageRating,
            reviewCount: reviewStats.totalReviews,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  // ItemList JSON-LD for facilities shown
  const itemListLd = topFacilities.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${sport.nameCs} — ${region.name}`,
        numberOfItems: topFacilities.length,
        itemListElement: topFacilities.map((f, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: f.name,
          url: `https://www.hraju.cz/sport/${sportSlug}/${f.slug}`,
        })),
      }
    : null;

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionLd) }}
      />
      {itemListLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd) }}
        />
      )}

      {/* Header */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Link
              href="/"
              className="font-extrabold text-zinc-900 hover:text-emerald-600"
            >
              hraju
              <span className="text-emerald-600">.cz</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <Link
              href={`/sport/${sportSlug}`}
              className="flex items-center gap-1 hover:text-zinc-900"
            >
              {sport.icon} {sport.nameCs}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <span className="font-medium text-zinc-900">{region.name}</span>
          </div>
        </div>
      </nav>

      {/* Region Hero */}
      <section
        className={`bg-gradient-to-br ${sport.lightBg} to-white border-b border-zinc-100`}
      >
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{sport.icon}</span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                {sport.nameCs} — {region.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                <span>
                  <span className="font-semibold text-zinc-700">
                    {totalFacilities}
                  </span>{" "}
                  {totalFacilities === 1 ? "sportoviště" : "sportovišť"} v{" "}
                  <span className="font-semibold text-zinc-700">
                    {cities.length}
                  </span>{" "}
                  {cities.length === 1 ? "městě" : "městech"}
                </span>
                {reviewStats.totalReviews > 0 && (
                  <>
                    <span className="text-zinc-300">|</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-zinc-700">
                        {reviewStats.averageRating}
                      </span>{" "}
                      z{" "}
                      <span className="font-semibold text-zinc-700">
                        {reviewStats.totalReviews}
                      </span>{" "}
                      recenzí
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      {mapMarkers.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-zinc-900">
            <MapIcon className="h-5 w-5 text-zinc-400" />
            Mapa — {sport.nameCs.toLowerCase()} v kraji {region.name}
          </h2>
          <FacilityMap
            markers={mapMarkers}
            className="h-[350px] w-full rounded-2xl border border-zinc-200 overflow-hidden"
          />
          <p className="mt-2 text-xs text-zinc-400">
            {mapMarkers.length}{" "}
            {mapMarkers.length === 1 ? "místo" : "míst"} na mapě
          </p>
        </section>
      )}

      {/* Cities Grid */}
      <section className="mx-auto max-w-6xl px-6 py-8 border-t border-zinc-100">
        <h2 className="mb-6 text-xl font-bold text-zinc-900">
          Vyberte město
        </h2>

        {cities.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-zinc-100 bg-white p-12 text-center">
            <span className="text-5xl">{sport.icon}</span>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900">
              V tomto kraji jsme nic nenašli
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Zkuste jiný kraj nebo se podívejte na všechna{" "}
              {sport.nameCs.toLowerCase()} sportoviště.
            </p>
            <Link
              href={`/sport/${sportSlug}`}
              className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${sport.accent} hover:underline`}
            >
              Zpět na přehled krajů
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map(({ city, citySlug, facilityCount }) => (
              <Link
                key={citySlug}
                href={`/sport/${sportSlug}/kraj/${regionSlug}/${citySlug}`}
                className="group flex items-center justify-between rounded-2xl border border-zinc-100 bg-white p-4 transition-all hover:border-zinc-200 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-800 group-hover:text-emerald-700">
                      {city}
                    </span>
                    <p className="text-xs text-zinc-500">
                      {facilityCount}{" "}
                      {facilityCount === 1 ? "sportoviště" : "sportovišť"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-300 transition group-hover:text-emerald-500" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Top Facilities */}
      {topFacilities.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8 border-t border-zinc-100">
          <h2 className="mb-6 text-xl font-bold text-zinc-900">
            {sport.nameCs} sportoviště — {region.name}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topFacilities.map((facility, i) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                sportSlug={sportSlug}
                priority={i < 3}
              />
            ))}
          </div>
        </section>
      )}

      {/* Banner + Ad: after facilities */}
      <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col items-center gap-4">
        <BannerSlot placement="listing_inline" sport={sportSlug} className="mx-auto" />
        <AdSlot slot="1234567896" format="horizontal" />
      </div>

      {/* Browse Other Regions for Same Sport */}
      <section className="mx-auto max-w-6xl px-6 py-8 border-t border-zinc-100">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          {sport.nameCs} v dalších krajích
        </h3>
        <div className="flex flex-wrap gap-2">
          {otherRegions.map((r) => (
            <Link
              key={r.slug}
              href={`/sport/${sportSlug}/kraj/${r.slug}`}
              className="rounded-lg border border-zinc-100 bg-white px-3 py-1.5 text-sm text-zinc-600 transition hover:border-zinc-200 hover:text-emerald-700 hover:shadow-sm"
            >
              {r.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Other Sports in This Region */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Další sporty v kraji {region.name}
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {SPORTS.filter((s) => s.slug !== sport.slug).map((s) => (
              <Link
                key={s.slug}
                href={`/sport/${s.slug}/kraj/${regionSlug}`}
                className={`flex items-center gap-2 rounded-full border border-zinc-100 ${s.lightBg} px-4 py-2 text-sm font-medium text-zinc-700 transition hover:shadow-sm`}
              >
                <span>{s.icon}</span>
                {s.nameCs}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

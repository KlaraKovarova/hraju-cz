import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, ChevronRight, Star, Trophy, ArrowLeft } from "lucide-react";
import { getSportBySlug, SPORTS } from "@/lib/sports";
import { getRegionBySlug } from "@/lib/regions";
import {
  getGuideFacilitiesByRegion,
  getGuideBestRatedFacilities,
  getGuideBeginnerFacilities,
  getGuideMapMarkers,
  type FacilityWithDetails,
} from "@/lib/data";
import { getSportFacilityTypePluralGenitive } from "@/lib/seo";
import { getGuideBySlug, getAllGuideSlugs } from "@/lib/guides";
import { FacilityCard } from "@/components/FacilityCard";
import { FacilityMap } from "@/components/FacilityMap";
import { AdSlot } from "@/components/AdSlot";
import type { Metadata } from "next";

export const revalidate = 3600;

export function generateStaticParams() {
  return getAllGuideSlugs().map(({ sport, slug }) => ({ sport, slug }));
}

interface GuidePageProps {
  params: Promise<{ sport: string; slug: string }>;
}

async function getGuideFacilities(
  sportSlug: string,
  guideType: string,
  regionSlug?: string
): Promise<FacilityWithDetails[]> {
  switch (guideType) {
    case "top-v-kraji":
      return regionSlug ? getGuideFacilitiesByRegion(sportSlug, regionSlug) : [];
    case "nejlepe-hodnocene":
      return getGuideBestRatedFacilities(sportSlug);
    case "pro-zacatecniky":
      return getGuideBeginnerFacilities(sportSlug);
    default:
      return [];
  }
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { sport: sportSlug, slug: guideSlug } = await params;
  const sport = getSportBySlug(sportSlug);
  const guide = sport ? getGuideBySlug(sportSlug, guideSlug) : undefined;
  if (!sport || !guide) return {};

  const facilities = await getGuideFacilities(sportSlug, guide.type, guide.regionSlug);
  const facilityType = getSportFacilityTypePluralGenitive(sportSlug);
  const title = guide.title(sport.nameCs);
  const description = guide.description(sport.nameCs, facilityType, facilities.length);
  const url = `https://www.hraju.cz/pruvodce/${sportSlug}/${guideSlug}`;

  return {
    title: `${title} | hraju.cz`,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "hraju.cz",
      locale: "cs_CZ",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `${title} — hraju.cz` }],
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: url },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { sport: sportSlug, slug: guideSlug } = await params;
  const sport = getSportBySlug(sportSlug);
  const guide = sport ? getGuideBySlug(sportSlug, guideSlug) : undefined;

  if (!sport || !guide) {
    notFound();
  }

  const facilities = await getGuideFacilities(sportSlug, guide.type, guide.regionSlug);
  const facilityType = getSportFacilityTypePluralGenitive(sportSlug);
  const mapMarkers = getGuideMapMarkers(facilities, sportSlug);

  const heading = guide.heading(sport.nameCs);
  const intro = guide.intro(sport.nameCs, facilityType, facilities.length);

  // Stats
  const withReviews = facilities.filter((f) => f.reviewCount > 0);
  const avgRating =
    withReviews.length > 0
      ? Math.round(
          (withReviews.reduce((sum, f) => sum + (f.averageRating ?? 0), 0) / withReviews.length) * 10
        ) / 10
      : null;
  const totalReviews = facilities.reduce((sum, f) => sum + f.reviewCount, 0);

  // Region info (for breadcrumb)
  const region = guide.regionSlug ? getRegionBySlug(guide.regionSlug) : null;

  // BreadcrumbList JSON-LD
  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Domů", item: "https://www.hraju.cz" },
    { "@type": "ListItem", position: 2, name: sport.nameCs, item: `https://www.hraju.cz/sport/${sportSlug}` },
    { "@type": "ListItem", position: 3, name: "Průvodce", item: `https://www.hraju.cz/pruvodce/${sportSlug}` },
    { "@type": "ListItem", position: 4, name: heading },
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  // ItemList JSON-LD
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: heading,
    description: intro,
    numberOfItems: facilities.length,
    itemListElement: facilities.slice(0, 20).map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: f.name,
      url: `https://www.hraju.cz/sport/${sportSlug}/${f.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-700">
            Domů
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/sport/${sportSlug}`} className="hover:text-zinc-700">
            {sport.nameCs}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/pruvodce/${sportSlug}`} className="hover:text-zinc-700">
            Průvodce
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-zinc-900 font-medium truncate">{heading}</span>
        </nav>

        {/* Hero */}
        <div className={`rounded-2xl bg-gradient-to-br ${sport.gradient} p-8 text-white mb-8`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{sport.icon}</span>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{heading}</h1>
              <p className="mt-1 text-white/80 text-sm sm:text-base">{intro}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2">
              <MapPin className="h-4 w-4" />
              <span className="font-semibold">{facilities.length}</span> sportovišť
            </div>
            {avgRating && (
              <div className="flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2">
                <Star className="h-4 w-4" />
                <span className="font-semibold">{avgRating}</span> průměrné hodnocení
              </div>
            )}
            {totalReviews > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2">
                <Trophy className="h-4 w-4" />
                <span className="font-semibold">{totalReviews}</span> recenzí
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        {mapMarkers.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-zinc-900">Mapa sportovišť</h2>
            <FacilityMap markers={mapMarkers} className="h-[400px] rounded-xl" />
          </section>
        )}

        {/* Facility listing */}
        <section>
          <h2 className="mb-6 text-lg font-bold text-zinc-900">
            {facilities.length > 0
              ? `${facilities.length} sportovišť v průvodci`
              : "V tomto průvodci zatím nejsou žádná sportoviště"}
          </h2>

          {facilities.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.map((facility, i) => (
                <div key={facility.id}>
                  {/* Ad after every 6th card */}
                  {i > 0 && i % 6 === 0 && (
                    <div className="col-span-full mb-6">
                      <AdSlot slot="guide-inline" />
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <FacilityCard facility={facility} sportSlug={sportSlug} priority={i < 3} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500">
              Pro tento průvodce nemáme dostatek dat. Pomozte nám —{" "}
              <Link href={`/sport/${sportSlug}`} className="text-emerald-600 hover:underline">
                přidejte recenzi
              </Link>{" "}
              nebo{" "}
              <Link href="/pridat-sportoviste" className="text-emerald-600 hover:underline">
                přidejte sportoviště
              </Link>
              .
            </p>
          )}
        </section>

        {/* Cross-links to other guides */}
        <section className="mt-12 border-t border-zinc-100 pt-8">
          <h2 className="mb-4 text-lg font-bold text-zinc-900">Další průvodce — {sport.nameCs}</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/pruvodce/${sportSlug}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Všechny průvodce
            </Link>
            <Link
              href={`/sport/${sportSlug}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
            >
              Přehled {sport.nameCs.toLowerCase()}
            </Link>
            {region && (
              <Link
                href={`/sport/${sportSlug}/kraj/${region.slug}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
              >
                {region.name}
              </Link>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

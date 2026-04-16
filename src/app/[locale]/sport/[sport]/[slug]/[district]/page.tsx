import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { getSportBySlug } from "@/lib/sports";
import { getFacilitiesByCityAndSport } from "@/lib/data";
import { getSportFacilityTypePluralGenitive, safeJsonLd } from "@/lib/seo";
import { FacilityListWithFilters } from "@/components/FacilityListWithFilters";
import { FacilityMap } from "@/components/FacilityMap";
import type { Metadata } from "next";

// ISR: revalidate district pages every 24 hours (optimization)
export const revalidate = 86400;

interface DistrictPageProps {
  params: Promise<{ sport: string; slug: string; district: string }>;
}

/** Validate that slug is "praha" and district matches "praha-N" */
function parseDistrictName(districtSlug: string): string | null {
  const match = districtSlug.match(/^praha-(\d+)$/);
  if (!match) return null;
  return `Praha ${match[1]}`;
}

export async function generateMetadata({
  params,
}: DistrictPageProps): Promise<Metadata> {
  const { sport: sportSlug, slug, district: districtSlug } = await params;
  if (slug !== "praha") return {};

  const sport = getSportBySlug(sportSlug);
  const districtName = parseDistrictName(districtSlug);
  if (!sport || !districtName) return {};

  const { facilities } = await getFacilitiesByCityAndSport(
    districtSlug,
    sport.slug,
  );
  if (facilities.length === 0) return {};

  const title = `${sport.nameCs} ${districtName} — ${facilities.length} sportovišť`;
  const description = `Najděte ${facilities.length} ${getSportFacilityTypePluralGenitive(sport.slug)} v ${districtName}. Adresy, kontakty, otevírací doby a recenze.`;
  const url = `https://www.hraju.cz/sport/${sportSlug}/praha/${districtSlug}`;

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
          alt: `${sport.nameCs} ${districtName} — hraju.cz`,
        },
      ],
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: url },
  };
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const { sport: sportSlug, slug, district: districtSlug } = await params;

  // Only support Praha districts for now
  if (slug !== "praha") {
    notFound();
  }

  const sport = getSportBySlug(sportSlug);
  if (!sport) {
    notFound();
  }

  const districtName = parseDistrictName(districtSlug);
  if (!districtName) {
    notFound();
  }

  const { facilities } = await getFacilitiesByCityAndSport(
    districtSlug,
    sport.slug,
  );

  // Empty districts → 404
  if (facilities.length === 0) {
    notFound();
  }

  // Get all Praha districts for sibling navigation
  const { districts: allDistricts } = await getFacilitiesByCityAndSport(
    "praha",
    sport.slug,
  );

  const mapMarkers = facilities
    .filter((f) => f.lat && f.lng)
    .map((f) => ({
      lat: f.lat!,
      lng: f.lng!,
      name: f.name,
      address: f.address,
      url: `/sport/${sportSlug}/${f.slug}`,
    }));

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
        name: "Praha",
        item: `https://www.hraju.cz/sport/${sportSlug}/praha`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: districtName,
        item: `https://www.hraju.cz/sport/${sportSlug}/praha/${districtSlug}`,
      },
    ],
  };

  // ItemList JSON-LD
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${sport.nameCs} ${districtName}`,
    numberOfItems: facilities.length,
    itemListElement: facilities.map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: f.name,
      url: `https://www.hraju.cz/sport/${sportSlug}/${f.slug}`,
    })),
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd) }}
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
            <Link
              href={`/sport/${sportSlug}`}
              className="flex items-center gap-1 hover:text-zinc-900"
            >
              {sport.icon} {sport.nameCs}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <Link
              href={`/sport/${sportSlug}/praha`}
              className="hover:text-zinc-900"
            >
              Praha
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <span className="font-medium text-zinc-900">{districtName}</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        className={`bg-gradient-to-br ${sport.lightBg} to-white border-b border-zinc-100`}
      >
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{sport.icon}</span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                {sport.nameCs} v {districtName}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-zinc-500">
                <MapPin className="h-4 w-4" />
                {facilities.length} sportovišť
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      {mapMarkers.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-8">
          <FacilityMap markers={mapMarkers} />
        </section>
      )}

      {/* Facilities */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-zinc-100" />)}</div>}>
          <FacilityListWithFilters
            facilities={facilities}
            sportSlug={sportSlug}
          />
        </Suspense>
      </section>

      {/* Sibling Districts */}
      {allDistricts && allDistricts.length > 1 && (
        <section className="border-t border-zinc-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-zinc-400">
              {sport.nameCs} v dalších městských částech
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {allDistricts.map((d) => {
                const isActive = d.districtSlug === districtSlug;
                return (
                  <Link
                    key={d.districtSlug}
                    href={`/sport/${sportSlug}/praha/${d.districtSlug}`}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      isActive
                        ? `${sport.borderColor} ${sport.lightBg} font-semibold ${sport.accent}`
                        : "border-zinc-100 bg-zinc-50 text-zinc-600 hover:border-zinc-200 hover:shadow-sm"
                    }`}
                  >
                    {d.district}{" "}
                    <span className="text-xs text-zinc-400">
                      ({d.facilities.length})
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <Link
                href={`/sport/${sportSlug}/praha`}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Všechny sportoviště v Praze &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

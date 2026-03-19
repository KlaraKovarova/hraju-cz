import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { SPORTS } from "@/lib/sports";
import { getSportFacilityTypePlural } from "@/lib/seo";
import { getCityInPhrase } from "@/lib/locative";
import { FacilityCard } from "@/components/FacilityCard";
import { FacilityMap } from "@/components/FacilityMap";
import type { FacilityWithDetails, DistrictGroup } from "@/lib/data";

type Sport = (typeof SPORTS)[number];

interface CityLandingContentProps {
  sport: Sport;
  sportSlug: string;
  cityName: string;
  citySlug: string;
  facilities: FacilityWithDetails[];
  districts?: DistrictGroup[];
}

export function CityLandingContent({
  sport,
  sportSlug,
  cityName,
  citySlug,
  facilities,
  districts,
}: CityLandingContentProps) {
  const mapMarkers = facilities
    .filter((f) => f.lat && f.lng)
    .map((f) => ({
      lat: f.lat!,
      lng: f.lng!,
      name: f.name,
      address: f.address,
      url: `/sport/${sportSlug}/${f.slug}`,
    }));

  // JSON-LD ItemList
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${sport.nameCs} ${cityName}`,
    numberOfItems: facilities.length,
    itemListElement: facilities.map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: f.name,
      url: `https://hraju.cz/sport/${sportSlug}/${f.slug}`,
    })),
  };

  // BreadcrumbList JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hraju.cz", item: "https://hraju.cz" },
      { "@type": "ListItem", position: 2, name: sport.nameCs, item: `https://hraju.cz/sport/${sportSlug}` },
      { "@type": "ListItem", position: 3, name: cityName, item: `https://hraju.cz/sport/${sportSlug}/${citySlug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
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
            <Link
              href={`/sport/${sportSlug}`}
              className="flex items-center gap-1 hover:text-zinc-900"
            >
              {sport.icon} {sport.nameCs}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <span className="font-medium text-zinc-900">{cityName}</span>
          </div>
        </div>
      </nav>

      {/* City Hero */}
      <section
        className={`bg-gradient-to-br ${sport.lightBg} to-white border-b border-zinc-100`}
      >
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{sport.icon}</span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                {districts ? (
                  <>
                    {getSportFacilityTypePlural(sportSlug).charAt(0).toUpperCase()
                      + getSportFacilityTypePlural(sportSlug).slice(1)}{" "}
                    v Praze
                  </>
                ) : (
                  <>{sport.nameCs} — {cityName}</>
                )}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-zinc-500">
                <MapPin className="h-4 w-4" />
                {facilities.length} sportovišť
                {districts && ` v ${districts.length} městských částech`}
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

      {/* Facility Cards */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4">
          <p className="text-sm text-zinc-500">
            {facilities.length} sportovišť ve městě {cityName}
          </p>
        </div>

        {districts && districts.length > 0 ? (
          <div className="space-y-8">
            {districts.map((group) => (
              <div key={group.district}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-zinc-900">
                    {group.district}{" "}
                    <span className="text-sm font-normal text-zinc-400">
                      ({group.facilities.length})
                    </span>
                  </h2>
                  <Link
                    href={`/sport/${sportSlug}/${group.districtSlug}`}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Zobrazit {group.district} &rarr;
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.facilities.map((facility) => (
                    <FacilityCard
                      key={facility.id}
                      facility={facility}
                      sportSlug={sportSlug}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                sportSlug={sportSlug}
              />
            ))}
          </div>
        )}
      </section>

      {/* Other Sports in this City */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Další sporty {getCityInPhrase(cityName)}
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {SPORTS.filter((s) => s.slug !== sport.slug).map((s) => (
              <Link
                key={s.slug}
                href={`/sport/${s.slug}/${citySlug}`}
                className={`flex items-center gap-2 rounded-full border border-zinc-100 ${s.lightBg} px-4 py-2 text-sm font-medium text-zinc-700 transition hover:shadow-sm`}
              >
                <span>{s.icon}</span>
                {s.nameCs}
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href={`/mesto/${citySlug}`}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Všechny sporty {getCityInPhrase(cityName)} &rarr;
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

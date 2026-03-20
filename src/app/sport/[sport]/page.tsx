import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { getSportBySlug, SPORTS } from "@/lib/sports";
import { getRegionsBySport, getTopFacilitiesBySport, getTopCitiesBySport } from "@/lib/data";
import { getSportTitleSuffix, getSportFacilityTypePluralGenitive, getSportFacilityType } from "@/lib/seo";
import { FacilityCard } from "@/components/FacilityCard";
import { HeroSearchForm } from "@/components/HeroSearchForm";
import { AdSlot } from "@/components/AdSlot";
import type { Metadata } from "next";

interface SportPageProps {
  params: Promise<{ sport: string }>;
}

export async function generateMetadata({
  params,
}: SportPageProps): Promise<Metadata> {
  const { sport: sportSlug } = await params;
  const sport = getSportBySlug(sportSlug);
  if (!sport) return {};

  const regions = await getRegionsBySport(sport.slug);
  const totalFacilities = regions.reduce((sum, r) => sum + r.facilityCount, 0);

  const title = `${sport.nameCs} — ${getSportTitleSuffix(sport.slug)}`;
  const description = `${totalFacilities} ${getSportFacilityTypePluralGenitive(sport.slug)} ve všech 14 krajích. Najdi ${getSportFacilityType(sport.slug)} ve svém městě — adresy, kontakty, otevírací doby.`;
  const url = `https://hraju.cz/sport/${sportSlug}`;

  return {
    title,
    description,
    openGraph: { title, description, url, type: "website", images: ["/og-image.jpg"] },
    alternates: { canonical: url },
  };
}

export default async function SportPage({ params }: SportPageProps) {
  const { sport: sportSlug } = await params;
  const sport = getSportBySlug(sportSlug);

  if (!sport) {
    notFound();
  }

  const regions = await getRegionsBySport(sport.slug);
  const topFacilities = await getTopFacilitiesBySport(sport.slug, 10);
  const topCities = await getTopCitiesBySport(sport.slug, 10);
  const totalFacilities = regions.reduce((sum, r) => sum + r.facilityCount, 0);

  // JSON-LD ItemList for top facilities
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: sport.nameCs,
    numberOfItems: topFacilities.length,
    itemListElement: topFacilities.map((f, i) => ({
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
              {sport.icon} {sport.nameCs}
            </span>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
          >
            Všechny sporty
          </Link>
        </div>
      </nav>

      {/* Sport Hero */}
      <section
        className={`bg-gradient-to-br ${sport.lightBg} to-white border-b border-zinc-100`}
      >
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{sport.icon}</span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                {sport.nameCs}
              </h1>
              <p className="mt-1 text-zinc-500">
                {sport.description}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            Celkem <span className="font-semibold text-zinc-700">{totalFacilities}</span> sportovišť
            {" "}v <span className="font-semibold text-zinc-700">{regions.length}</span> krajích
          </p>
          <HeroSearchForm sportSlug={sport.slug} />
        </div>
      </section>

      {/* Regions Grid */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="mb-6 text-xl font-bold text-zinc-900">
          Vyberte kraj
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {regions.map(({ region, facilityCount, cities }) => (
            <Link
              key={region.slug}
              href={`/sport/${sportSlug}/kraj/${region.slug}`}
              className="group flex items-center justify-between rounded-2xl border border-zinc-100 bg-white p-5 transition-all hover:border-zinc-200 hover:shadow-lg hover:shadow-zinc-100"
            >
              <div className="min-w-0">
                <h3 className="text-base font-bold text-zinc-900 group-hover:text-emerald-700">
                  {region.name}
                </h3>
                <div className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <span>
                    {facilityCount} {facilityCount === 1 ? "sportoviště" : "sportovišť"}
                    {" "}v {cities.length} {cities.length === 1 ? "městě" : "městech"}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 transition group-hover:text-emerald-500" />
            </Link>
          ))}
        </div>
      </section>

      {/* Top Cities */}
      {topCities.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8 border-t border-zinc-100">
          <h2 className="mb-6 text-xl font-bold text-zinc-900">
            Nejoblíbenější města
          </h2>

          <div className="flex flex-wrap gap-3">
            {topCities.map(({ city, citySlug, facilityCount }) => (
              <Link
                key={citySlug}
                href={`/sport/${sportSlug}/${citySlug}`}
                className="group flex items-center gap-2 rounded-xl border border-zinc-100 bg-white px-4 py-3 transition-all hover:border-zinc-200 hover:shadow-lg hover:shadow-zinc-100"
              >
                <MapPin className="h-4 w-4 text-zinc-400 group-hover:text-emerald-500" />
                <span className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">
                  {city}
                </span>
                <span className="text-xs text-zinc-400">
                  {facilityCount}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top Facilities */}
      {topFacilities.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8 border-t border-zinc-100">
          <h2 className="mb-6 text-xl font-bold text-zinc-900">
            {sport.nameCs} sportoviště
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topFacilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                sportSlug={sportSlug}
              />
            ))}
          </div>
        </section>
      )}

      {/* Ad: after facility cards */}
      <div className="mx-auto max-w-6xl px-6 py-4">
        <AdSlot slot="1234567891" format="horizontal" />
      </div>

      {/* Other Sports */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Další sporty na hraju.cz
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {SPORTS.filter((s) => s.slug !== sport.slug).map((s) => (
              <Link
                key={s.slug}
                href={`/sport/${s.slug}`}
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

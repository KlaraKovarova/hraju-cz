import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { getSportBySlug, SPORTS } from "@/lib/sports";
import { getRegionBySlug } from "@/lib/regions";
import { getCitiesByRegionAndSport, getTopFacilitiesByRegionAndSport } from "@/lib/data";
import { getSportFacilityTypePluralGenitive, getSportFacilityTypeInstrumental } from "@/lib/seo";
import { FacilityCard } from "@/components/FacilityCard";
import type { Metadata } from "next";

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

  const title = `${sport.nameCs} v kraji ${region.name}`;
  const description = `${totalFacilities} ${getSportFacilityTypePluralGenitive(sport.slug)} v kraji ${region.name}. Přehled měst s ${getSportFacilityTypeInstrumental(sport.slug)} — vyberte město a najděte sportoviště s kontakty.`;
  const url = `https://hraju.cz/sport/${sportSlug}/kraj/${regionSlug}`;

  return {
    title,
    description,
    openGraph: { title, description, url, type: "website", siteName: "hraju.cz", locale: "cs_CZ", images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `${sport.nameCs} v kraji ${region.name} — hraju.cz` }] },
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

  const cities = await getCitiesByRegionAndSport(regionSlug, sport.slug);
  const topFacilities = await getTopFacilitiesByRegionAndSport(regionSlug, sport.slug, 10);
  const totalFacilities = cities.reduce((sum, c) => sum + c.facilityCount, 0);

  return (
    <main className="min-h-screen bg-zinc-50/50">
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
            <span className="font-medium text-zinc-900">
              {region.name}
            </span>
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
              <p className="mt-1 text-zinc-500">
                {totalFacilities} {totalFacilities === 1 ? "sportoviště" : "sportovišť"}
                {" "}v {cities.length} {cities.length === 1 ? "městě" : "městech"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cities Grid */}
      <section className="mx-auto max-w-6xl px-6 py-8">
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
              Zkuste jiný kraj nebo se podívejte na všechna {sport.nameCs.toLowerCase()} sportoviště.
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
                      {facilityCount} {facilityCount === 1 ? "sportoviště" : "sportovišť"}
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

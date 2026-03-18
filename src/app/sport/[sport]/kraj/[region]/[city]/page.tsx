import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { getSportBySlug, SPORTS } from "@/lib/sports";
import { getRegionBySlug } from "@/lib/regions";
import { getFacilitiesByRegionCityAndSport } from "@/lib/data";
import { getSportFacilityTypePlural, getSportFacilityTypePluralGenitive } from "@/lib/seo";
import { FacilityCard } from "@/components/FacilityCard";
import type { Metadata } from "next";

interface CityPageProps {
  params: Promise<{ sport: string; region: string; city: string }>;
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { sport: sportSlug, region: regionSlug, city: citySlug } = await params;
  const sport = getSportBySlug(sportSlug);
  const region = getRegionBySlug(regionSlug);
  if (!sport || !region) return {};

  const { facilities, cityName } = await getFacilitiesByRegionCityAndSport(
    regionSlug,
    citySlug,
    sport.slug
  );
  if (!cityName) return {};

  const title = `${sport.nameCs} ${cityName} — ${getSportFacilityTypePlural(sport.slug)}`;
  const description = `${facilities.length} ${getSportFacilityTypePluralGenitive(sport.slug)} ve městě ${cityName}. Adresy, telefonní čísla, otevírací doby a další informace na jednom místě.`;
  const url = `https://hraju.cz/sport/${sportSlug}/kraj/${regionSlug}/${citySlug}`;

  return {
    title,
    description,
    openGraph: { title, description, url, type: "website" },
    alternates: { canonical: url },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { sport: sportSlug, region: regionSlug, city: citySlug } = await params;
  const sport = getSportBySlug(sportSlug);
  const region = getRegionBySlug(regionSlug);

  if (!sport || !region) {
    notFound();
  }

  const { facilities, cityName } = await getFacilitiesByRegionCityAndSport(
    regionSlug,
    citySlug,
    sport.slug
  );

  if (!cityName) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-50/50">
      {/* Header */}
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
              href={`/sport/${sportSlug}/kraj/${regionSlug}`}
              className="hover:text-zinc-900"
            >
              {region.name}
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
                {sport.nameCs} — {cityName}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-zinc-500">
                <MapPin className="h-4 w-4" />
                {region.name}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {facilities.length > 0
              ? `${facilities.length} sportovišť ve městě ${cityName}`
              : "Žádná sportoviště nenalezena"}
          </p>
        </div>

        {facilities.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-zinc-100 bg-white p-12 text-center">
            <span className="text-5xl">{sport.icon}</span>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900">
              Ve městě &quot;{cityName}&quot; jsme nic nenašli
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Zkuste jiné město v kraji {region.name}.
            </p>
            <Link
              href={`/sport/${sportSlug}/kraj/${regionSlug}`}
              className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${sport.accent} hover:underline`}
            >
              Zpět na {region.name}
            </Link>
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
                href={`/sport/${s.slug}/kraj/${regionSlug}/${citySlug}`}
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

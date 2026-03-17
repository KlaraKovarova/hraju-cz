import { notFound } from "next/navigation";
import Link from "next/link";
import { getSportBySubdomain } from "@/lib/sports";
import { getFacilitiesBySport } from "@/lib/data";
import { FacilityCard } from "@/components/FacilityCard";
import { SearchBar } from "@/components/SearchBar";
import type { Metadata } from "next";

interface SportPageProps {
  params: Promise<{ sport: string }>;
  searchParams: Promise<{ city?: string }>;
}

export async function generateMetadata({
  params,
}: SportPageProps): Promise<Metadata> {
  const { sport: sportSlug } = await params;
  const sport = getSportBySubdomain(sportSlug);
  if (!sport) return {};
  return {
    title: `${sport.nameCs} sportoviště | hraju.cz`,
    description: sport.description,
  };
}

export default async function SportPage({ params, searchParams }: SportPageProps) {
  const { sport: sportSlug } = await params;
  const { city } = await searchParams;
  const sport = getSportBySubdomain(sportSlug);

  if (!sport) {
    notFound();
  }

  const { facilities, isLive } = await getFacilitiesBySport(sport.slug, city);

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-zinc-100 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{sport.icon}</span>
            <div>
              <Link href="/" className="text-xl font-bold text-zinc-900 hover:text-zinc-600">
                {sport.nameCs}.hraju.cz
              </Link>
              <p className="text-sm text-zinc-500">{sport.description}</p>
            </div>
          </div>
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600">
            ← Všechny sporty
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6">
          <h2 className="mb-1 text-2xl font-bold text-zinc-900">
            {sport.nameCs}ová sportoviště v ČR
          </h2>
          <p className="text-sm text-zinc-500">
            {facilities.length > 0
              ? `${facilities.length} sportovišť`
              : "Žádná sportoviště nenalezena"}
            {city ? ` ve městě ${city}` : ""}
            {!isLive && (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                ukázková data
              </span>
            )}
          </p>
        </div>

        <SearchBar currentCity={city} sportSlug={sportSlug} />

        {facilities.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-zinc-500">
              {city
                ? `Ve městě „${city}" jsme nenašli žádné ${sport.nameCs.toLowerCase()}ové sportoviště.`
                : `Zatím nejsou přidána žádná ${sport.nameCs.toLowerCase()}ová sportoviště.`}
            </p>
            {city && (
              <Link
                href={`/sport/${sportSlug}`}
                className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
              >
                Zobrazit všechna sportoviště
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
    </main>
  );
}

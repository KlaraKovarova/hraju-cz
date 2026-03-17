import { notFound } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { getSportBySubdomain, SPORTS } from "@/lib/sports";
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

export default async function SportPage({
  params,
  searchParams,
}: SportPageProps) {
  const { sport: sportSlug } = await params;
  const { city } = await searchParams;
  const sport = getSportBySubdomain(sportSlug);

  if (!sport) {
    notFound();
  }

  const { facilities, isLive } = await getFacilitiesBySport(sport.slug, city);

  return (
    <main className="min-h-screen bg-zinc-50/50">
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
                {!isLive && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    ukázková data
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mt-6">
            <SearchBar currentCity={city} sportSlug={sportSlug} />
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {facilities.length > 0
              ? `${facilities.length} sportovišť`
              : "Žádná sportoviště nenalezena"}
            {city ? ` ve městě ${city}` : ""}
          </p>
        </div>

        {facilities.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-zinc-100 bg-white p-12 text-center">
            <span className="text-5xl">{sport.icon}</span>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900">
              {city
                ? `Ve městě "${city}" jsme nic nenašli`
                : "Zatím žádná sportoviště"}
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              {city
                ? `Zkuste hledat v jiném městě nebo se podívejte na všechna ${sport.nameCs.toLowerCase()}ová sportoviště.`
                : `Zatím nejsou přidána žádná ${sport.nameCs.toLowerCase()}ová sportoviště.`}
            </p>
            {city && (
              <Link
                href={`/sport/${sportSlug}`}
                className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${sport.accent} hover:underline`}
              >
                Zobrazit všechna sportoviště
              </Link>
            )}
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

      {/* Map Overview */}
      {facilities.length > 0 && (
        <section className="border-t border-zinc-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
              <MapPin className="h-5 w-5 text-emerald-500" />
              Mapa sportovišť
            </h2>
            <div className="overflow-hidden rounded-2xl border border-zinc-100">
              <div className="relative h-[280px] w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: `
                    linear-gradient(rgba(16,185,129,0.15) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(16,185,129,0.15) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px',
                }} />
                {/* Road-like lines */}
                <div className="absolute left-0 right-0 top-[45%] h-px bg-emerald-200/60" />
                <div className="absolute left-0 right-0 top-[70%] h-px bg-emerald-200/40" />
                <div className="absolute bottom-0 left-[30%] top-0 w-px bg-emerald-200/60" />
                <div className="absolute bottom-0 left-[60%] top-0 w-px bg-emerald-200/40" />
                <div className="absolute bottom-0 left-[85%] top-0 w-px bg-emerald-200/30" />

                {/* Facility pins - spread across the map */}
                {facilities.slice(0, 8).map((f, i) => {
                  // Deterministic positioning based on index
                  const positions = [
                    { left: '20%', top: '30%' },
                    { left: '55%', top: '25%' },
                    { left: '75%', top: '45%' },
                    { left: '35%', top: '55%' },
                    { left: '60%', top: '65%' },
                    { left: '15%', top: '60%' },
                    { left: '45%', top: '40%' },
                    { left: '80%', top: '20%' },
                  ];
                  const pos = positions[i];
                  return (
                    <Link
                      key={f.id}
                      href={`/sport/${sportSlug}/${f.slug}`}
                      className="group absolute -translate-x-1/2 -translate-y-full"
                      style={{ left: pos.left, top: pos.top }}
                      title={f.name}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition group-hover:scale-125 group-hover:bg-emerald-700">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                    </Link>
                  );
                })}

                {/* Bottom overlay with count */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/90 to-transparent px-5 pb-4 pt-10">
                  <p className="text-sm text-zinc-600">
                    <span className="font-semibold text-zinc-900">{facilities.length}</span>{" "}
                    {facilities.length === 1 ? "sportoviště" : "sportovišť"}
                    {city && <> ve městě <span className="font-semibold">{city}</span></>}
                    {" "}— interaktivní mapa bude brzy k dispozici
                  </p>
                </div>
              </div>
            </div>
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

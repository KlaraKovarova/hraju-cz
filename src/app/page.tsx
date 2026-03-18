import Link from "next/link";
import { MapPin, Search, ArrowRight } from "lucide-react";
import { SPORTS } from "@/lib/sports";
import { getCities } from "@/lib/data";
import { cityToSlug } from "@/lib/regions";

const POPULAR_CITIES: { name: string; regionSlug: string; isRegionLink?: boolean }[] = [
  { name: "Praha", regionSlug: "hlavni-mesto-praha", isRegionLink: true },
  { name: "Brno", regionSlug: "jihomoravsky-kraj" },
  { name: "Ostrava", regionSlug: "moravskoslezsky-kraj" },
  { name: "Plzeň", regionSlug: "plzensky-kraj" },
  { name: "Olomouc", regionSlug: "olomoucky-kraj" },
  { name: "Liberec", regionSlug: "liberecky-kraj" },
  { name: "České Budějovice", regionSlug: "jihocesky-kraj" },
  { name: "Hradec Králové", regionSlug: "kralovehradecky-kraj" },
];

export default async function Home() {
  const cities = await getCities();
  const displayCities =
    cities.length > 0
      ? POPULAR_CITIES.filter((pc) => pc.isRegionLink || cities.includes(pc.name))
      : POPULAR_CITIES;

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-zinc-900">
              hraju
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                .cz
              </span>
            </span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-zinc-500 sm:flex">
            {SPORTS.slice(0, 3).map((sport) => (
              <Link
                key={sport.slug}
                href={`/sport/${sport.slug}`}
                className="transition hover:text-zinc-900"
              >
                {sport.icon} {sport.nameCs}
              </Link>
            ))}
            <Link
              href="#sports"
              className="transition hover:text-zinc-900"
            >
              Více sportů
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMGI5ODEiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              Kam dnes{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                půjdeš hrát?
              </span>
            </h1>
            <p className="mt-4 text-lg text-zinc-600 sm:text-xl">
              Najdi sportoviště poblíž tebe. Tenisové kurty, squash, badminton,
              volejbal i bazény po celé České republice.
            </p>

            {/* Search Box */}
            <div className="mt-8 flex max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg shadow-emerald-100/50">
              <div className="flex flex-1 items-center gap-2 px-4">
                <Search className="h-5 w-5 shrink-0 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Město nebo název sportoviště..."
                  className="w-full py-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                  readOnly
                />
              </div>
              <button className="m-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700">
                Hledat
              </button>
            </div>

            {/* Quick city links */}
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-zinc-400">Oblíbená města:</span>
              {displayCities.slice(0, 5).map((pc) => (
                <Link
                  key={pc.name}
                  href={pc.isRegionLink ? `/sport/tenis/kraj/${pc.regionSlug}` : `/sport/tenis/kraj/${pc.regionSlug}/${cityToSlug(pc.name)}`}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-zinc-600 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  {pc.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sports Grid */}
      <section id="sports" className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Vyber si svůj sport
          </h2>
          <p className="mt-2 text-zinc-500">
            Klikni na sport a najdi sportoviště ve svém okolí
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {SPORTS.map((sport) => (
            <Link
              key={sport.slug}
              href={`/sport/${sport.slug}`}
              className={`group relative flex flex-col items-center gap-4 rounded-3xl border-2 border-transparent ${sport.lightBg} p-8 text-center transition-all hover:border-current hover:shadow-lg hover:shadow-${sport.color}-100/50 hover:scale-[1.02]`}
            >
              <span className="text-5xl transition-transform group-hover:scale-110">
                {sport.icon}
              </span>
              <div>
                <span className="text-base font-bold text-zinc-800">
                  {sport.nameCs}
                </span>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {sport.description.replace(" v České republice", "")}
                </p>
              </div>
              <span
                className={`${sport.accent} flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100`}
              >
                Zobrazit <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Cities */}
      <section className="border-t border-zinc-100 bg-zinc-50/50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Sportoviště ve městech
            </h2>
            <p className="mt-2 text-zinc-500">
              Prohlédni si nabídku sportovišť v největších městech ČR
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {displayCities.map((pc) => (
              <Link
                key={pc.name}
                href={pc.isRegionLink ? `/sport/tenis/kraj/${pc.regionSlug}` : `/sport/tenis/kraj/${pc.regionSlug}/${cityToSlug(pc.name)}`}
                className="group flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 transition hover:border-emerald-200 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="font-medium text-zinc-700 group-hover:text-zinc-900">
                  {pc.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Info Section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-10 text-center text-white sm:p-14">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Provozujete sportoviště?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-emerald-100">
            Zaregistrujte svůj areál zdarma a oslovte tisíce sportovců hledajících
            místo, kde si zahrají.
          </p>
          <button className="mt-6 rounded-xl bg-white px-8 py-3 text-sm font-bold text-emerald-700 shadow-lg transition hover:shadow-xl">
            Zaregistrovat sportoviště
          </button>
        </div>
      </section>

    </main>
  );
}

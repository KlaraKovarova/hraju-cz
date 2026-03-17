import Link from "next/link";
import { SPORTS } from "@/lib/sports";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-zinc-100 px-6 py-4">
        <h1 className="text-2xl font-bold text-zinc-900">hraju.cz</h1>
        <p className="text-sm text-zinc-500">Sportoviště v České republice</p>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900">
          Najdi sportoviště poblíž
        </h2>
        <p className="mb-10 text-zinc-500">
          Vyberte sport a najděte nejbližší kurty, hřiště nebo bazény.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {SPORTS.map((sport) => (
            <Link
              key={sport.slug}
              href={`http://${sport.subdomain}.hraju.cz`}
              className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-6 text-center transition hover:border-zinc-300 hover:bg-white hover:shadow-sm"
            >
              <span className="text-4xl">{sport.icon}</span>
              <span className="text-sm font-semibold text-zinc-800">
                {sport.nameCs}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

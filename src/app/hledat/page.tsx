import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { searchFacilities } from "@/lib/data";
import { getSportBySlug, SPORTS } from "@/lib/sports";
import { SearchResults } from "@/components/SearchResults";
import { AdSlot } from "@/components/AdSlot";
import { TrackPageView } from "@/components/TrackPageView";
import type { Metadata } from "next";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; sport?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const title = q ? `Hledání: ${q}` : "Hledání sportovišť";

  return {
    title,
    robots: { index: false, follow: true },
    alternates: {
      canonical: q
        ? `https://hraju.cz/hledat?q=${encodeURIComponent(q)}`
        : "https://hraju.cz/hledat",
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, sport: sportSlug } = await searchParams;
  const query = q?.trim() ?? "";
  const sport = sportSlug ? getSportBySlug(sportSlug) : null;

  const facilities = query.length >= 2
    ? await searchFacilities(query, sportSlug, 200)
    : [];

  return (
    <main className="min-h-screen bg-zinc-50/50">
      {query.length >= 2 && (
        <TrackPageView
          eventName="search"
          params={{ query, resultCount: facilities.length }}
        />
      )}
      {/* Header */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-zinc-900"
          >
            hraju
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              .cz
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
          >
            Domů
          </Link>
        </div>
      </nav>

      {/* Breadcrumbs */}
      <div className="mx-auto max-w-6xl px-6 py-4">
        <nav className="flex items-center gap-1.5 text-sm text-zinc-400">
          <Link href="/" className="hover:text-zinc-600">
            Domů
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-zinc-600">Hledání</span>
        </nav>
      </div>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        {query.length >= 2 ? (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
              Výsledky hledání: &ldquo;{query}&rdquo;
            </h1>
            {sport && (
              <p className="mt-1 text-sm text-zinc-500">
                Filtrováno: {sport.icon} {sport.nameCs}
              </p>
            )}
            <p className="mt-2 text-zinc-500">
              Nalezeno {facilities.length}{" "}
              {facilities.length === 1 ? "sportoviště" : "sportovišť"}
            </p>

            {facilities.length > 0 ? (
              <div className="mt-8">
                <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-zinc-100" />)}</div>}>
                  <SearchResults facilities={facilities} />
                </Suspense>
                {facilities.length > 6 && (
                  <div className="mt-6">
                    <AdSlot slot="1234567894" format="horizontal" />
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-12 rounded-2xl border border-zinc-100 bg-white p-10 text-center">
                <Search className="mx-auto h-10 w-10 text-zinc-300" />
                <h2 className="mt-4 text-lg font-bold text-zinc-700">
                  Žádné výsledky pro &ldquo;{query}&rdquo;
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Zkuste jiný výraz nebo procházejte sporty.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {SPORTS.map((s) => (
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
            )}
          </>
        ) : (
          <div className="mt-8 rounded-2xl border border-zinc-100 bg-white p-10 text-center">
            <Search className="mx-auto h-10 w-10 text-zinc-300" />
            <h1 className="mt-4 text-lg font-bold text-zinc-700">
              Hledání sportovišť
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Zadejte alespoň 2 znaky pro vyhledávání.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

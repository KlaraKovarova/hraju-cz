import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Trophy } from "lucide-react";
import { safeJsonLd } from "@/lib/seo";
import { getPhotoOfTheWeekArchive, type PhotoOfTheWeekWinner } from "@/lib/photos";
import { formatWeekKeyCs } from "@/lib/photo-week";

// SIL-666 — Archive of past "Foto týdne" winners.
// ISR 24h, deterministic order, public list → ItemList JSON-LD for SEO.
export const revalidate = 86400;

const CANONICAL = "https://www.hraju.cz/foto-tydne";

export const metadata: Metadata = {
  title: "Foto týdne — archiv vítězů | hraju.cz",
  description:
    "Každý týden komunita hraju.cz hlasuje pro nejlepší uživatelskou fotku ze sportovišť v Česku. Procházejte archiv vítězů — ferraty, lezecké stěny, bazény a další.",
  openGraph: {
    title: "Foto týdne — archiv vítězů",
    description:
      "Každý týden komunita hraju.cz hlasuje pro nejlepší uživatelskou fotku ze sportovišť v Česku.",
    url: CANONICAL,
    type: "website",
    siteName: "hraju.cz",
    locale: "cs_CZ",
  },
  alternates: { canonical: CANONICAL },
};

function facilityHref(w: PhotoOfTheWeekWinner): string {
  return w.facility.sportSlug
    ? `/sport/${w.facility.sportSlug}/${w.facility.slug}`
    : `/${w.facility.slug}`;
}

function buildItemListLd(winners: PhotoOfTheWeekWinner[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: winners.map((w, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.hraju.cz${facilityHref(w)}`,
      name: `Foto týdne ${w.weekKey} — ${w.facility.name}`,
      image: w.photo.url,
    })),
  };
}

export default async function FotoTydnePage() {
  const winners = await getPhotoOfTheWeekArchive(100);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hraju.cz", item: "https://www.hraju.cz" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Foto týdne",
        item: CANONICAL,
      },
    ],
  };
  const itemListLd = winners.length > 0 ? buildItemListLd(winners) : null;

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      {itemListLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd) }}
        />
      )}

      {/* Breadcrumb */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Link href="/" className="font-extrabold text-zinc-900 hover:text-emerald-600">
              hraju<span className="text-emerald-600">.cz</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <span className="font-medium text-zinc-900">Foto týdne</span>
          </div>
        </div>
      </nav>

      <header className="border-b border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
              <Trophy className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Foto týdne
              </h1>
              <p className="mt-2 max-w-2xl text-zinc-600">
                Každý týden hlasuje komunita hraju.cz pro nejlepší uživatelskou fotku
                ze sportovišť v Česku. Vítěz získává odznak &bdquo;Foto týdne&ldquo; a místo
                v tomto archivu.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        {winners.length === 0 ? (
          <div className="rounded-2xl border border-zinc-100 bg-white p-10 text-center">
            <Trophy className="mx-auto h-10 w-10 text-amber-300" />
            <h2 className="mt-4 text-lg font-semibold text-zinc-900">
              Zatím bez vítězů
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              První foto týdne bude vybráno po prvním kompletním týdnu hlasování.
              Hlasovat můžete v galerii u jakékoli fotky novější než 14 dní.
            </p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {winners.map((w) => {
              const fHref = facilityHref(w);
              return (
                <li
                  key={w.weekKey}
                  className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:border-amber-200 hover:shadow"
                >
                  <Link
                    href={fHref}
                    className="group relative block aspect-[4/3] overflow-hidden bg-zinc-100"
                    aria-label={`Foto týdne ${w.weekKey} — ${w.facility.name}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={w.photo.url}
                      alt={w.photo.alt || `Foto týdne — ${w.facility.name}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                      <Trophy className="h-3 w-3" />
                      {formatWeekKeyCs(w.weekKey)}
                    </span>
                  </Link>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="text-base font-semibold text-zinc-900">
                      <Link href={fHref} className="hover:text-emerald-700 hover:underline">
                        {w.facility.name}
                      </Link>
                    </h3>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>
                        {w.user.name ? (
                          <Link
                            href={`/uzivatel/${w.user.id}`}
                            className="font-medium text-zinc-700 hover:text-emerald-700 hover:underline"
                          >
                            {w.user.name}
                          </Link>
                        ) : (
                          <span className="text-zinc-500">Uživatel hraju.cz</span>
                        )}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-amber-600">
                        ♥ {w.voteCount}
                      </span>
                    </div>
                    {w.facility.sportName && (
                      <span className="w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        {w.facility.sportName}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, Star, MessageSquare, Users, Building2 } from "lucide-react";
import { getReviewStats, getRecentReviews } from "@/lib/data";
import { ReviewsHubClient } from "@/components/ReviewsHubClient";
import { AdSlot } from "@/components/AdSlot";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Recenze sportovišť — hraju.cz",
  description:
    "Přečtěte si recenze sportovišť od skutečných sportovců z celé České republiky. Tenisové kurty, squash, badminton, bazény, fitness a další — hodnocení a zkušenosti.",
  openGraph: {
    title: "Recenze sportovišť — hraju.cz",
    description:
      "Skutečné recenze sportovišť od české sportovní komunity. Najděte nejlépe hodnocená sportoviště ve vašem okolí.",
    url: "https://www.hraju.cz/recenze",
    type: "website",
    siteName: "hraju.cz",
    locale: "cs_CZ",
  },
  alternates: { canonical: "https://www.hraju.cz/recenze" },
};

export default async function RecenzePage() {
  const [stats, recentReviews] = await Promise.all([
    getReviewStats(),
    getRecentReviews(3),
  ]);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "hraju.cz",
        item: "https://www.hraju.cz",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Recenze",
        item: "https://www.hraju.cz/recenze",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Nav */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Link
              href="/"
              className="font-extrabold text-zinc-900 hover:text-emerald-600"
            >
              hraju<span className="text-emerald-600">.cz</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <span className="font-medium text-zinc-900">Recenze</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Recenze{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              sportovišť
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-zinc-500">
            Skutečné hodnocení od sportovců z celé České republiky. Přečtěte si zkušenosti
            ostatních a najděte to pravé sportoviště pro vás.
          </p>

          {/* Stats */}
          {stats.totalReviews > 0 && (
            <div className="mt-6 flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <span className="text-lg font-bold text-zinc-900">
                    {stats.totalReviews}
                  </span>
                  <p className="text-xs text-zinc-500">recenzí</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                  <Star className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <span className="text-lg font-bold text-zinc-900">
                    {stats.averageRating}
                  </span>
                  <p className="text-xs text-zinc-500">průměrné hodnocení</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50">
                  <Building2 className="h-4 w-4 text-sky-600" />
                </div>
                <div>
                  <span className="text-lg font-bold text-zinc-900">
                    {stats.totalFacilitiesReviewed}
                  </span>
                  <p className="text-xs text-zinc-500">hodnocených sportovišť</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Ad slot */}
      <div className="mx-auto max-w-6xl px-6 py-4">
        <AdSlot slot="2345678901" format="horizontal" />
      </div>

      {/* Reviews list with filters */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <Suspense
          fallback={
            <p className="text-sm text-zinc-400">Načítání recenzí...</p>
          }
        >
          <ReviewsHubClient />
        </Suspense>
      </section>

      {/* SEO: server-rendered recent reviews for crawlers */}
      {recentReviews.length > 0 && (
        <section className="sr-only" aria-label="Nejnovější recenze">
          <h2>Nejnovější recenze sportovišť</h2>
          {recentReviews.map((r) => (
            <article key={r.id}>
              <p>
                {r.authorName} — {r.rating}/5 hvězdiček
              </p>
              {r.title && <p>{r.title}</p>}
              {r.text && <p>{r.text}</p>}
              <p>
                Sportoviště:{" "}
                <Link href={r.facility.sport ? `/sport/${r.facility.sport}/${r.facility.slug}` : `/recenze`}>
                  {r.facility.name}
                </Link>
              </p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

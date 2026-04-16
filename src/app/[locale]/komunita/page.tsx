import Link from "next/link";
import {
  ChevronRight,
  Users,
  MessageSquare,
  Trophy,
  ThumbsUp,
  MapPin,
  Star,
  Flame,
  TrendingUp,
} from "lucide-react";
import {
  getCommunityStats,
  getRecentActivity,
  getTopReviewers,
  getMostActiveFacilities,
} from "@/lib/data";
import { getSportBySlug } from "@/lib/sports";
import { safeJsonLd } from "@/lib/seo";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ChallengeCards } from "@/components/ChallengeCards";
import { SportFilterPills } from "@/components/SportFilterPills";
import { AdSlot } from "@/components/AdSlot";
import type { Metadata } from "next";

// ISR: revalidate community page every 6 hours (optimization: reduce Vercel invocations)
export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Komunita — hraju.cz",
  description:
    "Sportovní komunita hraju.cz — sledujte nejnovější recenze, check-iny a aktivitu sportovců z celé České republiky. Sbírejte odznaky a zapojte se!",
  openGraph: {
    title: "Komunita — hraju.cz",
    description:
      "Sledujte aktivitu sportovců, žebříčky recenzentů a sbírejte odznaky na hraju.cz.",
    url: "https://www.hraju.cz/komunita",
    type: "website",
    siteName: "hraju.cz",
    locale: "cs_CZ",
  },
  alternates: { canonical: "https://www.hraju.cz/komunita" },
};

const LEADERBOARD_LABELS: Record<string, string> = {
  tenis: "Top tenisté",
  squash: "Top squashisté",
  badminton: "Top badmintonisté",
  plavani: "Top plavci",
  fitness: "Top fitness nadšenci",
  lezeni: "Top lezci",
  ferraty: "Top ferratisté",
};

export default async function KomunitaPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}) {
  const { sport: sportParam } = await searchParams;
  const activeSport = sportParam && getSportBySlug(sportParam) ? sportParam : undefined;

  const [communityStats, activityItems, topReviewers, trendingFacilities] = await Promise.all([
    getCommunityStats(),
    getRecentActivity({ sport: activeSport, limit: 30 }),
    getTopReviewers(10, activeSport),
    getMostActiveFacilities(30, 6),
  ]);

  const leaderboardTitle = activeSport
    ? LEADERBOARD_LABELS[activeSport] || "Top recenzenti"
    : "Top recenzenti";

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
        name: "Komunita",
        item: "https://www.hraju.cz/komunita",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
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
            <span className="font-medium text-zinc-900">Komunita</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Sportovní{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              komunita
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-zinc-500">
            Sledujte, co se děje ve světě českého sportu. Recenze, check-iny,
            tipy a výzvy — vše na jednom místě.
          </p>

          {/* Stats */}
          <div className="mt-6 flex flex-wrap gap-6">
            {communityStats.totalUsers > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <span className="text-lg font-bold text-zinc-900">
                    {communityStats.totalUsers}
                  </span>
                  <p className="text-xs text-zinc-500">aktivních uživatelů</p>
                </div>
              </div>
            )}
            {communityStats.totalReviews > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                  <MessageSquare className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <span className="text-lg font-bold text-zinc-900">
                    {communityStats.totalReviews}
                  </span>
                  <p className="text-xs text-zinc-500">recenzí</p>
                </div>
              </div>
            )}
          </div>

          {/* Sport filter */}
          <div className="mt-8">
            <SportFilterPills activeSport={activeSport} />
          </div>
        </div>
      </section>

      {/* Ad slot */}
      <div className="mx-auto max-w-6xl px-6 py-4">
        <AdSlot slot="3456789012" format="horizontal" />
      </div>

      {/* Challenges */}
      <section className="mx-auto max-w-6xl px-6 pt-4">
        <ChallengeCards sportSlug={activeSport} />
      </section>

      {/* Activity Feed */}
      {activityItems.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-zinc-900">Právě se děje</h2>
          </div>
          <div className="mx-auto max-w-2xl">
            <ActivityFeed items={activityItems} />
          </div>
        </section>
      )}

      {/* Trending facilities */}
      {trendingFacilities.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8 border-t border-zinc-100">
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-bold text-zinc-900">Trendy tento měsíc</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trendingFacilities.map((facility, index) => (
              <Link
                key={facility.id}
                href={facility.sportSlug ? `/sport/${facility.sportSlug}/${facility.slug}` : `/${facility.slug}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white p-4 hover:border-emerald-200 hover:shadow-sm transition-all"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  index === 0 ? "bg-amber-100 text-amber-700"
                  : index === 1 ? "bg-zinc-200 text-zinc-600"
                  : index === 2 ? "bg-orange-100 text-orange-700"
                  : "bg-zinc-50 text-zinc-500"
                }`}>
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">{facility.name}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-500" />
                      {facility.activityCount} aktivit
                    </span>
                    {facility.averageRating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {facility.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top recenzenti */}
      {topReviewers.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8 border-t border-zinc-100">
          <div className="mb-6 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold text-zinc-900">{leaderboardTitle}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topReviewers.map((reviewer, index) => (
              <Link
                key={reviewer.id}
                href={`/uzivatel/${reviewer.id}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white p-4 hover:border-emerald-200 hover:shadow-sm transition-all"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    index === 0
                      ? "bg-amber-100 text-amber-700"
                      : index === 1
                        ? "bg-zinc-100 text-zinc-600"
                        : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-zinc-50 text-zinc-500"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {reviewer.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {reviewer.reviewCount}{" "}
                      {reviewer.reviewCount === 1
                        ? "recenze"
                        : reviewer.reviewCount <= 4
                          ? "recenze"
                          : "recenzí"}
                    </span>
                    {reviewer.helpfulVotes > 0 && (
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {reviewer.helpfulVotes}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 text-center">
          <h2 className="text-xl font-bold text-zinc-900">
            Zapojte se do komunity
          </h2>
          <p className="mt-2 text-zinc-500">
            Přidejte recenzi, označte sportoviště jako navštívené a sbírejte
            odznaky.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/recenze"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition"
            >
              <Star className="h-4 w-4" />
              Napsat recenzi
            </Link>
            <Link
              href="/prihlaseni"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-300 transition"
            >
              <Users className="h-4 w-4" />
              Vytvořit účet
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

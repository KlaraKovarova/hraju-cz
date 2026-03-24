import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ChevronRight, ChevronDown, Calendar, ArrowRight, PlusCircle, Star, Map } from "lucide-react";
import { getSportBySlug, SPORTS } from "@/lib/sports";
import { getRegionsBySport, getTopFacilitiesBySport, getTopCitiesBySport, getTopReviewsBySport, getSportReviewStats, getFacilityMapMarkersBySport } from "@/lib/data";
import { getSportTitleSuffix, getSportFacilityTypePluralGenitive, getSportFacilityType } from "@/lib/seo";
import { FacilityCard } from "@/components/FacilityCard";
import { FacilityMap } from "@/components/FacilityMap";
import { HeroSearchForm } from "@/components/HeroSearchForm";
import { AdSlot } from "@/components/AdSlot";
import { BannerSlot } from "@/components/BannerSlot";
import { ChallengeCards } from "@/components/ChallengeCards";
import { getSportFaqs } from "@/lib/sport-faq";
import { getPostsBySport, CATEGORIES } from "@/lib/blog";
import type { Metadata } from "next";

// ISR: revalidate sport pages every hour
export const revalidate = 3600;

interface SportPageProps {
  params: Promise<{ sport: string }>;
}

export async function generateMetadata({
  params,
}: SportPageProps): Promise<Metadata> {
  const { sport: sportSlug } = await params;
  const sport = getSportBySlug(sportSlug);
  if (!sport) return {};

  const regions = await getRegionsBySport(sport.slug);
  const totalFacilities = regions.reduce((sum, r) => sum + r.facilityCount, 0);

  const title = `${sport.nameCs} — ${getSportTitleSuffix(sport.slug)}`;
  const description = `${totalFacilities} ${getSportFacilityTypePluralGenitive(sport.slug)} ve všech 14 krajích. Najdi ${getSportFacilityType(sport.slug)} ve svém městě — adresy, kontakty, otevírací doby.`;
  const url = `https://www.hraju.cz/sport/${sportSlug}`;

  return {
    title,
    description,
    openGraph: { title, description, url, type: "website", siteName: "hraju.cz", locale: "cs_CZ", images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `${sport.nameCs} — hraju.cz` }] },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: url },
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200"}`}
        />
      ))}
    </span>
  );
}

export default async function SportPage({ params }: SportPageProps) {
  const { sport: sportSlug } = await params;
  const sport = getSportBySlug(sportSlug);

  if (!sport) {
    notFound();
  }

  const [regions, topFacilities, topCities, reviewStats, topReviews] = await Promise.all([
    getRegionsBySport(sport.slug),
    getTopFacilitiesBySport(sport.slug, 10),
    getTopCitiesBySport(sport.slug, 10),
    getSportReviewStats(sport.slug),
    getTopReviewsBySport(sport.slug, 3),
  ]);

  const totalFacilities = regions.reduce((sum, r) => sum + r.facilityCount, 0);
  const sportPosts = getPostsBySport(sport.slug);
  const mapMarkers = getFacilityMapMarkersBySport(sport.slug);

  // JSON-LD ItemList for top facilities
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: sport.nameCs,
    numberOfItems: topFacilities.length,
    itemListElement: topFacilities.map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: f.name,
      url: `https://www.hraju.cz/sport/${sportSlug}/${f.slug}`,
    })),
  };

  // FAQ data + JSON-LD
  const faqItems = getSportFaqs(sport.slug);
  const faqLd = faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  } : null;

  // BreadcrumbList JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hraju.cz", item: "https://www.hraju.cz" },
      { "@type": "ListItem", position: 2, name: sport.nameCs, item: `https://www.hraju.cz/sport/${sportSlug}` },
    ],
  };

  // CollectionPage JSON-LD with AggregateRating (if reviews exist)
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${sport.nameCs} v České republice`,
    description: sport.description,
    url: `https://www.hraju.cz/sport/${sportSlug}`,
    ...(reviewStats.totalReviews > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: reviewStats.averageRating,
        reviewCount: reviewStats.totalReviews,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  };

  // Split blog posts: first 3 for the grid, rest for the list
  const featuredPosts = sportPosts.slice(0, 3);
  const morePosts = sportPosts.slice(3, 9);

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
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

      {/* Sport Hero — enhanced with stats */}
      <section className="relative border-b border-zinc-100 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={sport.image}
            alt={sport.nameCs}
            fill
            className="object-cover object-top"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-zinc-900/55" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{sport.icon}</span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                {sport.nameCs}
              </h1>
              <p className="mt-1 text-white/80">
                {sport.description}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70">
            <span>
              <span className="font-semibold text-white">{totalFacilities}</span> sportovišť
              {" "}v <span className="font-semibold text-white">{regions.length}</span> krajích
            </span>
            {reviewStats.totalReviews > 0 && (
              <>
                <span className="text-white/40">|</span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-white">{reviewStats.averageRating}</span>
                  {" "}z <span className="font-semibold text-white">{reviewStats.totalReviews}</span> recenzí
                </span>
              </>
            )}
            {sportPosts.length > 0 && (
              <>
                <span className="text-white/40">|</span>
                <span>
                  <span className="font-semibold text-white">{sportPosts.length}</span> článků
                </span>
              </>
            )}
          </div>
          <HeroSearchForm sportSlug={sport.slug} />
        </div>
      </section>

      {/* Map View — all facilities with coordinates */}
      {mapMarkers.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-zinc-900">
            <Map className="h-5 w-5 text-zinc-400" />
            Mapa — {sport.nameCs.toLowerCase()} v ČR
          </h2>
          <FacilityMap
            markers={mapMarkers}
            className="h-[400px] w-full rounded-2xl border border-zinc-200 overflow-hidden"
          />
          <p className="mt-2 text-xs text-zinc-400">
            {mapMarkers.length} {mapMarkers.length === 1 ? "místo" : "míst"} na mapě
          </p>
        </section>
      )}

      {/* Regions Grid */}
      <section className="mx-auto max-w-6xl px-6 py-8 border-t border-zinc-100">
        <h2 className="mb-6 text-xl font-bold text-zinc-900">
          Vyberte kraj
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {regions.map(({ region, facilityCount, cities }) => (
            <Link
              key={region.slug}
              href={`/sport/${sportSlug}/kraj/${region.slug}`}
              className="group flex items-center justify-between rounded-2xl border border-zinc-100 bg-white p-5 transition-all hover:border-zinc-200 hover:shadow-lg hover:shadow-zinc-100"
            >
              <div className="min-w-0">
                <h3 className="text-base font-bold text-zinc-900 group-hover:text-emerald-700">
                  {region.name}
                </h3>
                <div className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <span>
                    {facilityCount} {facilityCount === 1 ? "sportoviště" : "sportovišť"}
                    {" "}v {cities.length} {cities.length === 1 ? "městě" : "městech"}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 transition group-hover:text-emerald-500" />
            </Link>
          ))}
        </div>
      </section>

      {/* Ad: between regions and cities */}
      <div className="mx-auto max-w-6xl px-6 py-4">
        <AdSlot slot="1234567895" format="horizontal" />
      </div>

      {/* Sport-specific challenges (ferraty, lezeni) */}
      {(sportSlug === "ferraty" || sportSlug === "lezeni") && (
        <section className="mx-auto max-w-6xl px-6 pt-4">
          <ChallengeCards filter="sport" />
        </section>
      )}

      {/* Top Cities */}
      {topCities.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8 border-t border-zinc-100">
          <h2 className="mb-6 text-xl font-bold text-zinc-900">
            Nejoblíbenější města
          </h2>

          <div className="flex flex-wrap gap-3">
            {topCities.map(({ city, citySlug, facilityCount }) => (
              <Link
                key={citySlug}
                href={`/sport/${sportSlug}/${citySlug}`}
                className="group flex items-center gap-2 rounded-xl border border-zinc-100 bg-white px-4 py-3 transition-all hover:border-zinc-200 hover:shadow-lg hover:shadow-zinc-100"
              >
                <MapPin className="h-4 w-4 text-zinc-400 group-hover:text-emerald-500" />
                <span className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">
                  {city}
                </span>
                <span className="text-xs text-zinc-400">
                  {facilityCount}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top Facilities */}
      {topFacilities.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8 border-t border-zinc-100">
          <h2 className="mb-6 text-xl font-bold text-zinc-900">
            {sport.nameCs} sportoviště
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topFacilities.slice(0, 3).map((facility, i) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                sportSlug={sportSlug}
                priority={i < 4}
              />
            ))}
          </div>
          {topFacilities.length > 3 && (
            <>
              <div className="my-4 flex justify-center">
                <BannerSlot placement="listing_inline" sport={sportSlug} className="mx-auto" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topFacilities.slice(3).map((facility, i) => (
                  <FacilityCard
                    key={facility.id}
                    facility={facility}
                    sportSlug={sportSlug}
                    priority={i + 3 < 4}
                  />
                ))}
              </div>
            </>
          )}
          {topFacilities.length <= 3 && (
            <div className="mt-4 flex justify-center">
              <BannerSlot placement="listing_inline" sport={sportSlug} className="mx-auto" />
            </div>
          )}
        </section>
      )}

      {/* Featured Reviews */}
      {topReviews.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8 border-t border-zinc-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-900">
              Recenze — {sport.nameCs.toLowerCase()}
            </h2>
            <Link
              href={`/recenze?sport=${sportSlug}`}
              className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
            >
              Všechny recenze
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {topReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-zinc-100 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-zinc-400">
                    {new Date(review.createdAt).toLocaleDateString("cs-CZ")}
                  </span>
                </div>
                {review.title && (
                  <h3 className="mt-3 font-semibold text-zinc-900 text-sm">
                    {review.title}
                  </h3>
                )}
                {review.text && (
                  <p className="mt-2 text-sm text-zinc-600 line-clamp-3">
                    {review.text}
                  </p>
                )}
                <div className="mt-3 pt-3 border-t border-zinc-50">
                  <Link
                    href={`/sport/${review.facility.sport ?? sportSlug}/${review.facility.slug}`}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    {review.facility.name}
                  </Link>
                  <span className="text-xs text-zinc-400"> — {review.facility.city}</span>
                  <p className="text-xs text-zinc-500 mt-0.5">{review.authorName}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ad: after facility cards */}
      <div className="mx-auto max-w-6xl px-6 py-4">
        <AdSlot slot="1234567891" format="horizontal" />
      </div>

      {/* Community CTA */}
      <section className="mx-auto max-w-6xl px-6 py-12 border-t border-zinc-100">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-8 text-center">
          <h2 className="text-xl font-bold text-zinc-900">
            Byl/a jsi tu sportovat?
          </h2>
          <p className="mt-2 text-sm text-zinc-600 max-w-lg mx-auto">
            Pomoz ostatním sportovcům vybrat si to pravé sportoviště. Napiš recenzi a sdílej svou zkušenost s komunitou.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/recenze"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Prohlédnout recenze
            </Link>
            <Link
              href="/prihlaseni"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              Napsat recenzi
            </Link>
          </div>
          <div className="mt-4">
            <Link
              href="/pridat-sportoviste"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
            >
              <PlusCircle className="h-4 w-4" />
              Chybí ti sportoviště? Přidej ho
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      {faqItems.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 py-12 border-t border-zinc-100">
          <h2 className="mb-6 text-xl font-bold text-zinc-900">
            Často kladené otázky — {sport.nameCs}
          </h2>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <details key={i} className="group rounded-2xl border border-zinc-100 bg-white">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-semibold text-zinc-900">
                  {item.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-4 text-sm leading-relaxed text-zinc-600">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Blog Posts — expanded section */}
      {featuredPosts.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-12 border-t border-zinc-100">
          <h2 className="mb-6 text-xl font-bold text-zinc-900">
            Články o sportu {sport.nameCs.toLowerCase()}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {featuredPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl border border-zinc-100 bg-white overflow-hidden transition hover:border-emerald-200 hover:shadow-sm"
              >
                {post.image && (
                  <div className="relative h-40 bg-zinc-100">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-5">
                  <span className="text-xs font-medium text-emerald-600">
                    {CATEGORIES[post.category] || post.category}
                  </span>
                  <h3 className="mt-2 font-bold text-zinc-900 group-hover:text-emerald-700">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                    {post.excerpt}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-zinc-400">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.date).toLocaleDateString("cs-CZ")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {/* Additional posts in a compact list */}
          {morePosts.length > 0 && (
            <div className="mt-6 space-y-3">
              {morePosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-zinc-100 bg-white p-4 transition hover:border-emerald-200 hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-emerald-600">
                      {CATEGORIES[post.category] || post.category}
                    </span>
                    <h3 className="mt-1 font-semibold text-sm text-zinc-900 group-hover:text-emerald-700 truncate">
                      {post.title}
                    </h3>
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {new Date(post.date).toLocaleDateString("cs-CZ")}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300 group-hover:text-emerald-500" />
                </Link>
              ))}
            </div>
          )}
          {sportPosts.length > 9 && (
            <div className="mt-6 text-center">
              <Link
                href={`/blog/sport/${sportSlug}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
              >
                Všech {sportPosts.length} článků <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
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

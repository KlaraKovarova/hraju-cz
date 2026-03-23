import Link from "next/link";
import { MapPin, ArrowRight, ChevronDown, Calendar, Star, MessageSquare, Users, PlusCircle } from "lucide-react";
import { SPORTS } from "@/lib/sports";
import {
  getTotalFacilityCount,
  getTotalSportCount,
  getFeaturedFacilities,
  getTopCitiesOverall,
  getRecentFacilities,
  getRecentReviews,
  getCommunityStats,
} from "@/lib/data";
import { cityToSlug } from "@/lib/regions";
import { FacilityCard } from "@/components/FacilityCard";
import { HeroSearchForm } from "@/components/HeroSearchForm";
import { AdSlot } from "@/components/AdSlot";
import { WeekendEvents } from "@/components/WeekendEvents";
import { getAllPosts, CATEGORIES } from "@/lib/blog";

// ISR: revalidate homepage every 6 hours
export const revalidate = 21600;

export default async function Home() {
  const totalFacilities = getTotalFacilityCount();
  const totalSports = getTotalSportCount();
  const [featuredFacilities, topCities, recentFacilities, recentReviews, communityStats] =
    await Promise.all([
      getFeaturedFacilities(6),
      getTopCitiesOverall(10),
      getRecentFacilities(4),
      getRecentReviews(6),
      getCommunityStats(),
    ]);
  const latestPosts = getAllPosts().slice(0, 3);

  // FAQ data for structured markup
  const faqItems = [
    {
      question: "Kolik sportovišť je na hraju.cz?",
      answer: `Na hraju.cz najdete přes ${Math.floor(totalFacilities / 100) * 100} sportovišť v ${totalSports} sportech po celé České republice. Databázi průběžně rozšiřujeme.`,
    },
    {
      question: "Jak přidat své sportoviště?",
      answer: "Pokud provozujete sportoviště, můžete si svůj profil převzít zdarma na stránce /moje-sportoviste. Stačí zadat e-mail spojený s vaším areálem a obdržíte přihlašovací odkaz.",
    },
    {
      question: "Je hraju.cz zdarma?",
      answer: "Základní zápis sportoviště je zcela zdarma. Pro provozovatele nabízíme Premium předplatné, které zahrnuje zvýraznění ve výsledcích, fotogalerii, tlačítko pro rezervaci a další funkce.",
    },
  ];

  const faqLd = {
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
  };

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "hraju.cz",
    url: "https://www.hraju.cz",
    logo: "https://www.hraju.cz/og-image.jpg",
    description: "Sportoviště v České republice — tenisové kurty, squash, badminton, bazény, fitness a další.",
    areaServed: {
      "@type": "Country",
      name: "Czech Republic",
    },
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "hraju.cz",
    url: "https://www.hraju.cz",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.hraju.cz/hledat?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />

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
              href="/recenze"
              className="transition hover:text-zinc-900"
            >
              Recenze
            </Link>
            <Link
              href="/blog"
              className="transition hover:text-zinc-900"
            >
              Blog
            </Link>
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
            <HeroSearchForm />

            {/* Quick city links */}
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-zinc-400">Oblíbená města:</span>
              {topCities.slice(0, 5).map((city) => (
                <Link
                  key={city.citySlug}
                  href={`/mesto/${city.citySlug}`}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-zinc-600 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  {city.city}
                </Link>
              ))}
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
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-8 px-6 py-5 text-center sm:gap-16">
          <div>
            <span className="text-2xl font-extrabold text-zinc-900">{totalFacilities.toLocaleString("cs-CZ")}+</span>
            <p className="text-xs text-zinc-500">sportovišť</p>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-zinc-900">{totalSports}</span>
            <p className="text-xs text-zinc-500">sportů</p>
          </div>
          {communityStats.totalReviews > 0 && (
            <div>
              <span className="text-2xl font-extrabold text-zinc-900">{communityStats.totalReviews}</span>
              <p className="text-xs text-zinc-500">recenzí</p>
            </div>
          )}
          {communityStats.totalUsers > 0 && (
            <div>
              <span className="text-2xl font-extrabold text-zinc-900">{communityStats.totalUsers}</span>
              <p className="text-xs text-zinc-500">uživatelů</p>
            </div>
          )}
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

      {/* Featured Facilities */}
      {featuredFacilities.length > 0 && (
        <section className="border-t border-zinc-100 bg-zinc-50/50">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Doporučená sportoviště
              </h2>
              <p className="mt-2 text-zinc-500">
                Ověřená a oblíbená sportoviště po celé ČR
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredFacilities.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  sportSlug={facility.sports[0]?.sport.slug || "tenis"}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ad: between Featured and Top Cities */}
      <div className="mx-auto max-w-6xl px-6 py-4">
        <AdSlot slot="1234567890" format="horizontal" />
      </div>

      {/* Community Reviews */}
      {recentReviews.length > 0 && (
        <section className="border-t border-zinc-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Co říká komunita
              </h2>
              <p className="mt-2 text-zinc-500">
                Skutečné recenze od sportovců z celé ČR
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentReviews.map((review) => (
                <Link
                  key={review.id}
                  href={review.facility.sport ? `/sport/${review.facility.sport}/${review.facility.slug}` : `/recenze`}
                  className="group rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5 transition hover:border-emerald-200 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-zinc-900">
                        {review.authorName}
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-zinc-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.title && (
                    <p className="mt-3 text-sm font-semibold text-zinc-800">
                      {review.title}
                    </p>
                  )}
                  {review.text && (
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                      {review.text}
                    </p>
                  )}
                  <p className="mt-3 text-xs font-medium text-emerald-600 group-hover:text-emerald-700">
                    {review.facility.name}
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/recenze"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                <MessageSquare className="h-4 w-4" />
                Všechny recenze
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Top Cities */}
      {topCities.length > 0 && (
        <section className="border-t border-zinc-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Sportoviště ve městech
              </h2>
              <p className="mt-2 text-zinc-500">
                Nejoblíbenější města podle počtu sportovišť
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {topCities.map((city) => (
                <Link
                  key={city.citySlug}
                  href={`/mesto/${city.citySlug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition hover:border-emerald-200 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-medium text-zinc-700 group-hover:text-zinc-900">
                      {city.city}
                    </span>
                    <p className="text-xs text-zinc-400">
                      {city.facilityCount} sportovišť
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Added */}
      {recentFacilities.length > 0 && (
        <section className="border-t border-zinc-100 bg-zinc-50/50">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Nově přidaná sportoviště
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentFacilities.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  sportSlug={facility.sports[0]?.sport.slug || "tenis"}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Weekend Tourist Events */}
      <WeekendEvents />

      {/* Latest Blog Posts */}
      {latestPosts.length > 0 && (
        <section className="border-t border-zinc-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Z našeho blogu
              </h2>
              <p className="mt-2 text-zinc-500">
                Tipy, průvodce a novinky ze světa sportu
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {latestPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6 transition hover:border-emerald-200 hover:shadow-sm"
                >
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
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
              >
                Všechny články <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

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
          <Link
            href="/moje-sportoviste"
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-emerald-700 shadow-lg transition hover:shadow-xl"
          >
            Zaregistrovat sportoviště
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-zinc-100 bg-zinc-50/50">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-zinc-900">
            Časté dotazy
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <details key={i} className="group rounded-2xl border border-zinc-100 bg-white">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-semibold text-zinc-900">
                  {item.question}
                  <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-4 text-sm text-zinc-600">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

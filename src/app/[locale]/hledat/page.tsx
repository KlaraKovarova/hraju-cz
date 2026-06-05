import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Search, MapPin, Calendar, BookOpen, Star } from "lucide-react";
import { searchFacilities } from "@/lib/data";
import { getAllPosts, CATEGORIES } from "@/lib/blog";
import { prisma } from "@/lib/prisma";
import { getSportBySlug, SPORTS } from "@/lib/sports";
import { SearchResults } from "@/components/SearchResults";
import { AdSlot } from "@/components/AdSlot";
import { TrackPageView } from "@/components/TrackPageView";
import type { Metadata } from "next";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; sport?: string; typ?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const title = q ? `Hledání: ${q}` : "Hledání";

  return {
    title,
    robots: { index: false, follow: true },
    alternates: {
      canonical: q
        ? `https://www.hraju.cz/hledat?q=${encodeURIComponent(q)}`
        : "https://www.hraju.cz/hledat",
    },
  };
}

async function searchEvents(query: string, limit: number) {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  if (tokens.length === 0) return [];

  const now = new Date();
  try {
    return await prisma.touristEvent.findMany({
      where: {
        isActive: true,
        dateStart: { gte: now },
        AND: tokens.map((token) => ({
          OR: [
            { name: { contains: token, mode: "insensitive" as const } },
            { city: { contains: token, mode: "insensitive" as const } },
            { description: { contains: token, mode: "insensitive" as const } },
          ],
        })),
      },
      orderBy: { dateStart: "asc" },
      take: limit,
      select: {
        id: true,
        name: true,
        dateStart: true,
        dateEnd: true,
        city: true,
        region: true,
        externalUrl: true,
      },
    });
  } catch {
    return [];
  }
}

function searchPosts(query: string, limit: number) {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  if (tokens.length === 0) return [];

  const allPosts = getAllPosts();
  return allPosts
    .filter((post) => {
      const titleLower = post.title.toLowerCase();
      const excerptLower = post.excerpt.toLowerCase();
      const tagsLower = post.sportTags.join(" ").toLowerCase();

      return tokens.every(
        (token) =>
          titleLower.includes(token) ||
          excerptLower.includes(token) ||
          tagsLower.includes(token),
      );
    })
    .slice(0, limit);
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, sport: sportSlug, typ } = await searchParams;
  const query = q?.trim() ?? "";
  const sport = sportSlug ? getSportBySlug(sportSlug) : null;
  const activeTab = typ || "vse";

  const [facilities, events, posts] = query.length >= 2
    ? await Promise.all([
        (activeTab === "vse" || activeTab === "sportoviste")
          ? searchFacilities(query, sportSlug, 200)
          : Promise.resolve([]),
        (activeTab === "vse" || activeTab === "akce")
          ? searchEvents(query, 50)
          : Promise.resolve([]),
        (activeTab === "vse" || activeTab === "blog")
          ? Promise.resolve(searchPosts(query, 50))
          : Promise.resolve([]),
      ])
    : [[], [], []];

  const totalResults = facilities.length + events.length + posts.length;

  const tabs = [
    { key: "vse", label: "Vše", count: facilities.length + events.length + posts.length },
    { key: "sportoviste", label: "Sportoviště", count: facilities.length },
    { key: "akce", label: "Akce", count: events.length },
    { key: "blog", label: "Blog", count: posts.length },
  ];

  return (
    <main className="min-h-screen bg-zinc-50/50">
      {query.length >= 2 && (
        <TrackPageView
          eventName="search"
          params={{ query, resultCount: totalResults }}
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
          <div className="flex items-center gap-4">
            <Link href="/ms-2026" className="font-semibold text-emerald-600 transition hover:text-emerald-700">⚽ MS 2026</Link>
            <Link
              href="/"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
            >
              Domů
            </Link>
          </div>
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
              Nalezeno {totalResults}{" "}
              {totalResults === 1 ? "výsledek" : totalResults < 5 ? "výsledky" : "výsledků"}
            </p>

            {/* Tabs */}
            {totalResults > 0 && (
              <div className="mt-6 flex gap-2 overflow-x-auto">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.key;
                  const params = new URLSearchParams();
                  params.set("q", query);
                  if (sportSlug) params.set("sport", sportSlug);
                  if (tab.key !== "vse") params.set("typ", tab.key);
                  return (
                    <Link
                      key={tab.key}
                      href={`/hledat?${params.toString()}`}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {tab.label}
                      <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                        isActive ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-500"
                      }`}>
                        {tab.count}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            {totalResults > 0 ? (
              <div className="mt-8 space-y-12">
                {/* Facilities */}
                {facilities.length > 0 && (activeTab === "vse" || activeTab === "sportoviste") && (
                  <div>
                    {activeTab === "vse" && (
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-800">
                          <MapPin className="h-5 w-5 text-emerald-500" />
                          Sportoviště
                          <span className="text-sm font-normal text-zinc-400">({facilities.length})</span>
                        </h2>
                        {facilities.length > 6 && (
                          <Link
                            href={`/hledat?q=${encodeURIComponent(query)}${sportSlug ? `&sport=${sportSlug}` : ""}&typ=sportoviste`}
                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                          >
                            Zobrazit vše &rarr;
                          </Link>
                        )}
                      </div>
                    )}
                    <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-zinc-100" />)}</div>}>
                      <SearchResults
                        facilities={activeTab === "vse" ? facilities.slice(0, 6) : facilities}
                      />
                    </Suspense>
                  </div>
                )}

                {/* Events */}
                {events.length > 0 && (activeTab === "vse" || activeTab === "akce") && (
                  <div>
                    {activeTab === "vse" && (
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-800">
                          <Calendar className="h-5 w-5 text-emerald-500" />
                          Akce
                          <span className="text-sm font-normal text-zinc-400">({events.length})</span>
                        </h2>
                        {events.length > 4 && (
                          <Link
                            href={`/hledat?q=${encodeURIComponent(query)}&typ=akce`}
                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                          >
                            Zobrazit vše &rarr;
                          </Link>
                        )}
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(activeTab === "vse" ? events.slice(0, 4) : events).map((event) => (
                        <a
                          key={event.id}
                          href={event.externalUrl || "#"}
                          target={event.externalUrl ? "_blank" : undefined}
                          rel={event.externalUrl ? "noopener noreferrer" : undefined}
                          className="group flex gap-4 rounded-xl border border-zinc-100 bg-white p-4 transition hover:border-emerald-200 hover:shadow-sm"
                        >
                          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-zinc-800 group-hover:text-emerald-700">
                              {event.name}
                            </h3>
                            <p className="mt-0.5 text-sm text-zinc-500">
                              {formatDate(event.dateStart)}
                              {event.dateEnd &&
                                new Date(event.dateEnd).toDateString() !==
                                  new Date(event.dateStart).toDateString() &&
                                ` – ${formatDate(event.dateEnd)}`}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-sm text-zinc-400">
                              <MapPin className="h-3 w-3" />
                              {event.city}
                              {event.region && `, ${event.region}`}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blog Posts */}
                {posts.length > 0 && (activeTab === "vse" || activeTab === "blog") && (
                  <div>
                    {activeTab === "vse" && (
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-800">
                          <BookOpen className="h-5 w-5 text-emerald-500" />
                          Blog
                          <span className="text-sm font-normal text-zinc-400">({posts.length})</span>
                        </h2>
                        {posts.length > 4 && (
                          <Link
                            href={`/hledat?q=${encodeURIComponent(query)}&typ=blog`}
                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                          >
                            Zobrazit vše &rarr;
                          </Link>
                        )}
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(activeTab === "vse" ? posts.slice(0, 4) : posts).map((post) => (
                        <Link
                          key={post.slug}
                          href={`/blog/${post.slug}`}
                          className="group flex gap-4 rounded-xl border border-zinc-100 bg-white p-4 transition hover:border-emerald-200 hover:shadow-sm"
                        >
                          {post.image && (
                            <img
                              src={post.image}
                              alt={post.title}
                              className="h-16 w-16 shrink-0 rounded-lg object-cover"
                            />
                          )}
                          <div className="min-w-0">
                            <h3 className="line-clamp-2 font-semibold text-zinc-800 group-hover:text-emerald-700">
                              {post.title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                              {post.excerpt}
                            </p>
                            <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-400">
                              <span>{formatDate(post.date)}</span>
                              {post.category && CATEGORIES[post.category] && (
                                <>
                                  <span>&middot;</span>
                                  <span>{CATEGORIES[post.category]}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {facilities.length > 6 && activeTab === "sportoviste" && (
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
              Hledání
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Zadejte alespoň 2 znaky pro vyhledávání sportovišť, akcí a článků.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

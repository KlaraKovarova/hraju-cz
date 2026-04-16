import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Star, MessageSquare, Calendar, User, Award, MapPinCheck, MapPin, Camera } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StarRating } from "@/components/StarRating";
import { AdSlot } from "@/components/AdSlot";
import { getUserBadges } from "@/lib/challenges";
import { SPORTS } from "@/lib/sports";
import { safeJsonLd } from "@/lib/seo";
import type { Metadata } from "next";

// ISR: revalidate user profiles every 6 hours (optimization)
export const revalidate = 21600;

type Props = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  if (!user) return { title: "Uživatel nenalezen — hraju.cz" };

  // Use the user's most recent public photo as the OG image override when available.
  const latestPhoto = await prisma.userPhoto.findFirst({
    where: { userId, isHidden: false },
    orderBy: { createdAt: "desc" },
    select: { url: true },
  });

  const displayName = user.name || "Sportovec";
  const title = `${displayName} — profil a recenze — hraju.cz`;
  const description = `Přečtěte si recenze od uživatele ${displayName} na hraju.cz. Hodnocení sportovišť z celé České republiky.`;
  const ogImage = latestPhoto?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description: `Recenze sportovišť od ${displayName} na hraju.cz.`,
      type: "profile",
      siteName: "hraju.cz",
      locale: "cs_CZ",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      bio: true,
      location: true,
      favoriteSports: true,
      createdAt: true,
    },
  });

  if (!user) notFound();

  const [reviews, visitCount, earnedBadges, photoCount] = await Promise.all([
    prisma.review.findMany({
      where: { userId: user.id, isApproved: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        title: true,
        text: true,
        createdAt: true,
        facility: {
          select: {
            name: true,
            slug: true,
            location: { select: { city: true } },
            sports: { take: 1, select: { sport: { select: { slug: true, nameCs: true } } } },
          },
        },
      },
    }),
    prisma.visit.count({ where: { userId: user.id } }),
    getUserBadges(user.id),
    prisma.userPhoto.count({ where: { userId: user.id, isHidden: false } }),
  ]);

  const displayName = user.name || "Sportovec";
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

  const joinDate = user.createdAt.toLocaleDateString("cs", {
    month: "long",
    year: "numeric",
  });

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hraju.cz", item: "https://www.hraju.cz" },
      { "@type": "ListItem", position: 2, name: "Recenze", item: "https://www.hraju.cz/recenze" },
      {
        "@type": "ListItem",
        position: 3,
        name: displayName,
        item: `https://www.hraju.cz/uzivatel/${user.id}`,
      },
    ],
  };

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    url: `https://www.hraju.cz/uzivatel/${user.id}`,
    ...(user.bio ? { description: user.bio } : {}),
    ...(user.location ? { homeLocation: { "@type": "Place", name: user.location } } : {}),
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(personLd) }}
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
            <Link href="/recenze" className="hover:text-emerald-600">
              Recenze
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <span className="font-medium text-zinc-900">{displayName}</span>
          </div>
        </div>
      </nav>

      {/* Profile hero */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
                {displayName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Členem od {joinDate}
                </span>
                {user.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {user.location}
                  </span>
                )}
              </div>
              {user.bio && (
                <p className="mt-2 max-w-xl text-sm text-zinc-600">{user.bio}</p>
              )}
              {user.favoriteSports.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {user.favoriteSports.map((slug) => {
                    const sport = SPORTS.find((s) => s.slug === slug);
                    if (!sport) return null;
                    return (
                      <span
                        key={slug}
                        className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600"
                      >
                        {sport.icon} {sport.nameCs}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          {earnedBadges.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {earnedBadges.map((badge) => (
                <span
                  key={badge.slug}
                  className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-100"
                  title={badge.description}
                >
                  <Award className="h-3.5 w-3.5" />
                  {badge.emoji} {badge.name}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="mt-8 flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <span className="text-lg font-bold text-zinc-900">{totalReviews}</span>
                <p className="text-xs text-zinc-500">
                  {totalReviews === 1 ? "recenze" : totalReviews >= 2 && totalReviews <= 4 ? "recenze" : "recenzí"}
                </p>
              </div>
            </div>
            {avgRating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                  <Star className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <span className="text-lg font-bold text-zinc-900">{avgRating}</span>
                  <p className="text-xs text-zinc-500">průměrné hodnocení</p>
                </div>
              </div>
            )}
            {visitCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50">
                  <MapPinCheck className="h-4 w-4 text-sky-500" />
                </div>
                <div>
                  <span className="text-lg font-bold text-zinc-900">{visitCount}</span>
                  <p className="text-xs text-zinc-500">
                    {visitCount === 1 ? "navštívené místo" : visitCount >= 2 && visitCount <= 4 ? "navštívená místa" : "navštívených míst"}
                  </p>
                </div>
              </div>
            )}
            {photoCount > 0 && (
              <Link
                href={`/uzivatel/${user.id}/fotky`}
                className="flex items-center gap-2 rounded-lg transition hover:bg-zinc-50"
                aria-label={`Zobrazit všechny fotky uživatele ${displayName}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
                  <Camera className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <span className="text-lg font-bold text-zinc-900">{photoCount}</span>
                  <p className="text-xs text-zinc-500">
                    {photoCount === 1 ? "fotka" : photoCount >= 2 && photoCount <= 4 ? "fotky" : "fotek"}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Ad slot */}
      <div className="mx-auto max-w-6xl px-6 py-4">
        <AdSlot slot="2345678901" format="horizontal" />
      </div>

      {/* Reviews */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="text-xl font-bold text-zinc-900">
          {totalReviews > 0 ? "Recenze" : "Zatím žádné recenze"}
        </h2>

        {totalReviews > 0 ? (
          <div className="mt-6 space-y-4">
            {reviews.map((r) => {
              const sportSlug = r.facility.sports[0]?.sport.slug || "squash";
              const sportName = r.facility.sports[0]?.sport.nameCs || "";
              const facilityUrl = `/sport/${sportSlug}/${r.facility.slug}`;

              return (
                <article
                  key={r.id}
                  className="rounded-xl border border-zinc-100 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={facilityUrl}
                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        {r.facility.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {[r.facility.location.city, sportName].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {r.createdAt.toLocaleDateString("cs", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="mt-2">
                    <StarRating rating={r.rating} size="sm" />
                  </div>

                  {r.title && (
                    <p className="mt-2 text-sm font-semibold text-zinc-800">{r.title}</p>
                  )}
                  {r.text && (
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600">{r.text}</p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">
            Tento uživatel ještě nenapsal žádnou recenzi.
          </p>
        )}
      </section>
    </main>
  );
}

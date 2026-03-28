import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  ExternalLink,
  ChevronRight,
  Navigation,
  CheckCircle2,
  CalendarCheck,
  Building2,
} from "lucide-react";
import { getSportBySlug, isSportClaimable } from "@/lib/sports";
import { getFacilityBySlug, getInactiveFacilityRedirectInfo, getFacilitiesByCityAndSport, getRelatedFacilities, type NearbyFacility } from "@/lib/data";
import { getPostsBySport } from "@/lib/blog";
import { getRegionByName, cityToSlug, getRegionSlug } from "@/lib/regions";
import { getGuideBySlug } from "@/lib/guides";
import { getSportFacilityType, getSportFacilityTypePluralGenitive } from "@/lib/seo";
import { getCityInPhrase } from "@/lib/locative";
import EditSuggestionForm from "@/components/EditSuggestionForm";
import { StarRating } from "@/components/StarRating";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList } from "@/components/ReviewList";
import { AggregateRating } from "@/components/AggregateRating";
import { CityLandingContent } from "@/components/CityLandingContent";
import { PhotoGallery } from "@/components/PhotoGallery";
import { OpeningHoursDisplay } from "@/components/OpeningHoursDisplay";
import { SocialShareBar } from "@/components/SocialShareBar";
import { FacilityMap } from "@/components/FacilityMap";
import { AdSlot } from "@/components/AdSlot";
import { BannerSlot } from "@/components/BannerSlot";
import { TrackPageView } from "@/components/TrackPageView";
import { TrackClick } from "@/components/TrackClick";
import { CheckInButton } from "@/components/CheckInButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { FacilityGallery } from "@/components/FacilityGallery";
import { TipList } from "@/components/TipList";
import { TipForm } from "@/components/TipForm";
import { OwnerEditButton, OwnerUpgradeCTA } from "@/components/OwnerControls";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

// ISR: revalidate facility/city pages every hour
export const revalidate = 3600;

interface FacilityPageProps {
  params: Promise<{ sport: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: FacilityPageProps): Promise<Metadata> {
  const { sport: sportSlug, slug } = await params;
  const sport = getSportBySlug(sportSlug);
  if (!sport) return {};

  // Try facility first
  const { facility } = await getFacilityBySlug(slug);
  if (facility) {
    const title = `${facility.name} — ${getSportFacilityType(sport.slug)}, ${facility.location.city}`;
    const description = facility.description
      ? facility.description.slice(0, 155)
      : `${facility.name} — ${getSportFacilityType(sport.slug)} v ${facility.location.city}. Adresa, kontakt, otevírací doba a recenze na hraju.cz.`;
    const url = `https://www.hraju.cz/sport/${sportSlug}/${slug}`;

    const primaryImage = facility.images?.find((img: { isPrimary: boolean }) => img.isPrimary) ?? facility.images?.[0];
    const dynamicOgUrl = `/api/og?${new URLSearchParams({
      title: facility.name,
      subtitle: `${sport.nameCs} · ${facility.location.city}`,
      icon: sport.icon,
      type: "facility",
      ...(facility.averageRating ? { rating: facility.averageRating.toFixed(1) } : {}),
    }).toString()}`;
    const ogImage = primaryImage?.url
      ? { url: primaryImage.url, alt: primaryImage.alt ?? facility.name }
      : { url: dynamicOgUrl, width: 1200, height: 630, alt: `${facility.name} — hraju.cz` };

    return {
      title,
      description,
      openGraph: {
        title: `${facility.name} — ${sport.nameCs}, ${facility.location.city}`,
        description,
        url,
        type: "website",
        siteName: "hraju.cz",
        locale: "cs_CZ",
        images: [ogImage],
      },
      twitter: {
        card: "summary_large_image",
        title: `${facility.name} — ${sport.nameCs}`,
        description,
      },
      alternates: { canonical: url },
    };
  }

  // Try city landing page
  const { facilities: cityFacilities, cityName } = await getFacilitiesByCityAndSport(slug, sport.slug);
  if (cityName && cityFacilities.length >= 2) {
    const n = cityFacilities.length;
    // Praha special: "Tenisové kurty v Praze" style title
    const isPraha = slug === "praha";
    const title = isPraha
      ? `${sport.nameCs} Praha — ${n} sportovišť`
      : `${sport.nameCs} ${cityName} — ${n} sportovišť`;
    const description = isPraha
      ? `Najděte ${n} ${getSportFacilityTypePluralGenitive(sport.slug)} v Praze. Přehled podle městských částí, kontakty a otevírací doby.`
      : `Najděte ${n} ${getSportFacilityTypePluralGenitive(sport.slug)} ${getCityInPhrase(cityName)}. Otevírací doby, ceny, kontakty.`;
    const url = `https://www.hraju.cz/sport/${sportSlug}/${slug}`;

    return {
      title,
      description,
      openGraph: { title, description, url, type: "website", siteName: "hraju.cz", locale: "cs_CZ", images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `${sport.nameCs} ${cityName} — hraju.cz` }] },
      twitter: { card: "summary_large_image" },
      alternates: { canonical: url },
    };
  }

  return {};
}

const CONTACT_ICONS: Record<string, React.ReactNode> = {
  PHONE: <Phone className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  WEBSITE: <Globe className="h-4 w-4" />,
  FACEBOOK: <Globe className="h-4 w-4" />,
  INSTAGRAM: <Globe className="h-4 w-4" />,
};


export default async function FacilityPage({ params }: FacilityPageProps) {
  const { sport: sportSlug, slug } = await params;
  const sport = getSportBySlug(sportSlug);
  const { facility, isLive } = await getFacilityBySlug(slug);

  if (!sport) {
    notFound();
  }

  // Deactivated facility from DB (DB doesn't filter by isActive) — redirect to city listing
  if (facility && !facility.isActive) {
    const regionInfo = facility.location.region ? getRegionByName(facility.location.region) : null;
    redirect(regionInfo
      ? `/sport/${sportSlug}/kraj/${regionInfo.slug}/${cityToSlug(facility.location.city)}`
      : `/sport/${sportSlug}`
    );
  }

  // No facility found — try city landing page, then inactive redirect, then 404
  if (!facility) {
    // Try city landing page (only for cities with 2+ facilities)
    const { facilities: cityFacilities, cityName, districts } = await getFacilitiesByCityAndSport(slug, sport.slug);
    if (cityName && cityFacilities.length >= 2) {
      return (
        <CityLandingContent
          sport={sport}
          sportSlug={sportSlug}
          cityName={cityName}
          citySlug={slug}
          facilities={cityFacilities}
          districts={districts}
        />
      );
    }

    // Check if it's a deactivated facility in static data
    const info = getInactiveFacilityRedirectInfo(slug);
    if (info) {
      const regionInfo = info.region ? getRegionByName(info.region) : null;
      redirect(regionInfo
        ? `/sport/${sportSlug}/kraj/${regionInfo.slug}/${cityToSlug(info.city)}`
        : `/sport/${sportSlug}`
      );
    }
    notFound();
  }

  // Resolve coordinates: use DB values if available, otherwise geocode via Nominatim (OSM, free)
  let mapLat = facility.lat;
  let mapLng = facility.lng;
  if (!mapLat || !mapLng) {
    try {
      const geocodeQuery = `${facility.address}, ${facility.location.city}, Czech Republic`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(geocodeQuery)}&format=json&limit=1&countrycodes=cz`,
        {
          headers: { "User-Agent": "hraju.cz/1.0 (info@hraju.cz)" },
          next: { revalidate: 86400 }, // cache geocode result for 24h
        }
      );
      const results: { lat: string; lon: string }[] = await res.json();
      if (results[0]) {
        mapLat = parseFloat(results[0].lat);
        mapLng = parseFloat(results[0].lon);
      }
    } catch {
      // Geocoding failed — fall back to placeholder map
    }
  }

  // Map link for "Open map" button
  const mapLinkUrl =
    mapLat && mapLng
      ? `https://mapy.cz/zakladni?x=${mapLng}&y=${mapLat}&z=16`
      : `https://mapy.cz/zakladni?q=${encodeURIComponent(facility.address + ", " + facility.location.city)}`;
  const openingHours = facility.openingHours as Record<string, string> | null;

  // Region/city for breadcrumb links
  const regionInfo = facility.location.region ? getRegionByName(facility.location.region) : null;
  const citySl = cityToSlug(facility.location.city);

  // Related facilities (GPS distance when available, then city/region fallback)
  const { facilities: relatedFacilities, isMixed: relatedIsMixed } = await getRelatedFacilities(sportSlug, facility.location.city, facility.location.region, slug, 6, mapLat, mapLng);

  // Related blog posts for this sport
  const relatedBlogPosts = getPostsBySport(sportSlug).slice(0, 3);

  // Top tips for inline display above review form
  const topTips = await prisma.facilityTip.findMany({
    where: { facilityId: facility.id, isApproved: true },
    orderBy: { helpful: "desc" },
    take: 4,
    select: { id: true, text: true, helpful: true, user: { select: { name: true } } },
  });

  // Track page view (fire-and-forget)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  prisma.facilityView.upsert({
    where: { facilityId_date: { facilityId: facility.id, date: today } },
    update: { views: { increment: 1 } },
    create: { facilityId: facility.id, date: today, views: 1 },
  }).catch(() => {});

  // Query star distribution for AggregateRating component + Schema.org
  const [starDistribution, recentApprovedReviews, userPhotos] = await Promise.all([
    prisma.review.groupBy({
      by: ["rating"],
      where: { facilityId: facility.id, isApproved: true },
      _count: { rating: true },
    }),
    prisma.review.findMany({
      where: { facilityId: facility.id, isApproved: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        authorName: true,
        rating: true,
        title: true,
        text: true,
        createdAt: true,
        replies: {
          select: {
            body: true,
            createdAt: true,
            user: { select: { name: true } },
          },
          orderBy: { createdAt: "asc" },
          take: 5,
        },
      },
    }),
    prisma.userPhoto.findMany({
      where: { facilityId: facility.id, isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { url: true },
    }),
  ]);

  // Build distribution array [1star, 2star, 3star, 4star, 5star]
  const distribution = [0, 0, 0, 0, 0];
  for (const row of starDistribution) {
    if (row.rating >= 1 && row.rating <= 5) {
      distribution[row.rating - 1] = row._count.rating;
    }
  }

  // Build JSON-LD LocalBusiness structured data for SEO
  const phone = facility.isClaimed
    ? facility.contacts.find((c) => c.type === "PHONE")?.value
    : undefined;
  const email = facility.isClaimed
    ? facility.contacts.find((c) => c.type === "EMAIL")?.value
    : undefined;
  const primaryImage = facility.images?.find((img) => img.isPrimary) ?? facility.images?.[0];

  // Sport-specific schema.org types — use array with LocalBusiness for rich results
  const sportTypeMap: Record<string, string> = {
    tenis: "TennisComplex",
    golf: "GolfCourse",
    fitness: "ExerciseGym",
  };
  const specificType = sportTypeMap[sportSlug] ?? "SportsActivityLocation";
  const schemaType = ["LocalBusiness", specificType];

  // Parse opening hours into schema.org OpeningHoursSpecification
  const czDayToSchemaDay: Record<string, string> = {
    po: "Monday",
    út: "Tuesday",
    st: "Wednesday",
    čt: "Thursday",
    pá: "Friday",
    so: "Saturday",
    ne: "Sunday",
  };
  const openingHoursSpecs: Record<string, unknown>[] = [];
  if (openingHours) {
    for (const [day, hours] of Object.entries(openingHours)) {
      const schemaDay = czDayToSchemaDay[day];
      if (!schemaDay || !hours) continue;
      const match = hours.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
      if (match) {
        openingHoursSpecs.push({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: schemaDay,
          opens: match[1],
          closes: match[2],
        });
      }
    }
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: facility.name,
    url: `https://www.hraju.cz/sport/${sportSlug}/${slug}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: facility.address,
      addressLocality: facility.location.city,
      ...(facility.location.region && { addressRegion: facility.location.region }),
      ...(facility.postalCode && { postalCode: facility.postalCode }),
      addressCountry: "CZ",
    },
    ...(facility.description && { description: facility.description }),
    ...(phone && { telephone: phone }),
    ...(email && { email }),
    ...(facility.website && { sameAs: facility.website }),
    ...((primaryImage || userPhotos.length > 0) && {
      image: [
        ...(primaryImage ? [`https://www.hraju.cz${primaryImage.url}`] : []),
        ...userPhotos.map((p) => `https://www.hraju.cz${p.url}`),
      ],
    }),
    ...(mapLat && mapLng && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: mapLat,
        longitude: mapLng,
      },
    }),
    ...(facility.sports.length > 0 && {
      sport: facility.sports.map((s) => s.sport.nameCs),
    }),
    ...(openingHoursSpecs.length > 0 && {
      openingHoursSpecification: openingHoursSpecs,
    }),
    isAccessibleForFree: false,
    // Schema.org AggregateRating for Google rich snippets (stars in SERPs)
    ...(facility.averageRating != null && facility.reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: facility.averageRating.toFixed(1),
        bestRating: "5",
        worstRating: "1",
        reviewCount: facility.reviewCount,
      },
    }),
    // Schema.org Review markup for individual reviews
    ...(recentApprovedReviews.length > 0 && {
      review: recentApprovedReviews.map((r) => ({
        "@type": "Review",
        author: {
          "@type": "Person",
          name: r.authorName,
        },
        datePublished: new Date(r.createdAt).toISOString().split("T")[0],
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
        ...(r.title && { name: r.title }),
        ...(r.text && { reviewBody: r.text }),
        ...(r.replies.length > 0 && {
          comment: r.replies.map((reply) => ({
            "@type": "Comment",
            author: {
              "@type": "Person",
              name: reply.user.name || "Uživatel",
            },
            datePublished: new Date(reply.createdAt).toISOString().split("T")[0],
            text: reply.body,
          })),
        }),
      })),
    }),
  };

  // BreadcrumbList structured data for SEO
  const breadcrumbItems = [
    { name: "hraju.cz", url: "https://www.hraju.cz" },
    { name: sport.nameCs, url: `https://www.hraju.cz/sport/${sportSlug}` },
    ...(regionInfo
      ? [
          { name: regionInfo.name, url: `https://www.hraju.cz/sport/${sportSlug}/kraj/${regionInfo.slug}` },
          { name: facility.location.city, url: `https://www.hraju.cz/sport/${sportSlug}/kraj/${regionInfo.slug}/${citySl}` },
        ]
      : []),
    { name: facility.name, url: `https://www.hraju.cz/sport/${sportSlug}/${slug}` },
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <TrackPageView
        eventName="facility_view"
        params={{ sport: sport.slug, city: facility.location.city, facilitySlug: facility.slug }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {/* Header */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <Link
              href="/"
              className="font-extrabold text-zinc-900 hover:text-emerald-600"
            >
              hraju
              <span className="text-emerald-600">.cz</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <Link
              href={`/sport/${sportSlug}`}
              className="flex items-center gap-1 hover:text-zinc-900"
            >
              {sport.icon} {sport.nameCs}
            </Link>
            {regionInfo && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
                <Link
                  href={`/sport/${sportSlug}/kraj/${regionInfo.slug}`}
                  className="hover:text-zinc-900"
                >
                  {regionInfo.name}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
                <Link
                  href={`/sport/${sportSlug}/kraj/${regionInfo.slug}/${citySl}`}
                  className="hover:text-zinc-900"
                >
                  {facility.location.city}
                </Link>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <span className="truncate font-medium text-zinc-900">
              {facility.name}
            </span>
          </div>
          {!isLive && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
              ukázková data
            </span>
          )}
        </div>
      </nav>

      {/* Facility Header */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-wrap items-start gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              {facility.name}
            </h1>
            {facility.isClaimed && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ověřeno
              </span>
            )}
            {facility.isPremium && (
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
                Premium
              </span>
            )}
            {facility.averageRating != null && facility.reviewCount > 0 && (
              <StarRating rating={facility.averageRating} count={facility.reviewCount} size="md" />
            )}
            <OwnerEditButton facilityId={facility.id} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-zinc-400" />
              {facility.address}, {facility.location.city}
              {facility.location.region && `, ${facility.location.region}`}
            </span>
            {facility.courtsLanes != null && (
              <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                {facility.courtsLanes}{" "}
                {facility.courtsLanes === 1
                  ? "kurt"
                  : facility.courtsLanes >= 2 && facility.courtsLanes <= 4
                    ? "kurty"
                    : "kurtů"}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {facility.sports.map((s) => (
              <Link
                key={s.sport.slug}
                href={`/sport/${s.sport.slug}`}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200"
              >
                {s.sport.icon} {s.sport.nameCs}
              </Link>
            ))}
          </div>

          {/* Check-in & favorite buttons */}
          <div className="mt-4 space-y-2">
            <CheckInButton facilityId={facility.id} currentPath={`/sport/${sportSlug}/${slug}`} facilityName={facility.name} />
            <div className="flex items-center rounded-xl border border-zinc-100 bg-white px-4 py-2">
              <FavoriteButton facilityId={facility.id} currentPath={`/sport/${sportSlug}/${slug}`} />
            </div>
          </div>
        </div>
      </section>

      {/* Facility Images */}
      <section className="border-b border-zinc-100 bg-white">
        <PhotoGallery
          images={facility.images}
          facilityName={facility.name}
        />
      </section>

      {/* Content Grid */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            {facility.description && (
              <section className="rounded-2xl border border-zinc-100 bg-white p-6">
                <p className="leading-relaxed text-zinc-700">
                  {facility.description}
                </p>
              </section>
            )}

            {/* Map */}
            <section className="rounded-2xl border border-zinc-100 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
                <MapPin className="h-5 w-5 text-emerald-500" />
                Mapa
              </h2>
              {mapLat && mapLng ? (
                <div>
                  <FacilityMap
                    markers={[{
                      lat: mapLat,
                      lng: mapLng,
                      name: facility.name,
                      address: `${facility.address}, ${facility.location.city}`,
                      url: `/sport/${sportSlug}/${slug}`,
                    }]}
                    className="h-[300px] w-full rounded-xl border border-zinc-200"
                  />
                  <p className="mt-2 text-right">
                    <a
                      href={mapLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Otevřít na Mapy.cz
                    </a>
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl">
                  <a
                    href={mapLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block"
                  >
                    <div className="relative h-[300px] w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
                      <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: `
                          linear-gradient(rgba(16,185,129,0.15) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(16,185,129,0.15) 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px',
                      }} />
                      <div className="absolute left-0 right-0 top-1/2 h-px bg-emerald-200/60" />
                      <div className="absolute bottom-0 left-1/3 top-0 w-px bg-emerald-200/60" />
                      <div className="absolute bottom-0 right-1/4 top-0 w-px bg-emerald-200/40" />
                      <div className="absolute left-0 right-0 top-1/3 h-px bg-emerald-200/40" />
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
                        <div className="flex flex-col items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-200">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div className="h-2 w-2 -mt-1 rotate-45 bg-emerald-600" />
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/90 to-transparent px-4 pb-4 pt-10">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-zinc-900">
                              {facility.address}
                            </div>
                            <div className="mt-0.5 text-xs text-zinc-500">
                              {facility.location.city}
                              {facility.location.region && `, ${facility.location.region}`}
                            </div>
                          </div>
                          <span className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition group-hover:bg-emerald-50">
                            <Navigation className="h-3.5 w-3.5" />
                            Otevřít na Mapy.cz
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              )}
            </section>

            {/* Opening Hours */}
            <section className="rounded-2xl border border-zinc-100 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
                <Clock className="h-5 w-5 text-emerald-500" />
                Otevírací doba
              </h2>
              {openingHours ? (
                <OpeningHoursDisplay hours={openingHours} />
              ) : (
                <div className="rounded-xl bg-zinc-50/50 p-4 text-center">
                  <p className="text-sm text-zinc-500">
                    Otevírací doba není k dispozici.
                  </p>
                  {!facility.isClaimed && isSportClaimable(sportSlug) && (
                    <Link
                      href="/moje-sportoviste"
                      className="mt-2 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Jste provozovatel? Přidejte otevírací dobu &rarr;
                    </Link>
                  )}
                </div>
              )}
            </section>

            {/* Pricing */}
            {facility.pricing && (
              <section className="rounded-2xl border border-zinc-100 bg-white p-6">
                <h2 className="mb-4 text-lg font-bold text-zinc-900">Ceny</h2>
                <div className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 whitespace-pre-line">
                  {facility.pricing}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Contacts */}
            {(() => {
              const visibleContacts = facility.isClaimed
                ? facility.contacts
                : facility.contacts.filter((c) => c.type !== "PHONE" && c.type !== "EMAIL");
              return visibleContacts.length > 0 ? (
              <div className="rounded-2xl border border-zinc-100 bg-white p-5">
                <h3 className="mb-4 font-bold text-zinc-900">Kontakt</h3>
                <ul className="space-y-3">
                  {visibleContacts.map((contact) => (
                    <li
                      key={contact.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-400">
                        {CONTACT_ICONS[contact.type] ?? (
                          <Phone className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        {contact.label && (
                          <div className="text-xs text-zinc-400">
                            {contact.label}
                          </div>
                        )}
                        {contact.type === "PHONE" ? (
                          <TrackClick eventName="outbound_click" params={{ type: "phone", facilitySlug: facility.slug }}>
                            <a
                              href={`tel:${contact.value}`}
                              className="font-medium text-zinc-700 hover:text-emerald-600"
                            >
                              {contact.value}
                            </a>
                          </TrackClick>
                        ) : contact.type === "EMAIL" ? (
                          <TrackClick eventName="outbound_click" params={{ type: "email", facilitySlug: facility.slug }}>
                            <a
                              href={`mailto:${contact.value}`}
                              className="truncate font-medium text-zinc-700 hover:text-emerald-600"
                            >
                              {contact.value}
                            </a>
                          </TrackClick>
                        ) : (
                          <TrackClick eventName="outbound_click" params={{ type: "website", facilitySlug: facility.slug }}>
                            <a
                              href={contact.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate font-medium text-zinc-700 hover:text-emerald-600"
                            >
                              {contact.value}
                            </a>
                          </TrackClick>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              ) : null;
            })()}

            {/* Booking CTA */}
            {facility.bookingUrl && (
              <TrackClick eventName="outbound_click" params={{ type: "booking", facilitySlug: facility.slug }}>
                <a
                  href={facility.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 hover:shadow-emerald-300"
                >
                  <CalendarCheck className="h-5 w-5" />
                  Rezervovat
                  <ExternalLink className="ml-1 h-3.5 w-3.5 opacity-70" />
                </a>
              </TrackClick>
            )}

            {/* Quick Actions */}
            <div className="space-y-2">
              {facility.website && (
                <TrackClick eventName="outbound_click" params={{ type: "website", facilitySlug: facility.slug }}>
                  <a
                    href={facility.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 text-sm font-medium text-zinc-700 transition hover:border-emerald-200 hover:shadow-sm"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Globe className="h-4 w-4" />
                    </div>
                    Webové stránky
                    <ExternalLink className="ml-auto h-3.5 w-3.5 text-zinc-400" />
                  </a>
                </TrackClick>
              )}

              <a
                href={mapLat && mapLng
                  ? `https://www.google.com/maps/dir/?api=1&destination=${mapLat},${mapLng}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(facility.address + ", " + facility.location.city)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 text-sm font-medium text-zinc-700 transition hover:border-emerald-200 hover:shadow-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <Navigation className="h-4 w-4" />
                </div>
                Navigovat
                <ExternalLink className="ml-auto h-3.5 w-3.5 text-zinc-400" />
              </a>

              <div className="rounded-2xl border border-zinc-100 bg-white p-4">
                <p className="mb-3 text-xs font-semibold text-zinc-500">Sdílet</p>
                <SocialShareBar
                  title={`${facility.name} — ${sport.nameCs} v ${facility.location.city} | hraju.cz`}
                  url={`https://www.hraju.cz/sport/${sportSlug}/${slug}`}
                  compact
                />
              </div>
            </div>

            {/* Internal Links: City & Sport pages */}
            <div className="rounded-2xl border border-zinc-100 bg-white p-5">
              <h3 className="mb-3 font-bold text-zinc-900">Prozkoumejte okolí</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href={`/sport/${sportSlug}/${citySl}`}
                    className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    <MapPin className="h-4 w-4" />
                    {sport.nameCs} v {facility.location.city}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/mesto/${citySl}`}
                    className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    <MapPin className="h-4 w-4" />
                    Všechny sporty v {facility.location.city}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/sport/${sportSlug}`}
                    className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    {sport.icon}{" "}
                    {sport.nameCs} v celé ČR
                  </Link>
                </li>
                {regionInfo && getGuideBySlug(sportSlug, `nejlepsi-v-${regionInfo.slug}`) && (
                  <li>
                    <Link
                      href={`/pruvodce/${sportSlug}/nejlepsi-v-${regionInfo.slug}`}
                      className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                      Průvodce: {sport.nameCs} v {regionInfo.name.replace(" kraj", "").replace("Kraj ", "")}
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Amenities */}
            {facility.amenities.length > 0 && (
              <div className="rounded-2xl border border-zinc-100 bg-white p-5">
                <h3 className="mb-4 font-bold text-zinc-900">Vybavení</h3>
                <ul className="space-y-2">
                  {facility.amenities.map((a) => (
                    <li
                      key={a.amenity.slug}
                      className="flex items-center gap-3 text-sm text-zinc-600"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 text-base">
                        {a.amenity.icon}
                      </span>
                      {a.amenity.nameCs}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Claim CTA / Verified Badge / Owner Login Prompt */}
            {!facility.isClaimed && !isSportClaimable(sportSlug) ? null : !facility.isClaimed ? (
              <TrackClick eventName="facility_claim_click" params={{ facilitySlug: facility.slug, sport: sportSlug, city: facility.location.city }}>
                <Link
                  href="/moje-sportoviste"
                  className="block rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-5 text-center transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <Building2 className="mx-auto h-8 w-8 text-emerald-500" />
                  <p className="mt-2 text-sm font-semibold text-zinc-900">
                    Jste provozovatel?
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Převezměte svůj profil a získejte kontrolu nad svým zápisem.
                  </p>
                  <span className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700">
                    Převzít sportoviště
                  </span>
                </Link>
              </TrackClick>
            ) : (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Ověřený provozovatel
                    </p>
                    <p className="text-xs text-emerald-600">
                      Údaje spravuje provozovatel sportoviště.
                    </p>
                  </div>
                </div>
                <Link
                  href="/moje-sportoviste"
                  className="mt-3 block text-center text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  Jste majitel? Přihlaste se pro úpravy &rarr;
                </Link>
              </div>
            )}

            <OwnerUpgradeCTA
              facilityId={facility.id}
              isClaimed={facility.isClaimed}
              isPremium={facility.isPremium}
              isClaimable={isSportClaimable(sportSlug)}
            />

            {/* Edit Suggestion */}
            <EditSuggestionForm
              facilityId={facility.id}
              facilityName={facility.name}
            />

            {/* Sidebar Banner + Ad (hidden for premium facilities) */}
            {!facility.isPremium && (
              <>
                <BannerSlot placement="detail_sidebar" sport={sportSlug} className="mt-4" />
                <AdSlot slot="1234567894" format="rectangle" className="mt-4" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* "Have you been here?" CTA */}
      <section className="border-t border-zinc-100 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
            {sport.icon}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-zinc-900">
              Byli jste tady?
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Podělte se o svůj zážitek — napište recenzi nebo se přihlaste jako návštěvník. Pomůžete ostatním při výběru sportoviště.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <CheckInButton facilityId={facility.id} currentPath={`/sport/${sportSlug}/${slug}`} facilityName={facility.name} />
            <a
              href="#recenze"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <CalendarCheck className="h-4 w-4" />
              Napsat recenzi
            </a>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="recenze" className="border-t border-zinc-100 bg-white scroll-mt-4">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h2 className="mb-6 text-xl font-bold text-zinc-900">
            Recenze
          </h2>

          {/* Aggregate rating summary */}
          {facility.averageRating != null && facility.reviewCount > 0 && (
            <div className="mb-8 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6">
              <AggregateRating
                averageRating={facility.averageRating}
                reviewCount={facility.reviewCount}
                distribution={distribution}
              />
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ReviewList facilityId={facility.id} facilityUrl={`https://www.hraju.cz/sport/${sportSlug}/${slug}`} />
            </div>
            <div>
              {/* Inline top tips */}
              {topTips.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold text-zinc-700">
                    Tipy od návštěvníků
                  </h3>
                  <div className="space-y-2">
                    {topTips.map((tip) => (
                      <div key={tip.id} className="flex items-start gap-2 rounded-lg bg-amber-50/60 px-3 py-2 text-xs text-zinc-600">
                        <span className="mt-0.5 shrink-0">💡</span>
                        <span>{tip.text}</span>
                      </div>
                    ))}
                  </div>
                  <a
                    href="#tipy"
                    className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Všechny tipy &darr;
                  </a>
                </div>
              )}
              <h3 className="mb-3 text-sm font-semibold text-zinc-700">
                Napsat recenzi
              </h3>
              <ReviewForm facilityId={facility.id} currentPath={`/sport/${sportSlug}/${slug}`} facilityName={facility.name} facilityUrl={`https://www.hraju.cz/sport/${sportSlug}/${slug}`} />
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section id="tipy" className="border-t border-zinc-100 bg-zinc-50/50 scroll-mt-4">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h2 className="mb-6 text-xl font-bold text-zinc-900">
            Tipy od návštěvníků
          </h2>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TipList facilityId={facility.id} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-zinc-700">
                Přidat tip
              </h3>
              <TipForm facilityId={facility.id} currentPath={`/sport/${sportSlug}/${slug}`} />
            </div>
          </div>
        </div>
      </section>

      {/* User Photos Gallery */}
      <section className="border-t border-zinc-100 bg-zinc-50/50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <FacilityGallery facilityId={facility.id} />
        </div>
      </section>

      {/* Related Blog Posts */}
      {relatedBlogPosts.length > 0 && (
        <section className="border-t border-zinc-100 bg-zinc-50/50">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <h2 className="mb-6 text-xl font-bold text-zinc-900">
              Články o {sport.nameCs.toLowerCase()}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedBlogPosts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white transition hover:border-zinc-200 hover:shadow-md"
                >
                  {p.image && (
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-bold text-zinc-900 group-hover:text-emerald-700">
                      {p.title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {new Date(p.date).toLocaleDateString("cs-CZ", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <p className="mt-4 text-right">
              <Link
                href={`/blog/sport/${sportSlug}`}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Všechny články o {sport.nameCs.toLowerCase()} &rarr;
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* Ad: below facility info, above related facilities (hidden for premium) */}
      {!facility.isPremium && (
      <div className="mx-auto max-w-6xl px-6 py-4">
        <AdSlot slot="1234567893" format="rectangle" />
      </div>
      )}

      {/* Related Facilities */}
      {relatedFacilities.length > 0 && (
        <section className="border-t border-zinc-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <h2 className="mb-6 text-xl font-bold text-zinc-900">
              {relatedIsMixed
                ? `Další ${sport.nameCs.toLowerCase()} sportoviště poblíž`
                : `Další ${sport.nameCs.toLowerCase()} v ${facility.location.city}`}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedFacilities.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/sport/${sportSlug}/${rel.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition hover:border-zinc-200 hover:shadow-sm"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                    {sport.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">
                      {rel.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {rel.location.city}
                      </span>
                      {rel.distanceKm != null && (
                        <span className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {rel.distanceKm < 1
                            ? `${Math.round(rel.distanceKm * 1000)} m`
                            : `${rel.distanceKm.toFixed(1)} km`}
                        </span>
                      )}
                      {rel.averageRating != null && rel.reviewCount > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <span>{"\u2605"}</span>
                          <span className="text-zinc-600">{rel.averageRating.toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
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
import { getSportBySlug } from "@/lib/sports";
import { getFacilityBySlug, getInactiveFacilityRedirectInfo, getFacilitiesByCityAndSport, getRelatedFacilities } from "@/lib/data";
import { getRegionByName, cityToSlug } from "@/lib/regions";
import { getSportFacilityType, getSportFacilityTypePluralGenitive } from "@/lib/seo";
import EditSuggestionForm from "@/components/EditSuggestionForm";
import { CityLandingContent } from "@/components/CityLandingContent";
import { PhotoGallery } from "@/components/PhotoGallery";
import { ShareButton } from "@/components/ShareButton";
import type { Metadata } from "next";

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
    const url = `https://hraju.cz/sport/${sportSlug}/${slug}`;

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
      },
      twitter: {
        card: "summary",
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
      : `Najděte ${n} ${getSportFacilityTypePluralGenitive(sport.slug)} v ${cityName}. Otevírací doby, ceny, kontakty.`;
    const url = `https://hraju.cz/sport/${sportSlug}/${slug}`;

    return {
      title,
      description,
      openGraph: { title, description, url, type: "website", siteName: "hraju.cz", locale: "cs_CZ" },
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

const DAY_LABELS: Record<string, string> = {
  po: "Pondělí",
  út: "Úterý",
  st: "Středa",
  čt: "Čtvrtek",
  pá: "Pátek",
  so: "Sobota",
  ne: "Neděle",
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

  // OpenStreetMap links — free, no API key required
  const osmLinkUrl =
    mapLat && mapLng
      ? `https://www.openstreetmap.org/?mlat=${mapLat}&mlon=${mapLng}&zoom=16`
      : `https://www.openstreetmap.org/search?query=${encodeURIComponent(facility.address)}`;
  const osmEmbedUrl =
    mapLat && mapLng
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${mapLng - 0.008},${mapLat - 0.005},${mapLng + 0.008},${mapLat + 0.005}&layer=mapnik&marker=${mapLat},${mapLng}`
      : null;
  const openingHours = facility.openingHours as Record<string, string> | null;

  // Region/city for breadcrumb links
  const regionInfo = facility.location.region ? getRegionByName(facility.location.region) : null;
  const citySl = cityToSlug(facility.location.city);

  // Related facilities in same city
  const relatedFacilities = await getRelatedFacilities(sportSlug, facility.location.city, slug, 5);

  // Build JSON-LD structured data for SEO
  const phone = facility.isClaimed
    ? facility.contacts.find((c) => c.type === "PHONE")?.value
    : undefined;
  const email = facility.contacts.find((c) => c.type === "EMAIL")?.value;
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: facility.name,
    url: `https://hraju.cz/sport/${sportSlug}/${slug}`,
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
  };

  // BreadcrumbList structured data for SEO
  const breadcrumbItems = [
    { name: "hraju.cz", url: "https://hraju.cz" },
    { name: sport.nameCs, url: `https://hraju.cz/sport/${sportSlug}` },
    ...(regionInfo
      ? [
          { name: regionInfo.name, url: `https://hraju.cz/sport/${sportSlug}/kraj/${regionInfo.slug}` },
          { name: facility.location.city, url: `https://hraju.cz/sport/${sportSlug}/kraj/${regionInfo.slug}/${citySl}` },
        ]
      : []),
    { name: facility.name, url: `https://hraju.cz/sport/${sportSlug}/${slug}` },
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
              {osmEmbedUrl ? (
                <div className="overflow-hidden rounded-xl">
                  <iframe
                    title={`Mapa — ${facility.name}`}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={osmEmbedUrl}
                  />
                  <p className="mt-1 text-right text-xs text-zinc-400">
                    © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-600">OpenStreetMap</a> přispěvatelé
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl">
                  {/* Address placeholder — no coordinates in DB */}
                  <a
                    href={osmLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block"
                  >
                    <div className="relative h-[300px] w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
                      {/* Grid pattern to suggest a map */}
                      <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: `
                          linear-gradient(rgba(16,185,129,0.15) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(16,185,129,0.15) 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px',
                      }} />
                      {/* Road-like lines */}
                      <div className="absolute left-0 right-0 top-1/2 h-px bg-emerald-200/60" />
                      <div className="absolute bottom-0 left-1/3 top-0 w-px bg-emerald-200/60" />
                      <div className="absolute bottom-0 right-1/4 top-0 w-px bg-emerald-200/40" />
                      <div className="absolute left-0 right-0 top-1/3 h-px bg-emerald-200/40" />

                      {/* Center pin */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
                        <div className="flex flex-col items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-200">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div className="h-2 w-2 -mt-1 rotate-45 bg-emerald-600" />
                        </div>
                      </div>

                      {/* Address overlay */}
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
                            Otevřít mapu
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              )}
            </section>

            {/* Opening Hours */}
            {openingHours && (
              <section className="rounded-2xl border border-zinc-100 bg-white p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
                  <Clock className="h-5 w-5 text-emerald-500" />
                  Otevírací doba
                </h2>
                <div className="divide-y divide-zinc-50 rounded-xl bg-zinc-50/50">
                  {Object.keys(DAY_LABELS).map((day) => {
                    const hours = openingHours[day];
                    if (!hours) return null;
                    return (
                      <div
                        key={day}
                        className="flex justify-between px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-zinc-600">
                          {DAY_LABELS[day]}
                        </span>
                        <span className="font-semibold text-zinc-900">
                          {hours}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

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
                : facility.contacts.filter((c) => c.type !== "PHONE");
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
                          <a
                            href={`tel:${contact.value}`}
                            className="font-medium text-zinc-700 hover:text-emerald-600"
                          >
                            {contact.value}
                          </a>
                        ) : contact.type === "EMAIL" ? (
                          <a
                            href={`mailto:${contact.value}`}
                            className="truncate font-medium text-zinc-700 hover:text-emerald-600"
                          >
                            {contact.value}
                          </a>
                        ) : (
                          <a
                            href={contact.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate font-medium text-zinc-700 hover:text-emerald-600"
                          >
                            {contact.value}
                          </a>
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
            )}

            {/* Quick Actions */}
            <div className="space-y-2">
              {facility.website && (
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

              <ShareButton
                title={`${facility.name} — ${sport.nameCs} v ${facility.location.city} | hraju.cz`}
                url={`https://hraju.cz/sport/${sportSlug}/${slug}`}
              />
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

            {/* Claim CTA / Verified Badge */}
            {!facility.isClaimed ? (
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
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
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
            )}

            {/* Edit Suggestion */}
            <EditSuggestionForm
              facilityId={facility.id}
              facilityName={facility.name}
            />
          </div>
        </div>
      </div>

      {/* Related Facilities */}
      {relatedFacilities.length > 0 && (
        <section className="border-t border-zinc-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <h2 className="mb-6 text-xl font-bold text-zinc-900">
              Další {sport.nameCs.toLowerCase()} v {facility.location.city}
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
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                      <MapPin className="h-3 w-3" />
                      {rel.address}
                    </p>
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

import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Mail, Globe, Clock, ExternalLink } from "lucide-react";
import { getSportBySubdomain } from "@/lib/sports";
import { getFacilityBySlug } from "@/lib/data";
import type { Metadata } from "next";

interface FacilityPageProps {
  params: Promise<{ sport: string; slug: string }>;
}

export async function generateMetadata({ params }: FacilityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { facility } = await getFacilityBySlug(slug);
  if (!facility) return {};
  return {
    title: `${facility.name} | hraju.cz`,
    description: facility.description ?? `${facility.name} — sportoviště na hraju.cz`,
  };
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
  const sport = getSportBySubdomain(sportSlug);
  const { facility, isLive } = await getFacilityBySlug(slug);

  if (!facility || !sport) {
    notFound();
  }

  const mapsQuery = encodeURIComponent(
    facility.googlePlaceId ? `place_id:${facility.googlePlaceId}` : facility.address
  );
  const mapsEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=GOOGLE_MAPS_API_KEY&q=${mapsQuery}`;
  const mapsLinkUrl = `https://maps.google.com/?q=${encodeURIComponent(facility.address)}`;

  const openingHours = facility.openingHours as Record<string, string> | null;

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-zinc-100 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Link href="/" className="hover:text-zinc-900">hraju.cz</Link>
            <span>/</span>
            <Link href={`/sport/${sportSlug}`} className="hover:text-zinc-900">
              {sport.icon} {sport.nameCs}
            </Link>
            <span>/</span>
            <span className="text-zinc-900">{facility.name}</span>
          </div>
          {!isLive && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              ukázková data
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Title row */}
        <div className="mb-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-zinc-900">{facility.name}</h1>
            {facility.isPremium && (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-600">
                Premium
              </span>
            )}
            {facility.isClaimed && (
              <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-600">
                ✓ Ověřeno
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {facility.address}, {facility.location.city}
              {facility.location.region && `, ${facility.location.region}`}
            </span>
            {facility.courtsLanes != null && (
              <span>
                {facility.courtsLanes} {facility.courtsLanes === 1 ? "kurt" : "kurtů"}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {facility.sports.map((s) => (
              <span
                key={s.sport.slug}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600"
              >
                {s.sport.icon} {s.sport.nameCs}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            {facility.description && (
              <section>
                <p className="text-zinc-700 leading-relaxed">{facility.description}</p>
              </section>
            )}

            {/* Map */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-zinc-900">Mapa</h2>
              {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                <div className="overflow-hidden rounded-2xl border border-zinc-100">
                  <iframe
                    title={`Mapa — ${facility.name}`}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${mapsQuery}&language=cs`}
                  />
                </div>
              ) : (
                <a
                  href={mapsLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-600 hover:bg-zinc-100"
                >
                  <MapPin className="h-4 w-4 text-indigo-500" />
                  <span>{facility.address}</span>
                  <ExternalLink className="ml-auto h-3.5 w-3.5" />
                </a>
              )}
            </section>

            {/* Opening hours */}
            {openingHours && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-zinc-900">
                  <Clock className="inline h-4 w-4 align-middle mr-1 text-zinc-400" />
                  Otevírací doba
                </h2>
                <div className="rounded-2xl border border-zinc-100 divide-y divide-zinc-50">
                  {Object.entries(openingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-zinc-600">{DAY_LABELS[day] ?? day}</span>
                      <span className="font-medium text-zinc-900">{hours}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pricing */}
            {facility.pricing && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-zinc-900">Ceny</h2>
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700 whitespace-pre-line">
                  {facility.pricing}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Contacts */}
            {facility.contacts.length > 0 && (
              <div className="rounded-2xl border border-zinc-100 p-4">
                <h3 className="mb-3 font-semibold text-zinc-900">Kontakt</h3>
                <ul className="space-y-2.5">
                  {facility.contacts.map((contact) => (
                    <li key={contact.id} className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-400">
                        {CONTACT_ICONS[contact.type] ?? <Phone className="h-4 w-4" />}
                      </span>
                      <div>
                        {contact.label && (
                          <div className="text-xs text-zinc-400">{contact.label}</div>
                        )}
                        {contact.type === "PHONE" ? (
                          <a href={`tel:${contact.value}`} className="text-zinc-700 hover:text-indigo-600">
                            {contact.value}
                          </a>
                        ) : contact.type === "EMAIL" ? (
                          <a href={`mailto:${contact.value}`} className="text-zinc-700 hover:text-indigo-600">
                            {contact.value}
                          </a>
                        ) : (
                          <a href={contact.value} target="_blank" rel="noopener noreferrer" className="text-zinc-700 hover:text-indigo-600">
                            {contact.value}
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Website */}
            {facility.website && (
              <a
                href={facility.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-2xl border border-zinc-100 p-4 text-sm text-indigo-600 hover:bg-indigo-50"
              >
                <Globe className="h-4 w-4" />
                Webové stránky
                <ExternalLink className="ml-auto h-3.5 w-3.5" />
              </a>
            )}

            {/* Directions */}
            <a
              href={mapsLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-600 hover:bg-zinc-100"
            >
              <MapPin className="h-4 w-4 text-indigo-500" />
              Navigovat
              <ExternalLink className="ml-auto h-3.5 w-3.5" />
            </a>

            {/* Amenities */}
            {facility.amenities.length > 0 && (
              <div className="rounded-2xl border border-zinc-100 p-4">
                <h3 className="mb-3 font-semibold text-zinc-900">Vybavení</h3>
                <ul className="space-y-1.5">
                  {facility.amenities.map((a) => (
                    <li key={a.amenity.slug} className="flex items-center gap-2 text-sm text-zinc-600">
                      <span>{a.amenity.icon}</span>
                      {a.amenity.nameCs}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

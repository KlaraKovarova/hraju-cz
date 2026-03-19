import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, ArrowRight, Clock } from "lucide-react";
import type { FacilityWithDetails } from "@/lib/data";

const DAY_KEYS = ["ne", "po", "út", "st", "čt", "pá", "so"] as const;

const HIGHLIGHT_AMENITIES = new Set(["showers", "locker-room", "parking"]);

function getTodayHours(
  openingHours: Record<string, string> | null,
): string | null {
  if (!openingHours) return null;
  const key = DAY_KEYS[new Date().getDay()];
  return openingHours[key] ?? null;
}

interface FacilityCardProps {
  facility: FacilityWithDetails;
  sportSlug: string;
}

export function FacilityCard({ facility, sportSlug }: FacilityCardProps) {
  const primaryContact = facility.contacts.find((c) => c.isPrimary);
  const todayHours = getTodayHours(
    facility.openingHours as Record<string, string> | null,
  );
  const primaryImage = facility.images?.find((img) => img.isPrimary) ?? facility.images?.[0];

  return (
    <Link
      href={`/sport/${sportSlug}/${facility.slug}`}
      className="group flex flex-col rounded-2xl border border-zinc-100 bg-white overflow-hidden transition-all hover:border-zinc-200 hover:shadow-lg hover:shadow-zinc-100"
    >
      {/* Primary image */}
      {primaryImage && (
        <div className="relative h-40 w-full overflow-hidden bg-zinc-100">
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt ?? facility.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
      {/* Top row: name + badges */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-zinc-900 group-hover:text-emerald-700">
            {facility.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <span className="truncate">
              {facility.address}, {facility.location.city}
            </span>
          </div>
        </div>
      </div>

      {/* Info pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        {facility.courtsLanes != null && (
          <span className="rounded-lg bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
            {facility.courtsLanes}{" "}
            {facility.courtsLanes === 1
              ? "kurt"
              : facility.courtsLanes >= 2 && facility.courtsLanes <= 4
                ? "kurty"
                : "kurtů"}
          </span>
        )}
        {facility.pricing && (
          <span className="max-w-48 truncate rounded-lg bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
            {facility.pricing}
          </span>
        )}
        {todayHours && (
          <span className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
            <Clock className="h-3 w-3 shrink-0" />
            Dnes: {todayHours}
          </span>
        )}
      </div>

      {/* Amenities */}
      {facility.amenities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {facility.amenities.slice(0, 5).map((a) => (
            <span
              key={a.amenity.slug}
              className={
                HIGHLIGHT_AMENITIES.has(a.amenity.slug)
                  ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                  : "rounded-full bg-zinc-50 px-2.5 py-1 text-xs text-zinc-500"
              }
            >
              {a.amenity.icon} {a.amenity.nameCs}
            </span>
          ))}
          {facility.amenities.length > 5 && (
            <span className="rounded-full bg-zinc-50 px-2.5 py-1 text-xs text-zinc-400">
              +{facility.amenities.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Contact + CTA */}
      <div className="mt-auto flex items-center justify-between border-t border-zinc-50 pt-3 mt-4">
        {primaryContact && facility.isClaimed ? (
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Phone className="h-3 w-3" />
            {primaryContact.value}
          </span>
        ) : (
          <span />
        )}
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">
          Detail <ArrowRight className="h-3 w-3" />
        </span>
      </div>
      </div>
    </Link>
  );
}

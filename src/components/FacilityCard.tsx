import Link from "next/link";
import { MapPin, Phone, Star, ArrowRight } from "lucide-react";
import type { FacilityWithDetails } from "@/lib/data";

interface FacilityCardProps {
  facility: FacilityWithDetails;
  sportSlug: string;
}

export function FacilityCard({ facility, sportSlug }: FacilityCardProps) {
  const primaryContact = facility.contacts.find((c) => c.isPrimary);

  return (
    <Link
      href={`/sport/${sportSlug}/${facility.slug}`}
      className="group flex flex-col rounded-2xl border border-zinc-100 bg-white p-5 transition-all hover:border-zinc-200 hover:shadow-lg hover:shadow-zinc-100"
    >
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
        {facility.isPremium && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            Premium
          </span>
        )}
      </div>

      {/* Info pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        {facility.courtsLanes != null && (
          <span className="rounded-lg bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
            {facility.courtsLanes}{" "}
            {facility.courtsLanes === 1 ? "kurt" : "kurtů"}
          </span>
        )}
        {facility.pricing && (
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
            {facility.pricing}
          </span>
        )}
      </div>

      {/* Amenities */}
      {facility.amenities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {facility.amenities.slice(0, 4).map((a) => (
            <span
              key={a.amenity.slug}
              className="rounded-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500"
            >
              {a.amenity.icon} {a.amenity.nameCs}
            </span>
          ))}
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
    </Link>
  );
}

import Link from "next/link";
import { MapPin, Clock, Phone } from "lucide-react";
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
      className="group flex flex-col rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-zinc-900 group-hover:text-indigo-700">
          {facility.name}
          {facility.isPremium && (
            <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
              Premium
            </span>
          )}
        </h3>
        {facility.courtsLanes != null && (
          <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500">
            {facility.courtsLanes} {facility.courtsLanes === 1 ? "kurt" : "kurtů"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 text-sm text-zinc-500">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {facility.address}, {facility.location.city}
        </span>

        {facility.pricing && (
          <span className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-zinc-400">Kč</span>
            {facility.pricing}
          </span>
        )}

        {primaryContact && (
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            {primaryContact.value}
          </span>
        )}
      </div>

      {facility.amenities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {facility.amenities.slice(0, 4).map((a) => (
            <span
              key={a.amenity.slug}
              className="rounded-full border border-zinc-100 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500"
            >
              {a.amenity.icon} {a.amenity.nameCs}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-3 text-xs font-medium text-indigo-600 group-hover:underline">
        Zobrazit detail →
      </div>
    </Link>
  );
}

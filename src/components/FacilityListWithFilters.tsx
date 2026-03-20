"use client";

import { useState, useMemo } from "react";
import { Filter } from "lucide-react";
import { FacilityCard } from "@/components/FacilityCard";
import type { FacilityWithDetails } from "@/lib/data";

interface AmenityOption {
  slug: string;
  nameCs: string;
  icon: string | null;
  count: number;
}

interface FacilityListWithFiltersProps {
  facilities: FacilityWithDetails[];
  sportSlug: string;
}

export function FacilityListWithFilters({
  facilities,
  sportSlug,
}: FacilityListWithFiltersProps) {
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(
    new Set(),
  );
  const [showFilters, setShowFilters] = useState(false);

  // Extract unique amenities from all facilities, sorted alphabetically
  const amenityOptions = useMemo<AmenityOption[]>(() => {
    const map = new Map<string, AmenityOption>();
    for (const f of facilities) {
      for (const fa of f.amenities) {
        const existing = map.get(fa.amenity.slug);
        if (existing) {
          existing.count++;
        } else {
          map.set(fa.amenity.slug, {
            slug: fa.amenity.slug,
            nameCs: fa.amenity.nameCs,
            icon: fa.amenity.icon,
            count: 1,
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.nameCs.localeCompare(b.nameCs, "cs"),
    );
  }, [facilities]);

  // Filter facilities based on selected amenities (AND logic)
  const filteredFacilities = useMemo(() => {
    if (selectedAmenities.size === 0) return facilities;
    return facilities.filter((f) => {
      const facilitySlugs = new Set(f.amenities.map((a) => a.amenity.slug));
      for (const slug of selectedAmenities) {
        if (!facilitySlugs.has(slug)) return false;
      }
      return true;
    });
  }, [facilities, selectedAmenities]);

  function toggleAmenity(slug: string) {
    setSelectedAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  if (amenityOptions.length === 0) {
    return (
      <>
        <div className="mb-4">
          <p className="text-sm text-zinc-500">
            {facilities.length} sportoviš&#357;
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              sportSlug={sportSlug}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {selectedAmenities.size > 0
            ? `${filteredFacilities.length} z ${facilities.length} sportovist\u0165`
            : `${facilities.length} sportovist\u0165`}
        </p>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
            showFilters || selectedAmenities.size > 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Vybaven&#237;
          {selectedAmenities.size > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
              {selectedAmenities.size}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 rounded-xl border border-zinc-100 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-zinc-900">
              Filtrovat podle vybaven&#237;
            </h4>
            {selectedAmenities.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedAmenities(new Set())}
                className="text-xs text-emerald-600 hover:text-emerald-700"
              >
                Zrušit filtry
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map((amenity) => {
              const isSelected = selectedAmenities.has(amenity.slug);
              return (
                <button
                  key={amenity.slug}
                  type="button"
                  onClick={() => toggleAmenity(amenity.slug)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                    isSelected
                      ? "bg-emerald-100 font-medium text-emerald-800"
                      : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {amenity.icon && <span>{amenity.icon}</span>}
                  {amenity.nameCs}
                  <span className="text-xs text-zinc-400">
                    ({amenity.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Facility Grid */}
      {filteredFacilities.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFacilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              sportSlug={sportSlug}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-100 bg-white p-8 text-center">
          <p className="text-sm text-zinc-500">
            Žádná sportoviště neodpovídají zvoleným filtrům.
          </p>
          <button
            type="button"
            onClick={() => setSelectedAmenities(new Set())}
            className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Zrušit filtry
          </button>
        </div>
      )}
    </>
  );
}

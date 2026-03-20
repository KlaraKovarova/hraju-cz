"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter, ArrowUpDown } from "lucide-react";
import { FacilityCard } from "@/components/FacilityCard";
import { Pagination } from "@/components/Pagination";
import type { FacilityWithDetails } from "@/lib/data";

const PAGE_SIZE = 20;

type SortOption = "name-asc" | "name-desc" | "rating" | "newest";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Název A-Z" },
  { value: "name-desc", label: "Název Z-A" },
  { value: "rating", label: "Hodnocení" },
  { value: "newest", label: "Nejnovější" },
];

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

function sortFacilities(
  facilities: FacilityWithDetails[],
  sort: SortOption,
): FacilityWithDetails[] {
  const sorted = [...facilities];
  switch (sort) {
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "cs"));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name, "cs"));
      break;
    case "rating":
      sorted.sort((a, b) => {
        const ra = a.averageRating ?? -1;
        const rb = b.averageRating ?? -1;
        if (rb !== ra) return rb - ra;
        return a.name.localeCompare(b.name, "cs");
      });
      break;
    case "newest":
      sorted.sort((a, b) => b.name.localeCompare(a.name, "cs"));
      break;
  }
  // Premium facilities always first
  sorted.sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0));
  return sorted;
}

export function FacilityListWithFilters({
  facilities,
  sportSlug,
}: FacilityListWithFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial values from URL
  const urlPage = parseInt(searchParams.get("page") || "1", 10);
  const urlSort = (searchParams.get("sort") as SortOption) || "name-asc";

  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(
    new Set(),
  );
  const [showFilters, setShowFilters] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>(
    SORT_OPTIONS.some((o) => o.value === urlSort) ? urlSort : "name-asc",
  );
  const [currentPage, setCurrentPage] = useState(
    urlPage >= 1 ? urlPage : 1,
  );

  // Update URL params
  const updateUrl = useCallback(
    (page: number, sort: SortOption) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page > 1) {
        params.set("page", String(page));
      } else {
        params.delete("page");
      }
      if (sort !== "name-asc") {
        params.set("sort", sort);
      } else {
        params.delete("sort");
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : window.location.pathname, {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  // Extract unique amenities from all facilities
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

  // Filter → Sort → Paginate
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

  const sortedFacilities = useMemo(
    () => sortFacilities(filteredFacilities, currentSort),
    [filteredFacilities, currentSort],
  );

  const totalPages = Math.max(1, Math.ceil(sortedFacilities.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedFacilities = sortedFacilities.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function handleSortChange(sort: SortOption) {
    setCurrentSort(sort);
    setCurrentPage(1);
    updateUrl(1, sort);
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
    updateUrl(page, currentSort);
    // Scroll to top of list
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
    setCurrentPage(1);
    updateUrl(1, currentSort);
  }

  function clearFilters() {
    setSelectedAmenities(new Set());
    setCurrentPage(1);
    updateUrl(1, currentSort);
  }

  return (
    <>
      {/* Toolbar: count, sort, filter */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {selectedAmenities.size > 0
            ? `${filteredFacilities.length} z ${facilities.length} sportovišť`
            : `${facilities.length} sportovišť`}
          {totalPages > 1 &&
            ` — strana ${safePage} z ${totalPages}`}
        </p>

        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={currentSort}
              onChange={(e) =>
                handleSortChange(e.target.value as SortOption)
              }
              className="appearance-none rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-8 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 focus:border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-200"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          </div>

          {/* Filter Toggle */}
          {amenityOptions.length > 0 && (
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
              Vybavení
              {selectedAmenities.size > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
                  {selectedAmenities.size}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && amenityOptions.length > 0 && (
        <div className="mb-6 rounded-xl border border-zinc-100 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-zinc-900">
              Filtrovat podle vybavení
            </h4>
            {selectedAmenities.size > 0 && (
              <button
                type="button"
                onClick={clearFilters}
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
      {paginatedFacilities.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedFacilities.map((facility) => (
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
            onClick={clearFilters}
            className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Zrušit filtry
          </button>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
}

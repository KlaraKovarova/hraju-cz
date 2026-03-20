"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter, ArrowUpDown, Star, Phone, Globe, MapPin, X } from "lucide-react";
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
  const urlDistrict = searchParams.get("district") || "";
  const urlMinRating = parseInt(searchParams.get("minRating") || "0", 10);
  const urlContact = searchParams.get("contact") === "1";
  const urlWebsite = searchParams.get("website") === "1";

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
  const [selectedDistrict, setSelectedDistrict] = useState(urlDistrict);
  const [minRating, setMinRating] = useState(
    urlMinRating >= 1 && urlMinRating <= 5 ? urlMinRating : 0,
  );
  const [hasContact, setHasContact] = useState(urlContact);
  const [hasWebsite, setHasWebsite] = useState(urlWebsite);

  // Count active filters
  const activeFilterCount =
    selectedAmenities.size +
    (selectedDistrict ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (hasContact ? 1 : 0) +
    (hasWebsite ? 1 : 0);

  // Update URL params
  const updateUrl = useCallback(
    (
      page: number,
      sort: SortOption,
      district: string,
      rating: number,
      contact: boolean,
      website: boolean,
    ) => {
      const params = new URLSearchParams();
      // Preserve q and sport params from search page
      const q = searchParams.get("q");
      const sp = searchParams.get("sport");
      if (q) params.set("q", q);
      if (sp) params.set("sport", sp);

      if (page > 1) params.set("page", String(page));
      if (sort !== "name-asc") params.set("sort", sort);
      if (district) params.set("district", district);
      if (rating > 0) params.set("minRating", String(rating));
      if (contact) params.set("contact", "1");
      if (website) params.set("website", "1");

      const qs = params.toString();
      router.replace(qs ? `?${qs}` : window.location.pathname, {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  function syncUrl(
    page: number,
    sort: SortOption = currentSort,
    district: string = selectedDistrict,
    rating: number = minRating,
    contact: boolean = hasContact,
    website: boolean = hasWebsite,
  ) {
    updateUrl(page, sort, district, rating, contact, website);
  }

  // Extract unique districts (location.city values)
  const districtOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of facilities) {
      map.set(f.location.city, (map.get(f.location.city) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => a.city.localeCompare(b.city, "cs"));
  }, [facilities]);

  const showDistrictFilter = districtOptions.length > 1;

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

  // Filter pipeline: district → rating → contact → website → amenities
  const filteredFacilities = useMemo(() => {
    let result = facilities;

    if (selectedDistrict) {
      result = result.filter((f) => f.location.city === selectedDistrict);
    }

    if (minRating > 0) {
      result = result.filter(
        (f) => f.averageRating != null && f.averageRating >= minRating,
      );
    }

    if (hasContact) {
      result = result.filter((f) =>
        f.contacts.some((c) => c.type === "PHONE" || c.type === "EMAIL"),
      );
    }

    if (hasWebsite) {
      result = result.filter(
        (f) => f.website || f.contacts.some((c) => c.type === "WEBSITE"),
      );
    }

    if (selectedAmenities.size > 0) {
      result = result.filter((f) => {
        const facilitySlugs = new Set(
          f.amenities.map((a) => a.amenity.slug),
        );
        for (const slug of selectedAmenities) {
          if (!facilitySlugs.has(slug)) return false;
        }
        return true;
      });
    }

    return result;
  }, [
    facilities,
    selectedDistrict,
    minRating,
    hasContact,
    hasWebsite,
    selectedAmenities,
  ]);

  const sortedFacilities = useMemo(
    () => sortFacilities(filteredFacilities, currentSort),
    [filteredFacilities, currentSort],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(sortedFacilities.length / PAGE_SIZE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedFacilities = sortedFacilities.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function handleSortChange(sort: SortOption) {
    setCurrentSort(sort);
    setCurrentPage(1);
    syncUrl(1, sort);
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
    syncUrl(page);
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
    syncUrl(1);
  }

  function handleDistrictChange(district: string) {
    setSelectedDistrict(district);
    setCurrentPage(1);
    syncUrl(1, currentSort, district);
  }

  function handleRatingChange(rating: number) {
    const newRating = rating === minRating ? 0 : rating;
    setMinRating(newRating);
    setCurrentPage(1);
    syncUrl(1, currentSort, selectedDistrict, newRating);
  }

  function handleContactToggle() {
    const next = !hasContact;
    setHasContact(next);
    setCurrentPage(1);
    syncUrl(1, currentSort, selectedDistrict, minRating, next);
  }

  function handleWebsiteToggle() {
    const next = !hasWebsite;
    setHasWebsite(next);
    setCurrentPage(1);
    syncUrl(1, currentSort, selectedDistrict, minRating, hasContact, next);
  }

  function clearAllFilters() {
    setSelectedAmenities(new Set());
    setSelectedDistrict("");
    setMinRating(0);
    setHasContact(false);
    setHasWebsite(false);
    setCurrentPage(1);
    syncUrl(1, currentSort, "", 0, false, false);
  }

  return (
    <>
      {/* Toolbar: count, sort, filter */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {activeFilterCount > 0
            ? `${filteredFacilities.length} z ${facilities.length} sportovišť`
            : `${facilities.length} sportovišť`}
          {totalPages > 1 && ` — strana ${safePage} z ${totalPages}`}
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
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              showFilters || activeFilterCount > 0
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filtry</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 rounded-xl border border-zinc-100 bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-zinc-900">Filtry</h4>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
              >
                <X className="h-3 w-3" />
                Zrušit vše ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Row 1: District + Rating */}
          <div className="flex flex-wrap gap-4">
            {/* District Filter */}
            {showDistrictFilter && (
              <div className="min-w-0">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                  <MapPin className="h-3 w-3" />
                  Městská část
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:border-zinc-300 focus:border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                >
                  <option value="">Všechny</option>
                  {districtOptions.map((d) => (
                    <option key={d.city} value={d.city}>
                      {d.city} ({d.count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Rating Filter */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <Star className="h-3 w-3" />
                Min. hodnocení
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRatingChange(rating)}
                    className={`flex items-center gap-0.5 rounded-lg border px-2.5 py-1.5 text-sm transition ${
                      minRating === rating
                        ? "border-amber-200 bg-amber-50 font-medium text-amber-700"
                        : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                    }`}
                  >
                    {rating}
                    <Star
                      className={`h-3 w-3 ${
                        minRating >= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Contact/Website toggles */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleContactToggle}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                hasContact
                  ? "bg-emerald-100 font-medium text-emerald-800"
                  : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              S kontaktem
            </button>
            <button
              type="button"
              onClick={handleWebsiteToggle}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                hasWebsite
                  ? "bg-emerald-100 font-medium text-emerald-800"
                  : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              S webem
            </button>
          </div>

          {/* Row 3: Amenities */}
          {amenityOptions.length > 0 && (
            <div>
              <label className="mb-1.5 text-xs font-medium text-zinc-500">
                Vybavení
              </label>
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
        </div>
      )}

      {/* Facility Grid */}
      {paginatedFacilities.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedFacilities.map((facility, i) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              sportSlug={sportSlug}
              priority={safePage === 1 && i < 4}
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
            onClick={clearAllFilters}
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

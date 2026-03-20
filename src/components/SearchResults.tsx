"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { FacilityCard } from "@/components/FacilityCard";
import { Pagination } from "@/components/Pagination";
import type { FacilityWithDetails } from "@/lib/data";

const PAGE_SIZE = 20;

type SortOption = "name-asc" | "name-desc" | "rating";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Název A-Z" },
  { value: "name-desc", label: "Název Z-A" },
  { value: "rating", label: "Hodnocení" },
];

export function SearchResults({
  facilities,
}: {
  facilities: FacilityWithDetails[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlPage = parseInt(searchParams.get("page") || "1", 10);
  const urlSort = (searchParams.get("sort") as SortOption) || "name-asc";

  const [currentSort, setCurrentSort] = useState<SortOption>(
    SORT_OPTIONS.some((o) => o.value === urlSort) ? urlSort : "name-asc",
  );
  const [currentPage, setCurrentPage] = useState(
    urlPage >= 1 ? urlPage : 1,
  );

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
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const sortedFacilities = useMemo(() => {
    const sorted = [...facilities];
    switch (currentSort) {
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
    }
    sorted.sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0));
    return sorted;
  }, [facilities, currentSort]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedFacilities.length / PAGE_SIZE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedFacilities = sortedFacilities.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <>
      {/* Sort + count */}
      {facilities.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            {facilities.length} sportovišť
            {totalPages > 1 && ` — strana ${safePage} z ${totalPages}`}
          </p>
          <div className="relative">
            <select
              value={currentSort}
              onChange={(e) => {
                const sort = e.target.value as SortOption;
                setCurrentSort(sort);
                setCurrentPage(1);
                updateUrl(1, sort);
              }}
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
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paginatedFacilities.map((facility, i) => (
          <FacilityCard
            key={facility.id}
            facility={facility}
            sportSlug={facility.sports[0]?.sport.slug || "tenis"}
            priority={safePage === 1 && i < 4}
          />
        ))}
      </div>

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={(page) => {
          setCurrentPage(page);
          updateUrl(page, currentSort);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </>
  );
}

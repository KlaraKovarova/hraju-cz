"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { ReviewCard } from "./ReviewCard";

type SortOption = "newest" | "oldest" | "highest" | "lowest" | "helpful";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Nejnovější",
  oldest: "Nejstarší",
  highest: "Nejvyšší hodnocení",
  lowest: "Nejnižší hodnocení",
  helpful: "Nejužitečnější",
};

interface Review {
  id: string;
  userId?: string | null;
  authorName: string;
  rating: number;
  title: string | null;
  text: string | null;
  helpful: number;
  createdAt: string;
}

interface ReviewListProps {
  facilityId: string;
  /** Full URL for sharing (e.g. https://www.hraju.cz/sport/tenis/slug) */
  facilityUrl?: string;
  /** Number of reviews per page */
  perPage?: number;
}

export function ReviewList({ facilityId, facilityUrl, perPage = 10 }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/facilities/${facilityId}/reviews?page=${page}&limit=${perPage}&sort=${sort}`
      );
      const data = await res.json();
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [facilityId, page, perPage, sort]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Reset to page 1 when sort changes
  function handleSortChange(newSort: SortOption) {
    setSort(newSort);
    setPage(1);
  }

  if (loading && reviews.length === 0) {
    return <p className="text-sm text-zinc-400">Načítání recenzí...</p>;
  }

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center">
        <MessageSquare className="mx-auto h-8 w-8 text-zinc-300" />
        <p className="mt-2 text-sm font-medium text-zinc-500">
          Zatím žádné recenze
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Buďte první, kdo ohodnotí toto sportoviště
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort controls */}
      {total > 1 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">Řadit:</span>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSortChange(key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  sort === key
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {SORT_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Review cards */}
      <div className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            id={review.id}
            facilityId={facilityId}
            facilityUrl={facilityUrl}
            userId={review.userId}
            authorName={review.authorName}
            rating={review.rating}
            title={review.title}
            text={review.text}
            helpful={review.helpful}
            createdAt={review.createdAt}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
            Předchozí
          </button>
          <span className="text-xs text-zinc-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            Další
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

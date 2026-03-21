"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Star, ChevronLeft, ChevronRight, User, ThumbsUp, MapPin, MessageSquare } from "lucide-react";
import { SPORTS } from "@/lib/sports";

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
  userId: string | null;
  authorName: string;
  rating: number;
  title: string | null;
  text: string | null;
  helpful: number;
  createdAt: string;
  facility: {
    id: string;
    name: string;
    slug: string;
    city: string;
    sport: string | null;
    sportNameCs: string | null;
  };
}

export function ReviewsHubClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const sport = searchParams.get("sport") || "";
  const sort = (searchParams.get("sort") as SortOption) || "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (sport) params.set("sport", sport);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", String(limit));

    try {
      const res = await fetch(`/api/reviews?${params}`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [sport, sort, page, limit]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    // Reset to page 1 when filter/sort changes
    if ("sport" in updates || "sort" in updates) {
      params.delete("page");
    }
    router.push(`/recenze?${params.toString()}`, { scroll: false });
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Sport filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-zinc-500">Sport:</span>
          <button
            type="button"
            onClick={() => updateParams({ sport: "" })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              !sport ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Všechny
          </button>
          {SPORTS.map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => updateParams({ sport: s.slug })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                sport === s.slug ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {s.icon} {s.nameCs}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-zinc-500">Řazení:</span>
          {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => updateParams({ sort: key })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                sort === key ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {SORT_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm text-zinc-500">
        {total > 0
          ? `${total} ${total === 1 ? "recenze" : total < 5 ? "recenze" : "recenzí"}`
          : "Žádné recenze k zobrazení"}
      </p>

      {/* Review cards */}
      <div className={`space-y-4 ${loading ? "opacity-60" : ""}`}>
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl border border-zinc-100 bg-white p-5 transition hover:border-zinc-200 hover:shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  {review.userId ? (
                    <Link
                      href={`/uzivatel/${review.userId}`}
                      className="text-sm font-semibold text-zinc-900 hover:text-emerald-600 hover:underline"
                    >
                      {review.authorName}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-zinc-900">
                      {review.authorName}
                    </span>
                  )}
                  <div className="mt-0.5 flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-zinc-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-zinc-400">
                      {new Date(review.createdAt).toLocaleDateString("cs-CZ", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              {review.helpful > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                  <ThumbsUp className="h-3 w-3" />
                  {review.helpful}
                </span>
              )}
            </div>

            {review.title && (
              <p className="mt-3 text-sm font-semibold text-zinc-800">
                {review.title}
              </p>
            )}

            {review.text && (
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                {review.text}
              </p>
            )}

            {/* Facility link */}
            <Link
              href={review.facility.sport ? `/sport/${review.facility.sport}/${review.facility.slug}` : `/recenze`}
              className="mt-3 flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm transition hover:bg-zinc-100"
            >
              <MapPin className="h-4 w-4 text-zinc-400" />
              <span className="font-medium text-zinc-700">{review.facility.name}</span>
              <span className="text-xs text-zinc-400">
                {review.facility.city}
                {review.facility.sportNameCs && ` \u00B7 ${review.facility.sportNameCs}`}
              </span>
            </Link>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!loading && reviews.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-zinc-300" />
          <p className="mt-3 text-sm font-medium text-zinc-500">
            Zatím žádné recenze{sport ? " pro tento sport" : ""}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Buďte první, kdo ohodnotí sportoviště
          </p>
          <Link
            href="/prihlaseni"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <MessageSquare className="h-4 w-4" />
            Napsat recenzi
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => updateParams({ page: String(page - 1) })}
            disabled={page <= 1}
            className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Předchozí
          </button>
          <span className="text-sm text-zinc-500">
            Strana {page} z {totalPages}
          </span>
          <button
            type="button"
            onClick={() => updateParams({ page: String(page + 1) })}
            disabled={page >= totalPages}
            className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30"
          >
            Další
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* CTA */}
      <div className="mt-10 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-center text-white">
        <h2 className="text-xl font-bold">Sdílejte svou zkušenost</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-emerald-100">
          Vaše recenze pomůže tisícům dalších sportovců najít to pravé sportoviště.
          Zabere to jen minutku.
        </p>
        <Link
          href="/prihlaseni"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition hover:shadow-lg"
        >
          <MessageSquare className="h-4 w-4" />
          Napsat recenzi
        </Link>
      </div>
    </div>
  );
}

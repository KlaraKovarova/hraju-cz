"use client";

import { StarRating } from "./StarRating";

interface StarDistribution {
  /** Count of reviews per star level (index 0 = 1 star, index 4 = 5 stars) */
  distribution: number[];
}

interface AggregateRatingProps {
  averageRating: number;
  reviewCount: number;
  /** Optional star distribution for bar chart [1star, 2star, 3star, 4star, 5star] */
  distribution?: number[];
}

export function AggregateRating({
  averageRating,
  reviewCount,
  distribution,
}: AggregateRatingProps) {
  const maxCount = distribution ? Math.max(...distribution, 1) : 1;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      {/* Big score */}
      <div className="text-center">
        <div className="text-4xl font-extrabold text-zinc-900">
          {averageRating.toFixed(1)}
        </div>
        <StarRating rating={averageRating} size="md" />
        <p className="mt-1 text-sm text-zinc-500">
          {reviewCount}{" "}
          {reviewCount === 1
            ? "recenze"
            : reviewCount >= 2 && reviewCount <= 4
              ? "recenze"
              : "recenzí"}
        </p>
      </div>

      {/* Star distribution bars */}
      {distribution && (
        <div className="w-full max-w-xs space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star - 1] || 0;
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-4 text-right text-xs font-medium text-zinc-500">
                  {star}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-zinc-400">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md";
  count?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  max = 5,
  size = "sm",
  count,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  const gap = size === "sm" ? "gap-0.5" : "gap-1";

  return (
    <span className={`inline-flex items-center ${gap}`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(i + 1)}
            className={interactive ? "cursor-pointer transition hover:scale-110" : "cursor-default"}
          >
            <Star
              className={`${starSize} ${
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-none text-zinc-300"
              }`}
            />
          </button>
        );
      })}
      {count !== undefined && (
        <span className="ml-1 text-xs text-zinc-500">({count})</span>
      )}
    </span>
  );
}

"use client";

import { useEffect, useState } from "react";
import { StarRating } from "./StarRating";

interface Review {
  id: string;
  authorName: string;
  rating: number;
  text: string | null;
  createdAt: string;
}

interface ReviewListProps {
  facilityId: string;
}

export function ReviewList({ facilityId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/facilities/${facilityId}/reviews?limit=20`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [facilityId]);

  if (loading) {
    return <p className="text-sm text-zinc-400">Načítání recenzí...</p>;
  }

  if (total === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Buďte první, kdo ohodnotí toto sportoviště
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-xl bg-zinc-50 p-4">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900">
                {review.authorName}
              </span>
              <StarRating rating={review.rating} />
            </div>
            <span className="text-xs text-zinc-400">
              {new Date(review.createdAt).toLocaleDateString("cs")}
            </span>
          </div>
          {review.text && (
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              {review.text}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Star, User, Clock, Building2 } from "lucide-react";

interface Review {
  id: string;
  facilityId: string;
  facility: { id: string; name: string; slug: string };
  authorName: string;
  authorEmail: string;
  rating: number;
  text: string | null;
  isApproved: boolean;
  createdAt: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  async function fetchReviews() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?filter=${filter}`);
      if (res.ok) setReviews(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) fetchReviews();
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Recenze</h1>

      <div className="mb-6 flex gap-2">
        {[
          { key: "pending", label: "Ke schválení" },
          { key: "approved", label: "Schválené" },
          { key: "all", label: "Vše" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === tab.key
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Načítání...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-zinc-500">Žádné recenze.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-zinc-400" />
                    <span className="font-semibold text-zinc-900">
                      {review.facility.name}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {review.authorName} ({review.authorEmail})
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(review.createdAt).toLocaleDateString("cs")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-none text-zinc-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {review.text && (
                <p className="mb-3 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
                  {review.text}
                </p>
              )}

              {!review.isApproved && (
                <div className="flex gap-2 border-t border-zinc-100 pt-3">
                  <button
                    onClick={() => handleAction(review.id, "approve")}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Schválit
                  </button>
                  <button
                    onClick={() => handleAction(review.id, "reject")}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    <XCircle className="h-4 w-4" />
                    Smazat
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

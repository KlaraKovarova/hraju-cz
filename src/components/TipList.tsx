"use client";

import { useState, useEffect, useCallback } from "react";
import { TipCard } from "./TipCard";

interface Tip {
  id: string;
  userId: string | null;
  authorName: string;
  text: string;
  helpful: number;
  createdAt: string;
}

interface TipListProps {
  facilityId: string;
}

export function TipList({ facilityId }: TipListProps) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("helpful");
  const [loading, setLoading] = useState(true);
  const perPage = 10;

  const fetchTips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/facilities/${facilityId}/tips?page=${page}&limit=${perPage}&sort=${sort}`
      );
      if (res.ok) {
        const data = await res.json();
        setTips(data.tips || []);
        setTotal(data.total || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [facilityId, page, sort]);

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  const totalPages = Math.ceil(total / perPage);

  if (loading && tips.length === 0) {
    return <p className="text-sm text-zinc-400">Načítání tipů...</p>;
  }

  if (!loading && tips.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Zatím žádné tipy. Buďte první, kdo přidá tip!
      </p>
    );
  }

  return (
    <div>
      {/* Sort controls */}
      <div className="mb-4 flex gap-2">
        {[
          { key: "helpful", label: "Nejužitečnější" },
          { key: "newest", label: "Nejnovější" },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => {
              setSort(opt.key);
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              sort === opt.key
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {tips.map((tip) => (
          <TipCard
            key={tip.id}
            id={tip.id}
            facilityId={facilityId}
            userId={tip.userId}
            authorName={tip.authorName}
            text={tip.text}
            helpful={tip.helpful}
            createdAt={tip.createdAt}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
          >
            ← Předchozí
          </button>
          <span className="text-xs text-zinc-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
          >
            Další →
          </button>
        </div>
      )}
    </div>
  );
}

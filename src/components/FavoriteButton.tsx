"use client";

import { useState, useEffect } from "react";
import { Heart, Loader2, LogIn } from "lucide-react";
import Link from "next/link";

interface FavoriteButtonProps {
  facilityId: string;
  currentPath: string;
}

export function FavoriteButton({ facilityId, currentPath }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [favRes, meRes] = await Promise.all([
          fetch(`/api/facilities/${facilityId}/favorite`),
          fetch("/api/auth/me"),
        ]);

        if (favRes.ok) {
          const data = await favRes.json();
          setCount(data.count);
          setIsFavorited(data.isFavorited);
        }

        setIsLoggedIn(meRes.ok);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [facilityId]);

  async function handleToggle() {
    if (!isLoggedIn) return;
    setSubmitting(true);

    try {
      if (isFavorited) {
        const res = await fetch(`/api/facilities/${facilityId}/favorite`, {
          method: "DELETE",
        });
        if (res.ok) {
          setIsFavorited(false);
          setCount((c) => Math.max(0, c - 1));
        }
      } else {
        const res = await fetch(`/api/facilities/${facilityId}/favorite`, {
          method: "POST",
        });
        if (res.ok) {
          setIsFavorited(true);
          setCount((c) => c + 1);
        }
      }
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <Heart className="h-4 w-4 text-zinc-300" />
        {count > 0 && (
          <span className="text-xs text-zinc-400">{count}</span>
        )}
        <Link
          href={`/prihlaseni?redirect=${encodeURIComponent(currentPath)}`}
          className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
        >
          <LogIn className="h-3 w-3" />
          Přihlásit
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={submitting}
        className="group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 hover:bg-rose-50"
        aria-label={isFavorited ? "Odebrat z oblíbených" : "Přidat do oblíbených"}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
        ) : (
          <Heart
            className={`h-4 w-4 transition ${
              isFavorited
                ? "fill-rose-500 text-rose-500"
                : "text-zinc-400 group-hover:text-rose-400"
            }`}
          />
        )}
        <span className={isFavorited ? "text-rose-600" : "text-zinc-500"}>
          {isFavorited ? "Oblíbené" : "Oblíbit"}
        </span>
      </button>
      {count > 0 && (
        <span className="text-xs text-zinc-400">{count}</span>
      )}
    </div>
  );
}

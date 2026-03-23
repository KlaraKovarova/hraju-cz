"use client";

import { useState, useEffect } from "react";
import { MapPinCheck, Loader2, LogIn } from "lucide-react";
import Link from "next/link";

interface CheckInButtonProps {
  facilityId: string;
  currentPath: string;
}

export function CheckInButton({ facilityId, currentPath }: CheckInButtonProps) {
  const [hasVisited, setHasVisited] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [visitRes, meRes] = await Promise.all([
          fetch(`/api/facilities/${facilityId}/visit`),
          fetch("/api/auth/me"),
        ]);

        if (visitRes.ok) {
          const data = await visitRes.json();
          setCount(data.count);
          setHasVisited(data.hasVisited);
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
      if (hasVisited) {
        const res = await fetch(`/api/facilities/${facilityId}/visit`, {
          method: "DELETE",
        });
        if (res.ok) {
          setHasVisited(false);
          setCount((c) => Math.max(0, c - 1));
        }
      } else {
        const res = await fetch(`/api/facilities/${facilityId}/visit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          setHasVisited(true);
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
      <div className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-white px-4 py-3 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Načítám...</span>
      </div>
    );
  }

  // Not logged in — show login CTA
  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <MapPinCheck className="h-4 w-4 text-zinc-400" />
          <span>
            {count > 0 ? (
              <>
                <span className="font-semibold text-zinc-700">{count}</span>{" "}
                {count === 1 ? "návštěvník" : count >= 2 && count <= 4 ? "návštěvníci" : "návštěvníků"}
              </>
            ) : (
              "Byl/a jste tu?"
            )}
          </span>
        </div>
        <Link
          href={`/prihlaseni?redirect=${encodeURIComponent(currentPath)}`}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
        >
          <LogIn className="h-3.5 w-3.5" />
          Přihlásit se
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-3">
      <button
        onClick={handleToggle}
        disabled={submitting}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
          hasVisited
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
        } disabled:opacity-50`}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPinCheck
            className={`h-4 w-4 ${hasVisited ? "text-emerald-600" : "text-zinc-400"}`}
          />
        )}
        {hasVisited ? "Byl/a jsem tady ✓" : "Byl/a jsem tady"}
      </button>
      {count > 0 && (
        <span className="text-sm text-zinc-500">
          <span className="font-semibold text-zinc-700">{count}</span>{" "}
          {count === 1 ? "návštěvník" : count >= 2 && count <= 4 ? "návštěvníci" : "návštěvníků"}
        </span>
      )}
    </div>
  );
}

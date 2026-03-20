"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StarRating } from "./StarRating";
import { User } from "lucide-react";

interface ReviewFormProps {
  facilityId: string;
  currentPath: string;
}

interface UserData {
  userId: string;
  email: string;
  name: string | null;
}

export function ReviewForm({ facilityId, currentPath }: ReviewFormProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Vyberte hodnocení.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/facilities/${facilityId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          text: text.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Nepodařilo se odeslat recenzi.");
      }
    } catch {
      setError("Chyba sítě. Zkuste to znovu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl bg-emerald-50 p-4 text-center">
        <p className="text-sm font-semibold text-emerald-800">
          Děkujeme za recenzi!
        </p>
        <p className="mt-1 text-xs text-emerald-600">
          Bude zobrazena po schválení.
        </p>
      </div>
    );
  }

  // Not logged in — show login prompt
  if (authChecked && !user) {
    return (
      <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-6 text-center">
        <User className="mx-auto h-8 w-8 text-zinc-400" />
        <p className="mt-2 text-sm font-semibold text-zinc-700">
          Pro přidání recenze se přihlaste
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Stačí zadat e-mail a pošleme vám přihlašovací odkaz.
        </p>
        <Link
          href={`/prihlaseni?redirect=${encodeURIComponent(currentPath)}`}
          className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          Přihlásit se
        </Link>
      </div>
    );
  }

  // Loading auth state
  if (!authChecked) {
    return (
      <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-6 text-center">
        <p className="text-sm text-zinc-400">Načítání...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Show who is reviewing */}
      <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
        <User className="h-4 w-4 text-zinc-400" />
        <span>
          Recenzujete jako{" "}
          <strong className="text-zinc-800">
            {user!.name || user!.email}
          </strong>
        </span>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Hodnocení *
        </label>
        <StarRating
          rating={rating}
          size="md"
          interactive
          onChange={setRating}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Text recenze (nepovinné)
        </label>
        <textarea
          rows={3}
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          placeholder="Popište svou zkušenost..."
        />
      </div>

      {error && (
        <p className="text-xs font-medium text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {submitting ? "Odesílání..." : "Odeslat recenzi"}
      </button>
    </form>
  );
}

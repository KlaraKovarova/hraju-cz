"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { PhotoUpload } from "./PhotoUpload";
import {
  ALLOWED_CONDITION_RATINGS,
  CONDITION_COMMENT_MAX_LENGTH,
  CONDITION_RATING_META,
  type ConditionRating,
} from "@/lib/conditions";

interface ConditionReportFormProps {
  facilityId: string;
  currentPath: string;
  onSubmitted?: () => void;
}

interface UserData {
  userId: string;
  email: string;
  name: string | null;
}

export function ConditionReportForm({
  facilityId,
  currentPath,
  onSubmitted,
}: ConditionReportFormProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [rating, setRating] = useState<ConditionRating | null>(null);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
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
    if (!rating) {
      setError("Vyberte, jaké jsou aktuální podmínky.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/facilities/${facilityId}/conditions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
          photoIds: photos.map((p) => p.id),
        }),
      });

      if (res.ok) {
        setSuccess(true);
        onSubmitted?.();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Nepodařilo se odeslat report.");
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
          Děkujeme za report!
        </p>
        <p className="mt-1 text-xs text-emerald-600">
          Pomáháte ostatním naplánovat návštěvu.
        </p>
      </div>
    );
  }

  if (authChecked && !user) {
    return (
      <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5 text-center">
        <User className="mx-auto h-7 w-7 text-zinc-400" />
        <p className="mt-2 text-sm font-semibold text-zinc-700">
          Přihlaste se a podělte se o aktuální stav
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Stačí e-mail. Pošleme vám přihlašovací odkaz.
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

  if (!authChecked) {
    return (
      <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5 text-center">
        <p className="text-sm text-zinc-400">Načítání…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-600">
          Jaké jsou aktuální podmínky? *
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ALLOWED_CONDITION_RATINGS.map((key) => {
            const meta = CONDITION_RATING_META[key];
            const selected = rating === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setRating(key)}
                aria-pressed={selected}
                className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-sm transition ${
                  selected
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <span className="text-xl leading-none" aria-hidden>{meta.emoji}</span>
                <span className="font-medium">{meta.labelCs}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Krátký popis (nepovinné)
        </label>
        <textarea
          rows={2}
          maxLength={CONDITION_COMMENT_MAX_LENGTH}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          placeholder="Např. sníh na přístupové cestě, poslední úsek zledovatělý…"
        />
        <div className="mt-1 text-right text-xs text-zinc-400">
          {comment.length}/{CONDITION_COMMENT_MAX_LENGTH}
        </div>
      </div>

      <div>
        <PhotoUpload
          facilityId={facilityId}
          context="condition"
          maxPhotos={3}
          photos={photos}
          onPhotosChange={setPhotos}
        />
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {submitting ? "Odesílání…" : "Odeslat report"}
      </button>
    </form>
  );
}

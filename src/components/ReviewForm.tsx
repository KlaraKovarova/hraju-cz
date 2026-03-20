"use client";

import { useState } from "react";
import { StarRating } from "./StarRating";

interface ReviewFormProps {
  facilityId: string;
}

export function ReviewForm({ facilityId }: ReviewFormProps) {
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim(),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Jméno *
          </label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            placeholder="Vaše jméno"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            E-mail *
          </label>
          <input
            type="email"
            required
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            placeholder="vas@email.cz"
          />
        </div>
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

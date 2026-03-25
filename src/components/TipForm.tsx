"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Lightbulb } from "lucide-react";

interface TipFormProps {
  facilityId: string;
  currentPath: string;
}

interface UserData {
  userId: string;
  email: string;
  name: string | null;
}

export function TipForm({ facilityId, currentPath }: TipFormProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
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
    if (text.trim().length === 0) {
      setError("Napište svůj tip.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/facilities/${facilityId}/tips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Nepodařilo se odeslat tip.");
      }
    } catch {
      setError("Chyba sítě. Zkuste to znovu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl bg-emerald-50 p-5 text-center">
        <Lightbulb className="mx-auto h-6 w-6 text-emerald-600" />
        <p className="mt-2 text-sm font-semibold text-emerald-800">
          Děkujeme za tip!
        </p>
        <p className="mt-1 text-xs text-emerald-600">
          Bude zobrazen po schválení.
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setText("");
          }}
          className="mt-3 text-xs font-medium text-emerald-700 hover:text-emerald-800"
        >
          Přidat další tip
        </button>
      </div>
    );
  }

  if (authChecked && !user) {
    return (
      <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-6 text-center">
        <Lightbulb className="mx-auto h-8 w-8 text-zinc-400" />
        <p className="mt-2 text-sm font-semibold text-zinc-700">
          Pro přidání tipu se přihlaste
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Sdílejte své zkušenosti a pomozte ostatním.
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
      <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-6 text-center">
        <p className="text-sm text-zinc-400">Načítání...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
        <User className="h-4 w-4 text-zinc-400" />
        <span>
          Tip od{" "}
          <strong className="text-zinc-800">
            {user!.name || user!.email}
          </strong>
        </span>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Váš tip (max 280 znaků)
        </label>
        <textarea
          rows={2}
          maxLength={280}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          placeholder='např. "Parkování zdarma za budovou" nebo "V pondělí ráno je prázdno"'
        />
        <p className="mt-1 text-right text-xs text-zinc-400">
          {text.length}/280
        </p>
      </div>

      {error && (
        <p className="text-xs font-medium text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {submitting ? "Odesílání..." : "Odeslat tip"}
      </button>
    </form>
  );
}

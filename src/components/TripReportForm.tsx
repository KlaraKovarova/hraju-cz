"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { PhotoUpload } from "./PhotoUpload";
import {
  TRIP_REPORT_BETA_MAX_LENGTH,
  TRIP_REPORT_GRADE_MAX_LENGTH,
  TRIP_REPORT_MAX_PHOTOS,
  TRIP_REPORT_PARTNERS_MAX_LENGTH,
  TRIP_REPORT_WEATHER_MAX_LENGTH,
  TRIP_REPORT_DURATION_MIN,
  TRIP_REPORT_DURATION_MAX,
} from "@/lib/trip-reports";

interface TripReportFormProps {
  facilityId: string;
  /** Where to redirect after submission (e.g. the facility's trip-report list). */
  redirectPath: string;
  /** Path to return to after login, if user is not signed in. */
  currentPath: string;
}

interface UserData {
  userId: string;
  email: string;
  name: string | null;
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function TripReportForm({
  facilityId,
  redirectPath,
  currentPath,
}: TripReportFormProps) {
  const router = useRouter();
  const today = todayIso();

  const [user, setUser] = useState<UserData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [dateClimbed, setDateClimbed] = useState(today);
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [gradeText, setGradeText] = useState("");
  const [partnersText, setPartnersText] = useState("");
  const [beta, setBeta] = useState("");
  const [weatherNote, setWeatherNote] = useState("");
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);

  const [submitting, setSubmitting] = useState(false);
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
    setError("");

    if (!dateClimbed) {
      setError("Zadejte datum výstupu.");
      return;
    }

    const duration = durationMinutes.trim();
    if (duration) {
      const n = parseInt(duration, 10);
      if (
        !Number.isFinite(n) ||
        n < TRIP_REPORT_DURATION_MIN ||
        n > TRIP_REPORT_DURATION_MAX
      ) {
        setError(`Doba musí být ${TRIP_REPORT_DURATION_MIN}–${TRIP_REPORT_DURATION_MAX} minut.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/trip-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateClimbed,
          durationMinutes: duration ? parseInt(duration, 10) : null,
          gradeText: gradeText.trim() || null,
          partnersText: partnersText.trim() || null,
          beta: beta.trim() || null,
          weatherNote: weatherNote.trim() || null,
          photoIds: photos.map((p) => p.id),
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const anchor = data?.id ? `#zaznam-${data.id}` : "";
        router.push(`${redirectPath}${anchor}`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Nepodařilo se odeslat záznam.");
      }
    } catch {
      setError("Chyba sítě. Zkuste to znovu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authChecked && !user) {
    return (
      <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5 text-center">
        <User className="mx-auto h-7 w-7 text-zinc-400" />
        <p className="mt-2 text-sm font-semibold text-zinc-700">
          Přihlaste se a přidejte záznam výstupu
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Datum výstupu *
          </label>
          <input
            type="date"
            required
            max={today}
            value={dateClimbed}
            onChange={(e) => setDateClimbed(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Doba (minut, nepovinné)
          </label>
          <input
            type="number"
            min={TRIP_REPORT_DURATION_MIN}
            max={TRIP_REPORT_DURATION_MAX}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="např. 180"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Obtížnost (nepovinné)
          </label>
          <input
            type="text"
            maxLength={TRIP_REPORT_GRADE_MAX_LENGTH}
            value={gradeText}
            onChange={(e) => setGradeText(e.target.value)}
            placeholder="např. B/C, UIAA 6+, 5c"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Parťáci (nepovinné)
          </label>
          <input
            type="text"
            maxLength={TRIP_REPORT_PARTNERS_MAX_LENGTH}
            value={partnersText}
            onChange={(e) => setPartnersText(e.target.value)}
            placeholder="např. S Honzou a Pepou"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Popis výstupu (nepovinné)
        </label>
        <textarea
          rows={5}
          maxLength={TRIP_REPORT_BETA_MAX_LENGTH}
          value={beta}
          onChange={(e) => setBeta(e.target.value)}
          placeholder="Popis cesty, klíčové kroky, doporučené vybavení, tipy pro další…"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
        />
        <div className="mt-1 text-right text-xs text-zinc-400">
          {beta.length}/{TRIP_REPORT_BETA_MAX_LENGTH}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Počasí (nepovinné)
        </label>
        <input
          type="text"
          maxLength={TRIP_REPORT_WEATHER_MAX_LENGTH}
          value={weatherNote}
          onChange={(e) => setWeatherNote(e.target.value)}
          placeholder="např. slunečno, 18 °C, lehký vítr"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Fotky (nepovinné, max {TRIP_REPORT_MAX_PHOTOS})
        </label>
        <PhotoUpload
          facilityId={facilityId}
          context="trip-report"
          maxPhotos={TRIP_REPORT_MAX_PHOTOS}
          photos={photos}
          onPhotosChange={setPhotos}
        />
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {submitting ? "Odesílání…" : "Přidat záznam výstupu"}
      </button>
    </form>
  );
}

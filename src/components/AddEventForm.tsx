"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400";

interface UserData {
  userId: string;
  email: string;
  name: string | null;
}

export default function AddEventForm() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    dateStart: "",
    dateEnd: "",
    city: "",
    region: "",
    description: "",
    externalUrl: "",
  });

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/prihlaseni?redirect=/pridat-akci");
          return;
        }
        const data = await res.json();
        setUser(data);
      } catch {
        router.push("/prihlaseni?redirect=/pridat-akci");
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // 2-month rolling window for date inputs
  const today = new Date().toISOString().split("T")[0];
  const maxDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split("T")[0];
  })();

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!form.name.trim()) {
      setError("Vyplňte název akce.");
      setSubmitting(false);
      return;
    }
    if (!form.dateStart) {
      setError("Vyplňte datum začátku.");
      setSubmitting(false);
      return;
    }
    if (!form.city.trim()) {
      setError("Vyplňte město konání.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/events/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodařilo se odeslat.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se odeslat.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) return null;

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h3 className="mt-4 text-xl font-bold text-emerald-800">
          Děkujeme za přidání akce!
        </h3>
        <p className="mt-2 text-sm text-emerald-600">
          Vaše akce bude zobrazena po schválení naším týmem. Potvrzení jsme
          odeslali na váš e-mail.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link
            href="/muj-ucet"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            Moje akce
          </Link>
          <span className="text-emerald-300">|</span>
          <Link
            href="/"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            Zpět na úvodní stránku
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Section 1: O akci */}
      <fieldset className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <legend className="px-2 text-sm font-semibold text-zinc-900">
          O akci
        </legend>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Název akce *
          </label>
          <input
            type="text"
            required
            maxLength={200}
            placeholder="např. Jarní pochod přes Drahanskou vrchovinu"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Datum začátku *
            </label>
            <input
              type="date"
              required
              min={today}
              max={maxDate}
              value={form.dateStart}
              onChange={(e) => update("dateStart", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Datum konce
            </label>
            <input
              type="date"
              min={today}
              max={maxDate}
              value={form.dateEnd}
              onChange={(e) => update("dateEnd", e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-zinc-400">
              Pro vícedenní akce
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Město konání *
            </label>
            <input
              type="text"
              required
              placeholder="např. Brno"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Okres / kraj
            </label>
            <input
              type="text"
              placeholder="např. Brno-venkov"
              value={form.region}
              onChange={(e) => update("region", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Krátký popis
          </label>
          <textarea
            maxLength={500}
            rows={3}
            placeholder="Co účastníky čeká, trasa, délka..."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Odkaz na akci
          </label>
          <input
            type="url"
            placeholder="https://..."
            value={form.externalUrl}
            onChange={(e) => update("externalUrl", e.target.value)}
            className={inputClass}
          />
        </div>
      </fieldset>

      {/* Section 2: Logged-in user info (read-only) */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-4">
        <p className="text-sm text-zinc-500">
          Přihlášen/a jako <span className="font-medium text-zinc-700">{user.name || user.email}</span>
          {user.name && <span className="text-zinc-400"> ({user.email})</span>}
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        {submitting ? "Odesílání..." : "Odeslat akci ke schválení"}
      </button>

      <p className="text-center text-xs text-zinc-400">
        Po odeslání bude akce zkontrolována a přidána do kalendáře.
      </p>
    </form>
  );
}

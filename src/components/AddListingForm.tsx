"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle2, AlertCircle, User } from "lucide-react";
import Link from "next/link";
import { SPORTS } from "@/lib/sports";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400";

interface AddListingFormProps {
  user?: { userId: string; email: string; name: string | null };
}

export default function AddListingForm({ user }: AddListingFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<number>(0);

  const [form, setForm] = useState({
    name: "",
    sportSlugs: [] as string[],
    description: "",
    courtsLanes: "",
    address: "",
    city: "",
    postalCode: "",
    region: "",
    phone: "",
    email: "",
    website: "",
    openingHours: "",
    pricing: "",
    submitterName: user?.name || "",
    submitterEmail: user?.email || "",
    submitterPhone: "",
    website_url: "", // honeypot
  });

  useEffect(() => {
    setTimestamp(Date.now());
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSport(slug: string) {
    setForm((prev) => ({
      ...prev,
      sportSlugs: prev.sportSlugs.includes(slug)
        ? prev.sportSlugs.filter((s) => s !== slug)
        : [...prev.sportSlugs, slug],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Client-side validation
    if (!form.name.trim()) {
      setError("Vyplňte název sportoviště.");
      setSubmitting(false);
      return;
    }
    if (form.sportSlugs.length === 0) {
      setError("Vyberte alespoň jeden sport.");
      setSubmitting(false);
      return;
    }
    if (!form.address.trim()) {
      setError("Vyplňte adresu.");
      setSubmitting(false);
      return;
    }
    if (!form.city.trim()) {
      setError("Vyplňte město.");
      setSubmitting(false);
      return;
    }

    // If no user prop, require submitter fields
    if (!user) {
      if (!form.submitterName.trim()) {
        setError("Vyplňte vaše jméno.");
        setSubmitting(false);
        return;
      }
      if (!form.submitterEmail.trim()) {
        setError("Vyplňte váš e-mail.");
        setSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // Always send submitter info from user session if available
          submitterName: user?.name || form.submitterName,
          submitterEmail: user?.email || form.submitterEmail,
          courtsLanes: form.courtsLanes ? Number(form.courtsLanes) : undefined,
          _timestamp: timestamp,
        }),
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

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h3 className="mt-4 text-xl font-bold text-emerald-800">
          Děkujeme za přidání sportoviště!
        </h3>
        <p className="mt-2 text-sm text-emerald-600">
          Váš zápis byl odeslán ke schválení. Po kontrole administrátorem se
          sportoviště zobrazí na hraju.cz.
        </p>
        <Link
          href="/muj-ucet"
          className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          Zpět na můj účet &rarr;
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Logged-in user info */}
      {user && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
            <User className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-sm">
            <span className="font-medium text-zinc-900">{user.name || "Sportovec"}</span>
            <span className="ml-2 text-zinc-500">{user.email}</span>
          </div>
        </div>
      )}

      {/* Honeypot */}
      <input
        name="website_url"
        value={form.website_url}
        onChange={(e) => update("website_url", e.target.value)}
        style={{ position: "absolute", left: "-9999px" }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {/* Section 1: O sportovišti */}
      <fieldset className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <legend className="px-2 text-sm font-semibold text-zinc-900">
          O sportovišti
        </legend>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Název sportoviště *
          </label>
          <input
            type="text"
            required
            maxLength={200}
            placeholder="např. Tenisový klub Praha"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Sport(y) *
          </label>
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((sport) => (
              <button
                key={sport.slug}
                type="button"
                onClick={() => toggleSport(sport.slug)}
                className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                  form.sportSlugs.includes(sport.slug)
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {sport.icon} {sport.nameCs}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Popis
          </label>
          <textarea
            maxLength={2000}
            rows={4}
            placeholder="Krátký popis sportoviště, vybavení, povrchy..."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Počet kurtů / drah / bazénů
          </label>
          <input
            type="number"
            min={1}
            max={100}
            placeholder="např. 4"
            value={form.courtsLanes}
            onChange={(e) => update("courtsLanes", e.target.value)}
            className={inputClass}
          />
        </div>
      </fieldset>

      {/* Section 2: Adresa */}
      <fieldset className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <legend className="px-2 text-sm font-semibold text-zinc-900">
          Adresa
        </legend>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Adresa *
          </label>
          <input
            type="text"
            required
            placeholder="Ulice a číslo popisné"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Město *
            </label>
            <input
              type="text"
              required
              placeholder="např. Praha"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              PSČ
            </label>
            <input
              type="text"
              placeholder="např. 11000"
              value={form.postalCode}
              onChange={(e) => update("postalCode", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Městská část / oblast
          </label>
          <input
            type="text"
            placeholder="např. Praha 5"
            value={form.region}
            onChange={(e) => update("region", e.target.value)}
            className={inputClass}
          />
        </div>
      </fieldset>

      {/* Section 3: Kontakt */}
      <fieldset className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <legend className="px-2 text-sm font-semibold text-zinc-900">
          Kontakt na sportoviště
        </legend>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Telefon
          </label>
          <input
            type="tel"
            placeholder="+420 123 456 789"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            E-mail
          </label>
          <input
            type="email"
            placeholder="info@sportoviste.cz"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Web
          </label>
          <input
            type="url"
            placeholder="https://www.sportoviste.cz"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
            className={inputClass}
          />
        </div>
      </fieldset>

      {/* Section 4: Provoz */}
      <fieldset className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <legend className="px-2 text-sm font-semibold text-zinc-900">
          Provoz
        </legend>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Otevírací doba
          </label>
          <textarea
            rows={3}
            placeholder={"Po-Pá: 8:00-22:00\nSo-Ne: 9:00-20:00"}
            value={form.openingHours}
            onChange={(e) => update("openingHours", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Ceník
          </label>
          <textarea
            rows={3}
            placeholder="1 hodina: 200 Kč"
            value={form.pricing}
            onChange={(e) => update("pricing", e.target.value)}
            className={inputClass}
          />
        </div>
      </fieldset>

      {/* Section 5: Vaše údaje — only if not logged in */}
      {!user && (
        <fieldset className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
          <legend className="px-2 text-sm font-semibold text-zinc-900">
            Vaše údaje
          </legend>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Vaše jméno *
            </label>
            <input
              type="text"
              required
              placeholder="Jan Novák"
              value={form.submitterName}
              onChange={(e) => update("submitterName", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Váš e-mail *
            </label>
            <input
              type="email"
              required
              placeholder="jan@example.com"
              value={form.submitterEmail}
              onChange={(e) => update("submitterEmail", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Váš telefon
            </label>
            <input
              type="tel"
              placeholder="+420 123 456 789"
              value={form.submitterPhone}
              onChange={(e) => update("submitterPhone", e.target.value)}
              className={inputClass}
            />
          </div>
        </fieldset>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        {submitting ? "Odesílání..." : "Odeslat sportoviště ke schválení"}
      </button>

      <p className="text-center text-xs text-zinc-400">
        Po odeslání bude sportoviště zkontrolováno a přidáno do databáze.
      </p>
    </form>
  );
}

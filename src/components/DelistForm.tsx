"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Send, CheckCircle2, AlertCircle, Search } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400";

interface FacilityResult {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
}

export default function DelistForm() {
  const searchParams = useSearchParams();
  const facilitySlug = searchParams.get("facility");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<number>(0);

  // Facility selection
  const [facility, setFacility] = useState<FacilityResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FacilityResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingSlug, setLoadingSlug] = useState(!!facilitySlug);

  const [form, setForm] = useState({
    submitterName: "",
    submitterEmail: "",
    relationship: "",
    reason: "",
    website_url: "", // honeypot
  });

  useEffect(() => {
    setTimestamp(Date.now());
  }, []);

  // Pre-fill from slug
  useEffect(() => {
    if (!facilitySlug) return;

    async function loadFacility() {
      try {
        const res = await fetch(`/api/facilities?slug=${facilitySlug}`);
        if (res.ok) {
          const data = await res.json();
          const fac = Array.isArray(data) ? data[0] : data;
          if (fac) {
            setFacility({
              id: fac.id,
              name: fac.name,
              slug: fac.slug,
              address: fac.address,
              city: fac.location?.city || "",
            });
          }
        }
      } catch {
        // Ignore — user can search manually
      } finally {
        setLoadingSlug(false);
      }
    }

    loadFacility();
  }, [facilitySlug]);

  // Search facilities
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/facilities?search=${encodeURIComponent(searchQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          const results = (Array.isArray(data) ? data : data.facilities || []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (f: any) => ({
              id: f.id,
              name: f.name,
              slug: f.slug,
              address: f.address,
              city: f.location?.city || "",
            })
          );
          setSearchResults(results);
        }
      } catch {
        // Ignore search errors
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!facility) {
      setError("Vyberte sportoviště, které chcete odhlásit.");
      setSubmitting(false);
      return;
    }
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
    if (!form.relationship) {
      setError("Vyberte váš vztah ke sportovišti.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/delist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId: facility.id,
          submitterName: form.submitterName,
          submitterEmail: form.submitterEmail,
          relationship: form.relationship,
          reason: form.reason || undefined,
          website_url: form.website_url,
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
          Žádost byla odeslána
        </h3>
        <p className="mt-2 text-sm text-emerald-600">
          Vaši žádost o odebrání sportoviště zpracujeme do 30 dnů v souladu s
          GDPR. Potvrzení jsme odeslali na váš e-mail.
        </p>
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

      {/* Facility selection */}
      <fieldset className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <legend className="px-2 text-sm font-semibold text-zinc-900">
          Sportoviště k odebrání
        </legend>

        {loadingSlug ? (
          <p className="text-sm text-zinc-500">Načítání sportoviště...</p>
        ) : facility ? (
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div>
              <p className="font-medium text-zinc-900">{facility.name}</p>
              <p className="text-sm text-zinc-500">
                {facility.address}, {facility.city}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFacility(null);
                setSearchQuery("");
              }}
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              Změnit
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Vyhledejte sportoviště podle názvu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputClass} pl-9`}
              />
            </div>
            {searching && (
              <p className="mt-2 text-xs text-zinc-400">Hledání...</p>
            )}
            {searchResults.length > 0 && (
              <ul className="mt-2 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
                {searchResults.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setFacility(f);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-zinc-50"
                    >
                      <p className="text-sm font-medium text-zinc-900">
                        {f.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {f.address}, {f.city}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </fieldset>

      {/* Submitter details */}
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
            Váš vztah ke sportovišti *
          </label>
          <select
            required
            value={form.relationship}
            onChange={(e) => update("relationship", e.target.value)}
            className={inputClass}
          >
            <option value="">Vyberte...</option>
            <option value="operator">Provozovatel</option>
            <option value="owner">Vlastník</option>
            <option value="other">Jiný</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Důvod odhlášení
          </label>
          <textarea
            rows={3}
            placeholder="Nepovinné — můžete uvést důvod žádosti o odebrání"
            value={form.reason}
            onChange={(e) => update("reason", e.target.value)}
            className={inputClass}
          />
        </div>
      </fieldset>

      {/* GDPR notice */}
      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-xs text-zinc-500">
        Vaši žádost zpracujeme do 30 dnů v souladu s GDPR. Po schválení bude
        sportoviště odebráno z databáze hraju.cz. Potvrzení odeslání obdržíte
        e-mailem.
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        {submitting ? "Odesílání..." : "Odeslat žádost o odebrání"}
      </button>
    </form>
  );
}

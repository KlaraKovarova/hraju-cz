"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

interface EditSuggestionFormProps {
  facilityId: string;
  facilityName: string;
}

export default function EditSuggestionForm({
  facilityId,
  facilityName,
}: EditSuggestionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    submitterName: "",
    submitterEmail: "",
    submitterPhone: "",
    isOwner: false,
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    openingHours: "",
    pricing: "",
    description: "",
    message: "",
  });

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const changes: Record<string, string> = {};
    if (form.name.trim()) changes.name = form.name.trim();
    if (form.address.trim()) changes.address = form.address.trim();
    if (form.phone.trim()) changes.phone = form.phone.trim();
    if (form.email.trim()) changes.email = form.email.trim();
    if (form.website.trim()) changes.website = form.website.trim();
    if (form.openingHours.trim()) changes.openingHours = form.openingHours.trim();
    if (form.pricing.trim()) changes.pricing = form.pricing.trim();
    if (form.description.trim()) changes.description = form.description.trim();

    if (Object.keys(changes).length === 0 && !form.message.trim()) {
      setError("Vyplňte alespoň jednu změnu nebo zprávu.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/edit-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId,
          submitterName: form.submitterName,
          submitterEmail: form.submitterEmail,
          submitterPhone: form.submitterPhone || undefined,
          isOwner: form.isOwner,
          changes,
          message: form.message || undefined,
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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <h3 className="mt-3 text-lg font-bold text-emerald-800">
          Děkujeme za váš podnět!
        </h3>
        <p className="mt-1 text-sm text-emerald-600">
          Váš návrh úpravy pro {facilityName} byl odeslán. Budeme ho posuzovat co
          nejdříve.
        </p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-600 transition hover:border-emerald-300 hover:text-emerald-700 hover:shadow-sm"
      >
        <Send className="h-4 w-4" />
        Navrhnout úpravu údajů
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-5"
    >
      <h3 className="mb-1 text-base font-bold text-zinc-900">
        Navrhnout úpravu
      </h3>
      <p className="mb-4 text-xs text-zinc-500">
        Vyplňte pouze pole, která chcete změnit. Ostatní ponechte prázdná.
      </p>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Submitter info */}
      <fieldset className="mb-4 space-y-3 rounded-xl border border-zinc-100 p-4">
        <legend className="px-2 text-xs font-semibold text-zinc-500">
          Vaše údaje
        </legend>
        <input
          required
          type="text"
          placeholder="Jméno *"
          value={form.submitterName}
          onChange={(e) => update("submitterName", e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
        <input
          required
          type="email"
          placeholder="E-mail *"
          value={form.submitterEmail}
          onChange={(e) => update("submitterEmail", e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
        <input
          type="tel"
          placeholder="Telefon (nepovinné)"
          value={form.submitterPhone}
          onChange={(e) => update("submitterPhone", e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={form.isOwner}
            onChange={(e) => update("isOwner", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
          Jsem provozovatel tohoto sportoviště
        </label>
      </fieldset>

      {/* Proposed changes */}
      <fieldset className="mb-4 space-y-3 rounded-xl border border-zinc-100 p-4">
        <legend className="px-2 text-xs font-semibold text-zinc-500">
          Navrhované změny
        </legend>
        <input
          type="text"
          placeholder="Název sportoviště"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
        <input
          type="text"
          placeholder="Adresa"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="tel"
            placeholder="Telefon"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
          <input
            type="email"
            placeholder="E-mail"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
        </div>
        <input
          type="url"
          placeholder="Web (https://...)"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
        <textarea
          placeholder="Otevírací doba"
          rows={2}
          value={form.openingHours}
          onChange={(e) => update("openingHours", e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
        <textarea
          placeholder="Ceník"
          rows={2}
          value={form.pricing}
          onChange={(e) => update("pricing", e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
        <textarea
          placeholder="Popis sportoviště"
          rows={3}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
      </fieldset>

      {/* Free message */}
      <textarea
        placeholder="Další poznámka nebo zpráva pro administrátory..."
        rows={2}
        value={form.message}
        onChange={(e) => update("message", e.target.value)}
        className="mb-4 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Odesílání..." : "Odeslat návrh"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          Zrušit
        </button>
      </div>
    </form>
  );
}

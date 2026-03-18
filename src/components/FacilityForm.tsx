"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SPORTS } from "@/lib/sports";

const DAYS = [
  { key: "po", label: "Pondělí" },
  { key: "út", label: "Úterý" },
  { key: "st", label: "Středa" },
  { key: "čt", label: "Čtvrtek" },
  { key: "pá", label: "Pátek" },
  { key: "so", label: "Sobota" },
  { key: "ne", label: "Neděle" },
] as const;

interface DayHours {
  closed: boolean;
  open: string;
  close: string;
}

type OpeningHoursState = Record<string, DayHours>;

function parseOpeningHours(json: Record<string, string> | null): OpeningHoursState {
  const state: OpeningHoursState = {};
  for (const { key } of DAYS) {
    const val = json?.[key];
    if (!val || val.toLowerCase() === "zavřeno") {
      state[key] = { closed: true, open: "09:00", close: "22:00" };
    } else {
      const parts = val.split("–").map((s) => s.trim());
      state[key] = {
        closed: false,
        open: parts[0] || "09:00",
        close: parts[1] || "22:00",
      };
    }
  }
  return state;
}

function serializeOpeningHours(state: OpeningHoursState): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { key } of DAYS) {
    const day = state[key];
    result[key] = day.closed ? "Zavřeno" : `${day.open}–${day.close}`;
  }
  return result;
}

export interface AmenityOption {
  id: string;
  slug: string;
  nameCs: string;
  icon: string | null;
}

interface FacilityFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  postalCode: string;
  city: string;
  region: string;
  courtsLanes?: number;
  pricing: string;
  website: string;
  isActive: boolean;
  isPremium: boolean;
  sportSlugs: string[];
  openingHours?: Record<string, string> | null;
  amenityIds?: string[];
}

interface FacilityFormProps {
  initialData?: FacilityFormData;
  allAmenities?: AmenityOption[];
}

const DEFAULT_DATA: FacilityFormData = {
  name: "",
  slug: "",
  description: "",
  address: "",
  postalCode: "",
  city: "",
  region: "",
  pricing: "",
  website: "",
  isActive: true,
  isPremium: false,
  sportSlugs: [],
  openingHours: null,
  amenityIds: [],
};

export function FacilityForm({ initialData, allAmenities = [] }: FacilityFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FacilityFormData>(initialData ?? DEFAULT_DATA);
  const [hours, setHours] = useState<OpeningHoursState>(
    parseOpeningHours((initialData?.openingHours as Record<string, string> | null) ?? null)
  );
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(
    new Set(initialData?.amenityIds ?? [])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  function handleSlugify() {
    setForm((prev) => ({
      ...prev,
      slug: prev.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    }));
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
    setSaving(true);
    setError(null);

    try {
      const isEdit = !!form.id;
      const url = isEdit ? `/api/facilities/${form.id}` : "/api/facilities";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          courtsLanes: form.courtsLanes ? Number(form.courtsLanes) : null,
          openingHours: serializeOpeningHours(hours),
          amenityIds: [...selectedAmenities],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Uložení selhalo");
      }

      router.push("/admin/facilities");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neočekávaná chyba");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!form.id || !confirm(`Smazat „${form.name}"? Tato akce je nevratná.`)) return;
    setSaving(true);
    try {
      await fetch(`/api/facilities/${form.id}`, { method: "DELETE" });
      router.push("/admin/facilities");
      router.refresh();
    } catch {
      setError("Smazání selhalo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Základní informace</h2>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Název *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Slug (URL) *</label>
          <div className="flex gap-2">
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              required
              pattern="[a-z0-9-]+"
              className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={handleSlugify}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-50"
            >
              Auto
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Popis</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Webové stránky</label>
          <input
            name="website"
            value={form.website}
            onChange={handleChange}
            type="url"
            placeholder="https://"
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Location */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Adresa</h2>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Adresa *</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            placeholder="Ulice 1, Praha 1"
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Město *</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">PSČ</label>
            <input
              name="postalCode"
              value={form.postalCode}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Kraj</label>
          <input
            name="region"
            value={form.region}
            onChange={handleChange}
            placeholder="Praha, Jihomoravský kraj…"
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Sports */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-3 font-semibold text-zinc-900">Sporty</h2>
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

      {/* Details */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Detaily</h2>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Počet kurtů/drah</label>
          <input
            name="courtsLanes"
            value={form.courtsLanes ?? ""}
            onChange={handleChange}
            type="number"
            min="1"
            className="w-32 rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Ceny</label>
          <textarea
            name="pricing"
            value={form.pricing}
            onChange={handleChange}
            rows={2}
            placeholder="300–450 Kč/hod"
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="rounded"
            />
            Aktivní
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="isPremium"
              checked={form.isPremium}
              onChange={handleChange}
              className="rounded"
            />
            Premium
          </label>
        </div>
      </div>

      {/* Opening Hours */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">Otevírací doba</h2>
          <button
            type="button"
            onClick={() => {
              const poDay = hours["po"];
              if (poDay.closed) return;
              setHours((prev) => {
                const next = { ...prev };
                for (const { key } of DAYS) {
                  next[key] = { ...poDay };
                }
                return next;
              });
            }}
            className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50"
          >
            Kopírovat Po na všechny dny
          </button>
        </div>

        <div className="space-y-2">
          {DAYS.map(({ key, label }) => {
            const day = hours[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-20 text-sm font-medium text-zinc-700">{label}</span>
                <label className="flex items-center gap-1.5 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    checked={day.closed}
                    onChange={(e) =>
                      setHours((prev) => ({
                        ...prev,
                        [key]: { ...prev[key], closed: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                  Zavřeno
                </label>
                {!day.closed && (
                  <>
                    <input
                      type="time"
                      value={day.open}
                      onChange={(e) =>
                        setHours((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], open: e.target.value },
                        }))
                      }
                      className="rounded-xl border border-zinc-200 px-2 py-1.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <span className="text-zinc-400">–</span>
                    <input
                      type="time"
                      value={day.close}
                      onChange={(e) =>
                        setHours((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], close: e.target.value },
                        }))
                      }
                      className="rounded-xl border border-zinc-200 px-2 py-1.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Amenities */}
      {allAmenities.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-3 font-semibold text-zinc-900">Vybavení</h2>
          <div className="flex flex-wrap gap-2">
            {allAmenities.map((amenity) => (
              <button
                key={amenity.id}
                type="button"
                onClick={() =>
                  setSelectedAmenities((prev) => {
                    const next = new Set(prev);
                    if (next.has(amenity.id)) next.delete(amenity.id);
                    else next.add(amenity.id);
                    return next;
                  })
                }
                className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                  selectedAmenities.has(amenity.id)
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {amenity.icon && <span className="mr-1">{amenity.icon}</span>}
                {amenity.nameCs}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Ukládám…" : form.id ? "Uložit změny" : "Vytvořit sportoviště"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          Zrušit
        </button>
        {form.id && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="ml-auto rounded-xl border border-red-200 px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Smazat
          </button>
        )}
      </div>
    </form>
  );
}

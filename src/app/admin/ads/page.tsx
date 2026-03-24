"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Banner {
  id: string;
  name: string;
  imageUrl: string;
  targetUrl: string;
  placement: string[];
  sportFilter: string[];
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  impressions: number;
  clicks: number;
  createdAt: string;
}

const PLACEMENTS = [
  { value: "detail_sidebar", label: "Detail — sidebar (300x250)" },
  { value: "listing_inline", label: "Listing — inline (728x90)" },
];

export default function AdminAdsPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    imageUrl: "",
    targetUrl: "",
    placement: [] as string[],
    sportFilter: "",
    isActive: true,
    startDate: "",
    endDate: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/banners");
      if (res.ok) setBanners(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const resetForm = () => {
    setForm({
      name: "",
      imageUrl: "",
      targetUrl: "",
      placement: [],
      sportFilter: "",
      isActive: true,
      startDate: "",
      endDate: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (b: Banner) => {
    setForm({
      name: b.name,
      imageUrl: b.imageUrl,
      targetUrl: b.targetUrl,
      placement: b.placement,
      sportFilter: b.sportFilter.join(", "),
      isActive: b.isActive,
      startDate: b.startDate ? b.startDate.slice(0, 10) : "",
      endDate: b.endDate ? b.endDate.slice(0, 10) : "",
    });
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const body = {
      name: form.name,
      imageUrl: form.imageUrl,
      targetUrl: form.targetUrl,
      placement: form.placement,
      sportFilter: form.sportFilter
        ? form.sportFilter.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      isActive: form.isActive,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };

    try {
      const url = editingId
        ? `/api/admin/banners/${editingId}`
        : "/api/admin/banners";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        resetForm();
        fetchBanners();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/banners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchBanners();
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Opravdu smazat tento banner?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    fetchBanners();
  };

  const togglePlacement = (value: string) => {
    setForm((f) => ({
      ...f,
      placement: f.placement.includes(value)
        ? f.placement.filter((p) => p !== value)
        : [...f.placement, value],
    }));
  };

  const totalImpressions = banners.reduce((s, b) => s + b.impressions, 0);
  const totalClicks = banners.reduce((s, b) => s + b.clicks, 0);
  const activeBanners = banners.filter((b) => b.isActive).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Správa reklam</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Nový banner
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
        <StatCard label="Celkem bannerů" value={banners.length} />
        <StatCard label="Aktivních" value={activeBanners} accent={activeBanners > 0 ? "emerald" : undefined} />
        <StatCard label="Zobrazení" value={totalImpressions} />
        <StatCard label="Kliknutí" value={totalClicks} sub={totalImpressions > 0 ? `CTR ${((totalClicks / totalImpressions) * 100).toFixed(2)}%` : undefined} />
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            {editingId ? "Upravit banner" : "Nový banner"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Název (interní)
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Cílová URL
                </label>
                <input
                  type="url"
                  value={form.targetUrl}
                  onChange={(e) => setForm((f) => ({ ...f, targetUrl: e.target.value }))}
                  required
                  placeholder="https://www.medfeet.cz/joma/"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                URL obrázku
              </label>
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                required
                placeholder="/images/banners/medfeet-300x250.png"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Umístění
              </label>
              <div className="flex gap-4">
                {PLACEMENTS.map((p) => (
                  <label key={p.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.placement.includes(p.value)}
                      onChange={() => togglePlacement(p.value)}
                      className="rounded border-zinc-300"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Sport filter (čárkou oddělené slugy, prázdné = všechny)
                </label>
                <input
                  type="text"
                  value={form.sportFilter}
                  onChange={(e) => setForm((f) => ({ ...f, sportFilter: e.target.value }))}
                  placeholder="tenis, fitness, lezeni"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Od
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Do
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="rounded border-zinc-300"
              />
              Aktivní
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || form.placement.length === 0}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Ukládám…" : editingId ? "Uložit změny" : "Vytvořit banner"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                Zrušit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banner List */}
      {loading ? (
        <p className="text-sm text-zinc-500">Načítám…</p>
      ) : banners.length === 0 ? (
        <p className="text-sm text-zinc-500">Zatím žádné bannery.</p>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => {
            const ctr = b.impressions > 0 ? ((b.clicks / b.impressions) * 100).toFixed(2) : "—";
            return (
              <div
                key={b.id}
                className={`flex items-center gap-4 rounded-xl border p-4 ${
                  b.isActive ? "border-zinc-200 bg-white" : "border-zinc-100 bg-zinc-50 opacity-60"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.imageUrl}
                  alt={b.name}
                  className="h-16 w-24 rounded border border-zinc-200 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-900 truncate">{b.name}</h3>
                    {b.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Aktivní
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                        Neaktivní
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 truncate">
                    {b.targetUrl}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {b.placement.join(", ")}
                    {b.sportFilter.length > 0 && ` · ${b.sportFilter.join(", ")}`}
                  </p>
                </div>
                <div className="text-right text-xs text-zinc-500 shrink-0 space-y-0.5">
                  <div>{b.impressions.toLocaleString("cs-CZ")} zobrazení</div>
                  <div>{b.clicks.toLocaleString("cs-CZ")} kliků</div>
                  <div>CTR {ctr}%</div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => toggleActive(b.id, b.isActive)}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-50"
                    title={b.isActive ? "Deaktivovat" : "Aktivovat"}
                  >
                    {b.isActive ? "Vypnout" : "Zapnout"}
                  </button>
                  <button
                    onClick={() => startEdit(b)}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-50"
                  >
                    Upravit
                  </button>
                  <button
                    onClick={() => deleteBanner(b.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    Smazat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Zpět na administraci
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub?: string;
  accent?: "emerald";
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent === "emerald" ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="text-2xl font-bold text-zinc-900">{value.toLocaleString("cs-CZ")}</div>
      <div className="text-sm font-medium text-zinc-600">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-400">{sub}</div>}
    </div>
  );
}

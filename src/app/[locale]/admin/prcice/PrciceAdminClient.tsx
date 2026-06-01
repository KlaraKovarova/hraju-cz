"use client";

import { useState } from "react";
import { Map, Save, X, ChevronDown, ChevronRight } from "lucide-react";

interface Route {
  id: string;
  year: number;
  routeName: string;
  distanceKm: number;
  participants: number;
  mapEmbed: string | null;
}

export default function PrciceAdminClient({ initialRoutes }: { initialRoutes: Route[] }) {
  const [routes, setRoutes] = useState(initialRoutes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  const years = [...new Set(routes.map((r) => r.year))].sort((a, b) => b - a);

  function startEdit(route: Route) {
    setEditingId(route.id);
    setEditValue(route.mapEmbed ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  async function save(id: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/prcice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, mapEmbed: editValue.trim() || null }),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, mapEmbed: updated.mapEmbed } : r)));
      setEditingId(null);
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);
    } catch {
      alert("Uložení se nezdařilo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {years.map((year) => {
        const yearRoutes = routes.filter((r) => r.year === year);
        const totalParticipants = yearRoutes.reduce((s, r) => s + r.participants, 0);
        const isExpanded = expandedYear === year;

        return (
          <div key={year} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
              onClick={() => setExpandedYear(isExpanded ? null : year)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                )}
                <span className="font-bold text-zinc-900">{year}</span>
                <span className="text-sm text-zinc-500">{yearRoutes.length} tras</span>
                <span className="text-sm text-zinc-500">·</span>
                <span className="text-sm text-zinc-500">{totalParticipants.toLocaleString("cs-CZ")} účastníků</span>
              </div>
              <span className="text-xs text-zinc-400">
                {yearRoutes.filter((r) => r.mapEmbed).length}/{yearRoutes.length} s mapou
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-zinc-100 divide-y divide-zinc-100">
                {yearRoutes.map((route) => (
                  <div key={route.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-zinc-900">{route.routeName}</span>
                          <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                            {route.distanceKm} km
                          </span>
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                            {route.participants.toLocaleString("cs-CZ")} účastníků
                          </span>
                          {route.mapEmbed && savedId !== route.id && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Map className="h-3 w-3" /> mapa
                            </span>
                          )}
                          {savedId === route.id && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                              ✓ Uloženo
                            </span>
                          )}
                        </div>

                        {editingId === route.id ? (
                          <div className="mt-3 space-y-2">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                              Embed kód mapy (iframe HTML)
                            </label>
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder='<iframe src="https://mapy.com/..." width="..." height="..."></iframe>'
                              rows={3}
                              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono text-zinc-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => save(route.id)}
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                              >
                                <Save className="h-3 w-3" />
                                {saving ? "Ukládám..." : "Uložit"}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-50"
                              >
                                <X className="h-3 w-3" />
                                Zrušit
                              </button>
                            </div>
                          </div>
                        ) : (
                          route.mapEmbed && (
                            <p className="mt-1 text-xs text-zinc-400 font-mono truncate max-w-lg">
                              {route.mapEmbed.slice(0, 80)}…
                            </p>
                          )
                        )}
                      </div>

                      {editingId !== route.id && (
                        <button
                          onClick={() => startEdit(route)}
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 transition"
                        >
                          <Map className="h-3 w-3" />
                          {route.mapEmbed ? "Upravit mapu" : "Přidat mapu"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

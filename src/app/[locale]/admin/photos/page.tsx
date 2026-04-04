"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Trash2 } from "lucide-react";

interface AdminPhoto {
  id: string;
  url: string;
  alt: string | null;
  isHidden: boolean;
  createdAt: string;
  user: { id: string; name: string | null; email: string; isSeed: boolean };
  facility: { id: string; name: string; slug: string };
  review: { id: string; title: string | null } | null;
  visit: { id: string } | null;
}

type Filter = "all" | "visible" | "hidden";

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/photos?filter=${filter}`)
      .then((r) => r.json())
      .then((d) => setPhotos(d.photos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  async function handleAction(photoId: string, action: "hide" | "unhide" | "delete") {
    const res = await fetch(`/api/admin/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      if (action === "delete") {
        setPhotos((ps) => ps.filter((p) => p.id !== photoId));
      } else {
        setPhotos((ps) =>
          ps.map((p) =>
            p.id === photoId ? { ...p, isHidden: action === "hide" } : p
          )
        );
      }
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Fotky uživatelů</h1>

      <div className="mb-4 flex gap-2">
        {(["all", "visible", "hidden"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {f === "all" ? "Vše" : f === "visible" ? "Viditelné" : "Skryté"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Načítání...</p>
      ) : photos.length === 0 ? (
        <p className="text-sm text-zinc-500">Žádné fotky k zobrazení.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`overflow-hidden rounded-xl border ${
                photo.isHidden ? "border-red-200 bg-red-50/30" : "border-zinc-100 bg-white"
              }`}
            >
              <div className="relative aspect-video">
                <img
                  src={photo.url}
                  alt={photo.alt || ""}
                  className={`h-full w-full object-cover ${photo.isHidden ? "opacity-40" : ""}`}
                />
                {photo.isHidden && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                      SKRYTÉ
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-700">
                    {photo.user.name || photo.user.email}
                  </span>
                  {photo.user.isSeed && (
                    <span className="ml-1 rounded bg-amber-100 px-1 text-amber-700">SEED</span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-zinc-400">
                  <Link
                    href={`/admin/facilities/${photo.facility.id}`}
                    className="text-emerald-600 hover:underline"
                  >
                    {photo.facility.name}
                  </Link>
                  {photo.review && " — recenze"}
                  {photo.visit && " — check-in"}
                </div>
                <div className="mt-0.5 text-xs text-zinc-400">
                  {new Date(photo.createdAt).toLocaleDateString("cs")}
                </div>

                <div className="mt-2 flex gap-2">
                  {photo.isHidden ? (
                    <button
                      onClick={() => handleAction(photo.id, "unhide")}
                      className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Zobrazit
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(photo.id, "hide")}
                      className="flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                      Skrýt
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Opravdu smazat fotku?")) handleAction(photo.id, "delete");
                    }}
                    className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Smazat
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

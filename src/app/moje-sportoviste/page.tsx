"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  AlertCircle,
  LogOut,
  Save,
  Building2,
  Loader2,
  Mail,
  BarChart3,
  Lock,
  TrendingUp,
  TrendingDown,
  Upload,
  Trash2,
  Star,
  ImageIcon,
} from "lucide-react";

interface FacilityImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  order: number;
}

interface FacilityAmenity {
  id: string;
  amenityId: string;
  amenity: { id: string; slug: string; name: string; nameCs: string; icon: string | null };
}

interface FacilityData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  postalCode: string | null;
  pricing: string | null;
  openingHours: Record<string, string> | null;
  website: string | null;
  bookingUrl: string | null;
  contacts: { id: string; type: string; value: string; isPrimary: boolean }[];
  sports: { sport: { slug: string; nameCs: string } }[];
  images: FacilityImage[];
  amenities: FacilityAmenity[];
}

interface AmenityOption {
  id: string;
  slug: string;
  name: string;
  nameCs: string;
  icon: string | null;
}

interface AnalyticsData {
  totalViews: number;
  thisWeekViews: number;
  lastWeekViews: number;
  dailyViews: { date: string; views: number }[];
  isPremium: boolean;
}

type AuthState = "loading" | "unauthenticated" | "authenticating" | "authenticated";

export default function MojeSportovistePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <MojeSportovisteContent />
    </Suspense>
  );
}

function MojeSportovisteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [authState, setAuthState] = useState<AuthState>("loading");
  const [authError, setAuthError] = useState<string | null>(null);
  const [facility, setFacility] = useState<FacilityData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    postalCode: "",
    phone: "",
    email: "",
    website: "",
    bookingUrl: "",
    pricing: "",
    openingHours: "",
  });

  const loadFacility = useCallback(async () => {
    try {
      const res = await fetch("/api/owner/facility");
      if (res.ok) {
        const data: FacilityData = await res.json();
        setFacility(data);
        const primaryPhone = data.contacts.find(
          (c) => c.type === "PHONE" && c.isPrimary
        );
        const primaryEmail = data.contacts.find(
          (c) => c.type === "EMAIL" && c.isPrimary
        );
        setForm({
          name: data.name || "",
          description: data.description || "",
          address: data.address || "",
          postalCode: data.postalCode || "",
          phone: primaryPhone?.value || "",
          email: primaryEmail?.value || "",
          website: data.website || "",
          bookingUrl: data.bookingUrl || "",
          pricing: data.pricing || "",
          openingHours: data.openingHours
            ? Object.entries(data.openingHours)
                .map(([day, hours]) => `${day}: ${hours}`)
                .join("\n")
            : "",
        });
        setAuthState("authenticated");
        // Fetch analytics in background
        fetch("/api/owner/analytics").then(async (r) => {
          if (r.ok) setAnalytics(await r.json());
        }).catch(() => {});
      } else {
        setAuthState("unauthenticated");
      }
    } catch {
      setAuthState("unauthenticated");
    }
  }, []);

  useEffect(() => {
    if (token) {
      setAuthState("authenticating");
      fetch("/api/owner/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).then(async (res) => {
        if (res.ok) {
          window.history.replaceState({}, "", "/moje-sportoviste");
          await loadFacility();
        } else {
          const data = await res.json();
          setAuthError(data.error || "Neplatný token");
          setAuthState("unauthenticated");
        }
      }).catch(() => {
        setAuthError("Chyba při ověřování");
        setAuthState("unauthenticated");
      });
    } else {
      loadFacility();
    }
  }, [token, loadFacility]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    let openingHours: Record<string, string> | undefined;
    if (form.openingHours.trim()) {
      openingHours = {};
      for (const line of form.openingHours.split("\n")) {
        const [day, ...rest] = line.split(":");
        if (day && rest.length > 0) {
          openingHours[day.trim()] = rest.join(":").trim();
        }
      }
    }

    try {
      const res = await fetch("/api/owner/facility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          address: form.address,
          postalCode: form.postalCode || null,
          phone: form.phone || null,
          email: form.email || null,
          website: form.website || null,
          bookingUrl: form.bookingUrl || null,
          pricing: form.pricing || null,
          openingHours: openingHours || null,
        }),
      });

      if (res.ok) {
        setSaved(true);
      } else {
        setSaveError("Nepodařilo se uložit změny.");
      }
    } catch {
      setSaveError("Chyba při ukládání.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/owner/auth", { method: "DELETE" });
    setAuthState("unauthenticated");
    setFacility(null);
  }

  // Loading state
  if (authState === "loading" || authState === "authenticating") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" />
          <p className="mt-3 text-sm text-zinc-500">
            {authState === "authenticating" ? "Ověřuji přístup..." : "Načítání..."}
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (authState === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
        <div className="max-w-md text-center">
          <Building2 className="mx-auto h-12 w-12 text-zinc-300" />
          <h1 className="mt-4 text-2xl font-bold text-zinc-900">
            Přístup pro provozovatele
          </h1>
          {authError ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {authError}
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">
              Pro úpravu vašeho sportoviště potřebujete přístupový odkaz.
              Zadejte svůj e-mail níže, nebo nás kontaktujte na{" "}
              <a href="mailto:klara@hraju.cz" className="text-emerald-600 hover:underline">
                klara@hraju.cz
              </a>
              .
            </p>
          )}
          <MagicLinkRequestForm />
          <Link
            href="/"
            className="mt-6 inline-block text-sm text-zinc-500 hover:text-zinc-700"
          >
            Zpět na hlavní stránku
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated — edit form
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <nav className="border-b border-zinc-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-extrabold text-zinc-900 hover:text-emerald-600"
            >
              hraju<span className="text-emerald-600">.cz</span>
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-sm font-medium text-zinc-700">
              {facility?.name}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
          >
            <LogOut className="h-4 w-4" />
            Odhlásit
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">
            Upravit sportoviště
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Změny se projeví okamžitě na webu.
          </p>
        </div>

        {/* Analytics section */}
        {analytics && (
          <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-zinc-600" />
              <h2 className="font-semibold text-zinc-900">Statistiky</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-2xl font-bold text-zinc-900">{analytics.totalViews}</p>
                <p className="text-xs text-zinc-500">Zobrazení za 30 dní</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-2xl font-bold text-zinc-900">{analytics.thisWeekViews}</p>
                <p className="text-xs text-zinc-500">Tento týden</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-zinc-900">{analytics.lastWeekViews}</p>
                  {analytics.thisWeekViews > analytics.lastWeekViews ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : analytics.thisWeekViews < analytics.lastWeekViews ? (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  ) : null}
                </div>
                <p className="text-xs text-zinc-500">Minulý týden</p>
              </div>
            </div>

            {analytics.isPremium ? (
              analytics.dailyViews.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-zinc-500">Posledních 14 dní</p>
                  <div className="flex items-end gap-1" style={{ height: 80 }}>
                    {analytics.dailyViews.map((d) => {
                      const max = Math.max(...analytics.dailyViews.map((v) => v.views), 1);
                      const h = Math.max((d.views / max) * 100, 4);
                      return (
                        <div
                          key={d.date}
                          className="flex-1 rounded-t bg-emerald-400"
                          style={{ height: `${h}%` }}
                          title={`${d.date}: ${d.views} zobrazení`}
                        />
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              <div className="relative mt-4 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-6 text-center">
                <div className="absolute inset-0 bg-zinc-50/80 backdrop-blur-sm" />
                <div className="relative">
                  <Lock className="mx-auto h-6 w-6 text-amber-500" />
                  <p className="mt-2 text-sm font-semibold text-zinc-700">
                    Podrobné statistiky jsou dostupné v Premium
                  </p>
                  <a
                    href="/pro"
                    className="mt-3 inline-block rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-600"
                  >
                    Upgradovat na Premium
                  </a>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Photos section */}
        {facility && (
          <PhotoManager
            facilityId={facility.id}
            images={facility.images}
            onUpdate={loadFacility}
          />
        )}

        {/* Amenities section */}
        {facility && (
          <AmenityManager
            currentAmenityIds={facility.amenities.map((a) => a.amenity.id)}
            onUpdate={loadFacility}
          />
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic info */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-zinc-900">
              Základní údaje
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Název sportoviště
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Popis
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
                    Adresa
                  </label>
                  <input
                    type="text"
                    required
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
                    PSČ
                  </label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => update("postalCode", e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Contact info */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-zinc-900">Kontakt</h2>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Webové stránky
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  placeholder="https://"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Rezervační systém
                </label>
                <input
                  type="url"
                  value={form.bookingUrl}
                  onChange={(e) => update("bookingUrl", e.target.value)}
                  placeholder="https://rezervace..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <p className="mt-1 text-xs text-zinc-400">
                  Odkaz na online rezervace (pokud máte)
                </p>
              </div>
            </div>
          </section>

          {/* Hours & Pricing */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-zinc-900">
              Provoz a ceny
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Otevírací doba
                </label>
                <textarea
                  rows={4}
                  value={form.openingHours}
                  onChange={(e) => update("openingHours", e.target.value)}
                  placeholder={"po: 8:00 - 22:00\nút: 8:00 - 22:00\nst: 8:00 - 22:00"}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <p className="mt-1 text-xs text-zinc-400">
                  Formát: den: hodiny (jeden řádek na den)
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Ceník
                </label>
                <textarea
                  rows={3}
                  value={form.pricing}
                  onChange={(e) => update("pricing", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>
          </section>

          {/* Save */}
          {saveError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {saveError}
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Změny byly uloženy.
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Ukládání..." : "Uložit změny"}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Photo Manager Component ---
function PhotoManager({
  facilityId,
  images,
  onUpdate,
}: {
  facilityId: string;
  images: FacilityImage[];
  onUpdate: () => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/owner/photos", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await onUpdate();
      } else {
        const data = await res.json();
        setError(data.error || "Nahrání selhalo.");
      }
    } catch {
      setError("Chyba při nahrávání.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(imageId: string) {
    try {
      const res = await fetch(`/api/owner/photos/${imageId}`, {
        method: "DELETE",
      });
      if (res.ok) await onUpdate();
    } catch {
      // ignore
    }
  }

  async function handleSetPrimary(imageId: string) {
    try {
      const res = await fetch(`/api/owner/photos/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });
      if (res.ok) await onUpdate();
    } catch {
      // ignore
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-zinc-600" />
        <h2 className="font-semibold text-zinc-900">Fotky</h2>
        <span className="text-xs text-zinc-400">({images.length}/10)</span>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-xl border border-zinc-200"
            >
              <Image
                src={img.url}
                alt={img.alt ?? "Fotka sportoviště"}
                width={300}
                height={200}
                className="h-32 w-full object-cover"
              />
              {img.isPrimary && (
                <span className="absolute left-2 top-2 rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Hlavní
                </span>
              )}
              <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(img.id)}
                    className="rounded-md bg-white/90 p-1.5 text-amber-600 shadow hover:bg-white"
                    title="Nastavit jako hlavní"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  className="rounded-md bg-white/90 p-1.5 text-red-600 shadow hover:bg-white"
                  title="Smazat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length < 10 && (
        <label
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-500 transition hover:border-emerald-400 hover:text-emerald-600 ${
            uploading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          {uploading ? "Nahrávání..." : "Nahrát fotku"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}

      <p className="mt-2 text-xs text-zinc-400">
        JPEG, PNG nebo WebP. Max 5 MB na soubor.
      </p>
    </section>
  );
}

// --- Amenity Manager Component ---
function AmenityManager({
  currentAmenityIds,
  onUpdate,
}: {
  currentAmenityIds: string[];
  onUpdate: () => Promise<void>;
}) {
  const [allAmenities, setAllAmenities] = useState<AmenityOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(currentAmenityIds));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSelected(new Set(currentAmenityIds));
  }, [currentAmenityIds]);

  useEffect(() => {
    fetch("/api/amenities")
      .then(async (res) => {
        if (res.ok) {
          setAllAmenities(await res.json());
          setLoaded(true);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/owner/amenities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amenityIds: Array.from(selected) }),
      });
      if (res.ok) {
        setSaved(true);
        await onUpdate();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSaved(false);
  }

  if (!loaded || allAmenities.length === 0) return null;

  const hasChanges = (() => {
    if (selected.size !== currentAmenityIds.length) return true;
    for (const id of currentAmenityIds) {
      if (!selected.has(id)) return true;
    }
    return false;
  })();

  return (
    <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="mb-3 font-semibold text-zinc-900">Vybavení</h2>
      <div className="flex flex-wrap gap-2">
        {allAmenities.map((amenity) => (
          <button
            key={amenity.id}
            type="button"
            onClick={() => toggle(amenity.id)}
            className={`rounded-xl border px-3 py-1.5 text-sm transition ${
              selected.has(amenity.id)
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {amenity.icon && <span className="mr-1">{amenity.icon}</span>}
            {amenity.nameCs}
          </button>
        ))}
      </div>
      {hasChanges && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Ukládání..." : "Uložit vybavení"}
        </button>
      )}
      {saved && (
        <p className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          Vybavení uloženo.
        </p>
      )}
    </section>
  );
}

function MagicLinkRequestForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);

    try {
      await fetch("/api/owner/request-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
        <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500" />
        <p className="mt-2">
          Pokud e-mail odpovídá našim záznamům, odeslali jsme vám přihlašovací
          odkaz. Zkontrolujte svou e-mailovou schránku.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleRequest} className="mt-4 space-y-3">
      <input
        type="email"
        required
        placeholder="Váš e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
      />
      <button
        type="submit"
        disabled={sending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {sending ? "Odesílání..." : "Zaslat přihlašovací odkaz"}
      </button>
    </form>
  );
}

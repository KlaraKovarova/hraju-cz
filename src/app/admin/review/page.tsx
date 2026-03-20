"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Image,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

interface FacilityReview {
  id: string;
  name: string;
  slug: string;
  city: string;
  region: string | null;
  address: string;
  sports: string[];
  sportSlugs: string[];
  hasPhone: boolean;
  hasEmail: boolean;
  hasWebsite: boolean;
  hasCoords: boolean;
  hasDescription: boolean;
  hasHours: boolean;
  hasImages: boolean;
  isClaimed: boolean;
  isPremium: boolean;
  flags: string[];
  url: string;
}

interface ApiResponse {
  facilities: FacilityReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ISSUE_FILTERS = [
  { key: "", label: "Vše", icon: null },
  { key: "NO_COORDS", label: "Bez souřadnic", icon: MapPin },
  { key: "NO_CONTACTS", label: "Bez kontaktů", icon: Phone },
  { key: "NO_PHONE", label: "Bez telefonu", icon: Phone },
  { key: "NO_WEB", label: "Bez webu", icon: Globe },
  { key: "NO_HOURS", label: "Bez hod.", icon: Clock },
  { key: "NO_IMAGES", label: "Bez fotek", icon: Image },
  { key: "NO_DESC", label: "Bez popisu", icon: FileText },
] as const;

const FLAG_LABELS: Record<string, { label: string; severity: "high" | "medium" | "low" }> = {
  NO_COORDS: { label: "Souřadnice", severity: "high" },
  NO_CONTACTS: { label: "Kontakty", severity: "high" },
  NO_PHONE: { label: "Telefon", severity: "medium" },
  NO_DESC: { label: "Popis", severity: "medium" },
  NO_WEB: { label: "Web", severity: "medium" },
  NO_HOURS: { label: "Hod. doba", severity: "medium" },
  NO_ZIP: { label: "PSČ", severity: "medium" },
  NO_IMAGES: { label: "Fotky", severity: "low" },
};

const SEVERITY_COLORS = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-zinc-100 text-zinc-500",
};

export default function AdminReviewPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [issueFilter, setIssueFilter] = useState("");
  const [sportFilter, setSportFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "50");
      if (issueFilter) params.set("issue", issueFilter);
      if (sportFilter) params.set("sport", sportFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/facility-review?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, issueFilter, sportFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function handleIssueFilter(key: string) {
    setIssueFilter(key);
    setPage(1);
  }

  function handleSportFilter(slug: string) {
    setSportFilter(slug);
    setPage(1);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Kontrola sportovist</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Seznam sportovist k lidske kontrole spravnosti udaju
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Hledat nazev, mesto, adresu..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Hledat
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setPage(1);
            }}
            className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-200"
          >
            Zrusit
          </button>
        )}
      </form>

      {/* Issue filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {ISSUE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => handleIssueFilter(f.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              issueFilter === f.key
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {f.icon && <f.icon className="h-3.5 w-3.5" />}
            {f.label}
          </button>
        ))}
      </div>

      {/* Sport filter */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {[
          { slug: "", label: "Vsechny sporty" },
          { slug: "tenis", label: "Tenis" },
          { slug: "squash", label: "Squash" },
          { slug: "badminton", label: "Badminton" },
          { slug: "volejbal", label: "Volejbal" },
          { slug: "plavani", label: "Plavani" },
          { slug: "golf", label: "Golf" },
          { slug: "fitness", label: "Fitness" },
          { slug: "lezeni", label: "Lezeni" },
          { slug: "ferraty", label: "Ferraty" },
        ].map((s) => (
          <button
            key={s.slug}
            onClick={() => handleSportFilter(s.slug)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              sportFilter === s.slug
                ? "bg-indigo-600 text-white"
                : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Results summary */}
      {data && !loading && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Celkem <span className="font-semibold text-zinc-900">{data.total}</span> sportovist
            {data.totalPages > 1 && (
              <> &middot; strana {data.page} z {data.totalPages}</>
            )}
          </p>
        </div>
      )}

      {/* Facility list */}
      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">Nacitani...</p>
      ) : !data || data.facilities.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">Zadna sportoviste.</p>
      ) : (
        <div className="space-y-2">
          {data.facilities.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900 truncate">
                      {f.name}
                    </span>
                    {f.isClaimed && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                        <CheckCircle2 className="h-3 w-3" /> claimed
                      </span>
                    )}
                    {f.isPremium && (
                      <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                        premium
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                    <span>{f.city}{f.region ? `, ${f.region}` : ""}</span>
                    <span>&middot;</span>
                    <span>{f.sports.join(", ")}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-400 truncate">
                    {f.address}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* Data completeness indicators */}
                  <div className="flex gap-1">
                    <Indicator ok={f.hasCoords} label="GPS" />
                    <Indicator ok={f.hasPhone} label="Tel" />
                    <Indicator ok={f.hasWebsite} label="Web" />
                    <Indicator ok={f.hasDescription} label="Popis" />
                    <Indicator ok={f.hasHours} label="Hod" />
                    <Indicator ok={f.hasImages} label="Foto" />
                  </div>

                  <div className="flex gap-1.5">
                    <Link
                      href={`/admin/facilities/${f.id}`}
                      className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                    >
                      Upravit
                    </Link>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-zinc-50 px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Quality flags */}
              {f.flags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {f.flags.map((flag) => {
                    const info = FLAG_LABELS[flag];
                    if (!info) return null;
                    return (
                      <span
                        key={flag}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${SEVERITY_COLORS[info.severity]}`}
                      >
                        {info.severity === "high" && (
                          <AlertTriangle className="h-2.5 w-2.5" />
                        )}
                        {info.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Predchozi
          </button>
          <span className="text-sm text-zinc-500">
            {page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page >= data.totalPages}
            className="flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          >
            Dalsi
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function Indicator({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      title={label}
      className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${
        ok
          ? "bg-emerald-50 text-emerald-600"
          : "bg-red-50 text-red-400"
      }`}
    >
      {label}
    </span>
  );
}

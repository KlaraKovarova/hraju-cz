"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  XCircle,
  CheckCircle,
  Circle,
} from "lucide-react";

interface FacilityReview {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string;
  region: string | null;
  address: string;
  sports: string[];
  sportSlugs: string[];
  hasPhone: boolean;
  hasWebsite: boolean;
  hasCoords: boolean;
  hasDescription: boolean;
  isClaimed: boolean;
  isPremium: boolean;
  isApproved: boolean;
  approvedAt: string | null;
  flags: string[];
  website: string | null;
  listingUrl: string;
}

interface ApiResponse {
  facilities: FacilityReview[];
  total: number;
  unapprovedCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminReviewPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<"" | "unapproved" | "approved">("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [deactivatedCount, setDeactivatedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "50");
      if (sportFilter) params.set("sport", sportFilter);
      if (approvalFilter) params.set("approval", approvalFilter);
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
  }, [page, sportFilter, approvalFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDeactivate(id: string, name: string) {
    if (!confirm(`Opravdu deaktivovat "${name}"?`)) return;

    setDeactivating(id);
    setError(null);
    try {
      const res = await fetch(`/api/facilities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Chyba ${res.status} při deaktivaci`);
        return;
      }
      setDeactivatedCount((c) => c + 1);
      setData((prev) =>
        prev
          ? {
              ...prev,
              facilities: prev.facilities.filter((f) => f.id !== id),
              total: prev.total - 1,
            }
          : prev
      );
    } catch (e) {
      setError(`Síťová chyba: ${e instanceof Error ? e.message : "neznámá chyba"}`);
    } finally {
      setDeactivating(null);
    }
  }

  async function handleApproval(id: string, approve: boolean) {
    setApproving(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/facility-review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId: id, isApproved: approve }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Chyba ${res.status} při ${approve ? "schvalování" : "odschvalování"}`);
        return;
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              unapprovedCount: prev.unapprovedCount + (approve ? -1 : 1),
              facilities: prev.facilities.map((f) =>
                f.id === id
                  ? { ...f, isApproved: approve, approvedAt: approve ? new Date().toISOString() : null }
                  : f
              ),
            }
          : prev
      );
    } catch (e) {
      setError(`Síťová chyba: ${e instanceof Error ? e.message : "neznámá chyba"}`);
    } finally {
      setApproving(null);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Kontrola sportovišť</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Zkontrolujte, schvalte nebo deaktivujte sportoviště
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data && data.unapprovedCount > 0 && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-600">
              Neschváleno: {data.unapprovedCount}
            </span>
          )}
          {deactivatedCount > 0 && (
            <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-600">
              Deaktivováno: {deactivatedCount}
            </span>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600">&times;</button>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Hledat název, město, adresu..."
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
            Zrušit
          </button>
        )}
      </form>

      {/* Approval filter */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {([
          { key: "" as const, label: "Vše" },
          { key: "unapproved" as const, label: "Neschválené" },
          { key: "approved" as const, label: "Schválené" },
        ]).map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setApprovalFilter(f.key);
              setPage(1);
            }}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              approvalFilter === f.key
                ? "bg-emerald-600 text-white"
                : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            {f.label}
            {f.key === "unapproved" && data ? ` (${data.unapprovedCount})` : ""}
          </button>
        ))}
      </div>

      {/* Sport filter */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {[
          { slug: "", label: "Všechny sporty" },
          { slug: "tenis", label: "Tenis" },
          { slug: "squash", label: "Squash" },
          { slug: "badminton", label: "Badminton" },
          { slug: "plavani", label: "Plavání" },
          { slug: "fitness", label: "Fitness" },
          { slug: "lezeni", label: "Lezení" },
          { slug: "ferraty", label: "Ferraty" },
        ].map((s) => (
          <button
            key={s.slug}
            onClick={() => {
              setSportFilter(s.slug);
              setPage(1);
            }}
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
        <div className="mb-4">
          <p className="text-sm text-zinc-500">
            Celkem <span className="font-semibold text-zinc-900">{data.total}</span> sportovišť
            {data.totalPages > 1 && (
              <> &middot; strana {data.page} z {data.totalPages}</>
            )}
          </p>
        </div>
      )}

      {/* Facility list */}
      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">Načítání...</p>
      ) : !data || data.facilities.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">Žádná sportoviště.</p>
      ) : (
        <div className="space-y-2">
          {data.facilities.map((f) => (
            <div
              key={f.id}
              className={`rounded-xl border px-4 py-3 ${
                f.isApproved
                  ? "border-zinc-200 bg-white"
                  : "border-amber-200 bg-amber-50/30"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Name + badges */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900">
                      {f.name}
                    </span>
                    {f.isApproved ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                        <CheckCircle className="h-2.5 w-2.5" />
                        schváleno
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                        <Circle className="h-2.5 w-2.5" />
                        neschváleno
                      </span>
                    )}
                    {f.isClaimed && (
                      <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                        claimed
                      </span>
                    )}
                  </div>

                  {/* Category (sports) + City */}
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                    <span className="font-medium text-zinc-600">
                      {f.sports.join(", ") || "Bez kategorie"}
                    </span>
                    <span>&middot;</span>
                    <span>{f.city}{f.region ? `, ${f.region}` : ""}</span>
                  </div>

                  {/* Description */}
                  {f.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400 line-clamp-2">
                      {f.description}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs italic text-zinc-300">
                      Bez popisu
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  {/* Approve / Unapprove */}
                  {f.isApproved ? (
                    <button
                      onClick={() => handleApproval(f.id, false)}
                      disabled={approving === f.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-50"
                      title="Zrušit schválení"
                    >
                      <Circle className="h-3 w-3" />
                      Odschválit
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApproval(f.id, true)}
                      disabled={approving === f.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      title="Schválit sportoviště"
                    >
                      <CheckCircle className="h-3 w-3" />
                      {approving === f.id ? "..." : "Schválit"}
                    </button>
                  )}
                  {f.website ? (
                    <a
                      href={f.website.startsWith("http") ? f.website : `https://${f.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100"
                      title="Web sportoviště"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Web
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-300" title="Nemá web">
                      <ExternalLink className="h-3 w-3" />
                      Web
                    </span>
                  )}
                  <Link
                    href={f.listingUrl}
                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100"
                    title="Zobrazit listing"
                  >
                    Listing
                  </Link>
                  <Link
                    href={`/admin/facilities/${f.id}`}
                    className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                  >
                    Upravit
                  </Link>
                  <button
                    onClick={() => handleDeactivate(f.id, f.name)}
                    disabled={deactivating === f.id}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {deactivating === f.id ? "..." : "Deaktivovat"}
                  </button>
                </div>
              </div>
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
            Předchozí
          </button>
          <span className="text-sm text-zinc-500">
            {page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page >= data.totalPages}
            className="flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          >
            Další
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

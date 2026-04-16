"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  EyeOff,
  Eye,
  Trash2,
  Flag,
  User,
  Clock,
  Building2,
} from "lucide-react";
import { CONDITION_RATING_META, type ConditionRating } from "@/lib/conditions";

interface AdminConditionReport {
  id: string;
  rating: string;
  comment: string | null;
  helpful: number;
  flagCount: number;
  visitedAt: string;
  createdAt: string;
  isHidden: boolean;
  facility: {
    id: string;
    name: string;
    slug: string;
    sports: { sport: { slug: string } }[];
  };
  user: { id: string; name: string | null; email: string };
  photos: { id: string; url: string; alt: string | null }[];
}

interface ListResponse {
  reports: AdminConditionReport[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function AdminConditionsClient() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showHidden) params.set("showHidden", "1");
      if (flaggedOnly) params.set("flaggedOnly", "1");
      params.set("page", String(page));
      const res = await fetch(`/api/admin/conditions?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [showHidden, flaggedOnly, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [showHidden, flaggedOnly]);

  async function handleHide(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/conditions/${id}/hide`, {
        method: "POST",
      });
      if (res.ok) await fetchReports();
    } finally {
      setBusyId(null);
    }
  }

  async function handleUnhide(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/conditions/${id}/unhide`, {
        method: "POST",
      });
      if (res.ok) await fetchReports();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        "Opravdu smazat tento report? Akce je nevratná (odstraní i vazbu na fotky)."
      )
    ) {
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/conditions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) await fetchReports();
    } finally {
      setBusyId(null);
    }
  }

  const reports = data?.reports ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
          <Activity className="h-6 w-6 text-emerald-500" />
          Aktuální podmínky — moderace
        </h1>
        {data && (
          <span className="text-xs text-zinc-500">
            Celkem {data.total} · strana {data.page} / {data.totalPages}
          </span>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
          />
          Zobrazit skryté
        </label>
        <label className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => setFlaggedOnly(e.target.checked)}
          />
          Jen s nahlášením
        </label>
      </div>

      {loading && !data ? (
        <p className="text-sm text-zinc-500">Načítání…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-zinc-500">Žádné reporty.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              busy={busyId === r.id}
              onHide={() => handleHide(r.id)}
              onUnhide={() => handleUnhide(r.id)}
              onDelete={() => handleDelete(r.id)}
            />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="rounded-lg bg-white px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-40"
          >
            ← Předchozí
          </button>
          <span className="text-xs text-zinc-500">
            Strana {page} / {data.totalPages}
          </span>
          <button
            type="button"
            onClick={() =>
              setPage((p) => Math.min(data.totalPages, p + 1))
            }
            disabled={page >= data.totalPages || loading}
            className="rounded-lg bg-white px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-40"
          >
            Další →
          </button>
        </div>
      )}
    </div>
  );
}

function ReportRow({
  report,
  busy,
  onHide,
  onUnhide,
  onDelete,
}: {
  report: AdminConditionReport;
  busy: boolean;
  onHide: () => void;
  onUnhide: () => void;
  onDelete: () => void;
}) {
  const meta =
    CONDITION_RATING_META[report.rating as ConditionRating] ??
    CONDITION_RATING_META.good;

  const rowClass = [
    "rounded-2xl border bg-white p-5",
    report.flagCount > 0 ? "border-red-300 ring-1 ring-red-100" : "border-zinc-200",
    report.isHidden ? "opacity-60" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rowClass}>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-zinc-400" />
            <Link
              href={
                report.facility.sports[0]?.sport.slug
                  ? `/sport/${report.facility.sports[0].sport.slug}/${report.facility.slug}#podminky`
                  : `/${report.facility.slug}`
              }
              target="_blank"
              className="truncate font-semibold text-zinc-900 hover:text-emerald-700"
            >
              {report.facility.name}
            </Link>
            <span
              className="ml-1 inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-700"
              aria-label={`Hodnocení: ${meta.labelCs}`}
            >
              <span aria-hidden>{meta.emoji}</span>
              {meta.labelCs}
            </span>
            {report.flagCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                <Flag className="h-3 w-3" />
                {report.flagCount}
              </span>
            )}
            {report.isHidden && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                <EyeOff className="h-3 w-3" />
                skryto
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <Link
              href={`/uzivatel/${report.user.id}`}
              target="_blank"
              className="flex items-center gap-1 hover:text-zinc-700"
            >
              <User className="h-3 w-3" />
              {report.user.name || "—"} ({report.user.email})
            </Link>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(report.createdAt).toLocaleString("cs")}
            </span>
            <span>👍 {report.helpful}</span>
          </div>
        </div>
      </div>

      {report.comment && (
        <p className="mb-3 whitespace-pre-line rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
          {report.comment}
        </p>
      )}

      {report.photos.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {report.photos.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-16 w-16 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50"
            >
              <Image
                src={p.url}
                alt={p.alt || "Foto aktuálního stavu"}
                width={96}
                height={96}
                className="h-full w-full object-cover"
                unoptimized
              />
            </a>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
        {report.isHidden ? (
          <button
            type="button"
            onClick={onUnhide}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <Eye className="h-4 w-4" />
            Obnovit
          </button>
        ) : (
          <button
            type="button"
            onClick={onHide}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-60"
          >
            <EyeOff className="h-4 w-4" />
            Skrýt
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          Smazat
        </button>
      </div>
    </div>
  );
}

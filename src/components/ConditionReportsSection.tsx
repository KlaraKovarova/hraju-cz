"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThumbsUp, Activity, Flag } from "lucide-react";
import { CONDITION_RATING_META, type ConditionRating } from "@/lib/conditions";
import { ConditionReportForm } from "./ConditionReportForm";

type LocalGuideTier = "bronze" | "silver" | "gold";

interface ConditionReport {
  id: string;
  rating: ConditionRating | string;
  comment: string | null;
  helpful: number;
  visitedAt: string;
  createdAt: string;
  user: { id: string; name: string | null; localGuideTier?: LocalGuideTier | null };
  photos: { id: string; url: string; alt: string | null }[];
}

const LOCAL_GUIDE_TIER_META: Record<LocalGuideTier, { label: string; classes: string }> = {
  bronze: {
    label: "Průvodce",
    classes: "bg-amber-50 text-amber-700 border-amber-100",
  },
  silver: {
    label: "Zkušený průvodce",
    classes: "bg-zinc-100 text-zinc-700 border-zinc-200",
  },
  gold: {
    label: "Expert průvodce",
    classes: "bg-yellow-50 text-yellow-800 border-yellow-200",
  },
};

interface ConditionReportsSectionProps {
  facilityId: string;
  currentPath: string;
  sportSlug: string;
  slug: string;
  /** Pre-fetched on the server to avoid a client round-trip on first paint */
  initialReports?: ConditionReport[];
}

function timeAgoCs(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "právě teď";
  if (minutes < 60) return `před ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `před ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "včera";
  if (days < 7) return `před ${days} dny`;
  const weeks = Math.round(days / 7);
  if (weeks === 1) return "před týdnem";
  return `před ${weeks} týdny`;
}

const HELPFUL_STORAGE_PREFIX = "condition-helpful-v1:";
const FLAGGED_STORAGE_PREFIX = "condition-flagged-v1:";

function hasVoted(reportId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(HELPFUL_STORAGE_PREFIX + reportId) === "1";
  } catch {
    return false;
  }
}

function markVoted(reportId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HELPFUL_STORAGE_PREFIX + reportId, "1");
  } catch {
    /* ignore quota / privacy errors */
  }
}

function hasFlagged(reportId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(FLAGGED_STORAGE_PREFIX + reportId) === "1";
  } catch {
    return false;
  }
}

function markFlagged(reportId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FLAGGED_STORAGE_PREFIX + reportId, "1");
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function ConditionReportsSection({
  facilityId,
  currentPath,
  sportSlug,
  slug,
  initialReports,
}: ConditionReportsSectionProps) {
  const [reports, setReports] = useState<ConditionReport[]>(initialReports ?? []);
  const [loading, setLoading] = useState(!initialReports);
  const [showForm, setShowForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.userId) setCurrentUserId(data.userId);
      })
      .catch(() => {
        /* anonymous visitor — flag UI stays hidden */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/conditions`);
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data.reports) ? data.reports : []);
      }
    } catch {
      /* keep previous state on failure */
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    if (!initialReports) {
      fetchReports();
    }
  }, [fetchReports, initialReports]);

  const fullHistoryHref = `/sport/${sportSlug}/${slug}/podminky`;
  const hasReports = reports.length > 0;

  return (
    <section
      id="podminky"
      className="rounded-2xl border border-zinc-100 bg-white p-6 scroll-mt-4"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900">
          <Activity className="h-5 w-5 text-emerald-500" />
          Aktuální podmínky
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
        >
          {showForm ? "Zavřít" : "Nahlásit stav"}
        </button>
      </div>

      <p className="mb-4 text-xs text-zinc-500">
        Reporty za posledních 7 dní od uživatelů hraju.cz.
      </p>

      {showForm && (
        <div className="mb-4 rounded-xl bg-zinc-50/60 p-4">
          <ConditionReportForm
            facilityId={facilityId}
            currentPath={currentPath}
            onSubmitted={() => {
              setShowForm(false);
              fetchReports();
            }}
          />
        </div>
      )}

      {loading && !hasReports && (
        <p className="text-sm text-zinc-400">Načítání…</p>
      )}

      {!loading && !hasReports && (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-5 text-center">
          <p className="text-sm text-zinc-600">
            Zatím žádné reporty.{" "}
            <span className="font-semibold text-zinc-800">
              Buďte první, kdo se podělí o aktuální stav!
            </span>
          </p>
        </div>
      )}

      {hasReports && (
        <ul className="space-y-3">
          {reports.map((report) => (
            <ConditionReportCard
              key={report.id}
              facilityId={facilityId}
              report={report}
              currentUserId={currentUserId}
              onVoted={(helpful) =>
                setReports((prev) =>
                  prev.map((r) => (r.id === report.id ? { ...r, helpful } : r))
                )
              }
            />
          ))}
        </ul>
      )}

      {hasReports && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {(sportSlug === "ferraty" || sportSlug === "lezeni") ? (
            <Link
              href="/nejlepsi-podminky"
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              Nejlepší podmínky tento víkend →
            </Link>
          ) : <span />}
          <Link
            href={fullHistoryHref}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            Zobrazit všechny →
          </Link>
        </div>
      )}
    </section>
  );
}

function ConditionReportCard({
  facilityId,
  report,
  currentUserId,
  onVoted,
}: {
  facilityId: string;
  report: ConditionReport;
  currentUserId: string | null;
  onVoted: (helpful: number) => void;
}) {
  const meta =
    CONDITION_RATING_META[report.rating as ConditionRating] ??
    CONDITION_RATING_META.good;
  const [voted, setVoted] = useState(false);
  const [pending, setPending] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [flagPending, setFlagPending] = useState(false);

  useEffect(() => {
    setVoted(hasVoted(report.id));
    setFlagged(hasFlagged(report.id));
  }, [report.id]);

  async function handleHelpful() {
    if (voted || pending) return;
    setPending(true);
    try {
      const res = await fetch(
        `/api/facilities/${facilityId}/conditions/${report.id}/helpful`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        markVoted(report.id);
        setVoted(true);
        onVoted(typeof data.helpful === "number" ? data.helpful : report.helpful + 1);
      }
    } catch {
      /* swallow */
    } finally {
      setPending(false);
    }
  }

  async function handleFlag() {
    if (flagged || flagPending) return;
    if (!window.confirm("Opravdu nahlásit tento report jako spam nebo nevhodný?")) {
      return;
    }
    setFlagPending(true);
    try {
      const res = await fetch(
        `/api/facilities/${facilityId}/conditions/${report.id}/flag`,
        { method: "POST" }
      );
      if (res.ok) {
        markFlagged(report.id);
        setFlagged(true);
      } else if (res.status === 401) {
        window.location.href = "/prihlaseni";
      }
    } catch {
      /* swallow */
    } finally {
      setFlagPending(false);
    }
  }

  const canFlag =
    !!currentUserId &&
    !!report.user?.id &&
    currentUserId !== report.user.id;

  const authorLabel = report.user.name || "Uživatel";
  const guideTier = report.user.localGuideTier ?? null;
  const guideMeta = guideTier ? LOCAL_GUIDE_TIER_META[guideTier] : null;

  return (
    <li className="rounded-xl border border-zinc-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700"
            aria-label={`Hodnocení: ${meta.labelCs}`}
          >
            <span aria-hidden>{meta.emoji}</span>
            {meta.labelCs}
          </span>
          <Link
            href={`/uzivatel/${report.user.id}`}
            className="text-sm font-medium text-zinc-800 hover:text-emerald-600"
          >
            {authorLabel}
          </Link>
          {guideMeta && (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${guideMeta.classes}`}
              title={`Místní průvodce: ${guideMeta.label}`}
            >
              <span aria-hidden>🗺️</span>
              {guideMeta.label}
            </span>
          )}
        </div>
        <time
          dateTime={report.createdAt}
          className="shrink-0 text-xs text-zinc-400"
          title={new Date(report.createdAt).toLocaleString("cs")}
        >
          {timeAgoCs(report.createdAt)}
        </time>
      </div>

      {report.comment && (
        <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">
          {report.comment}
        </p>
      )}

      {report.photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {report.photos.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-16 w-16 overflow-hidden rounded-md border border-zinc-100 bg-zinc-50"
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

      <div className="mt-3 flex items-center justify-between gap-2">
        {canFlag ? (
          <button
            type="button"
            onClick={handleFlag}
            disabled={flagged || flagPending}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition ${
              flagged
                ? "bg-red-50 text-red-700"
                : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
            } disabled:cursor-not-allowed`}
            aria-pressed={flagged}
            title={flagged ? "Nahlášeno" : "Nahlásit spam nebo nevhodný obsah"}
          >
            <Flag className="h-3 w-3" />
            {flagged ? "Nahlášeno" : "Nahlásit"}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleHelpful}
          disabled={voted || pending}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition ${
            voted
              ? "bg-emerald-50 text-emerald-700"
              : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
          } disabled:cursor-not-allowed`}
          aria-pressed={voted}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {voted ? "Díky za hlas" : "Užitečné"}
          {report.helpful > 0 && <span className="font-medium">· {report.helpful}</span>}
        </button>
      </div>
    </li>
  );
}

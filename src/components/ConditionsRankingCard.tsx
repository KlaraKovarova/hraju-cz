import Link from "next/link";
import { MapPin, MessageSquare } from "lucide-react";
import { ALLOWED_CONDITION_RATINGS, CONDITION_RATING_META } from "@/lib/conditions";
import type { CurationRow } from "@/lib/conditions-curation";

interface ConditionsRankingCardProps {
  row: CurationRow;
}

function timeAgoCs(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "právě teď";
  if (minutes < 60) return `před ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `před ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "včera";
  if (days < 7) return `před ${days} dny`;
  return `před týdnem`;
}

export function ConditionsRankingCard({ row }: ConditionsRankingCardProps) {
  const href = `/sport/${row.facility.sportSlug}/${row.facility.slug}#podminky`;
  const { distribution, reportCount, positiveRatio, rank } = row;
  const positivePct = Math.round(positiveRatio * 100);

  return (
    <li
      className="
        flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-5 transition
        hover:border-emerald-200 hover:shadow-sm
        sm:flex-row sm:items-start sm:gap-5
      "
    >
      {/* Rank */}
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${
          rank === 1
            ? "bg-amber-100 text-amber-700"
            : rank === 2
              ? "bg-zinc-100 text-zinc-600"
              : rank === 3
                ? "bg-orange-100 text-orange-700"
                : "bg-emerald-50 text-emerald-700"
        }`}
        aria-label={`Pozice ${rank}`}
      >
        {rank}
      </div>

      <div className="min-w-0 flex-1">
        {/* Title + meta */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <Link
            href={href}
            className="text-base font-semibold text-zinc-900 hover:text-emerald-700"
          >
            {row.facility.name}
          </Link>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            {row.facility.sportNameCs}
          </span>
        </div>

        <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
          <MapPin className="h-3 w-3" aria-hidden />
          <span>
            {row.facility.city}
            {row.facility.region ? ` · ${row.facility.region}` : ""}
          </span>
        </p>

        {/* Distribution bar */}
        <div
          className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-zinc-100"
          role="img"
          aria-label={`Hodnocení reportů: ${positivePct}% pozitivních`}
        >
          {ALLOWED_CONDITION_RATINGS.map((rating) => {
            const count = distribution[rating];
            if (!count) return null;
            const widthPct = (count / reportCount) * 100;
            const bg =
              rating === "excellent"
                ? "bg-emerald-500"
                : rating === "good"
                  ? "bg-amber-400"
                  : rating === "poor"
                    ? "bg-orange-400"
                    : "bg-rose-500";
            return (
              <div
                key={rating}
                className={bg}
                style={{ width: `${widthPct}%` }}
                title={`${CONDITION_RATING_META[rating].labelCs}: ${count}`}
              />
            );
          })}
        </div>

        {/* Counts */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" aria-hidden />
            {reportCount} {reportCount === 1 ? "report" : reportCount <= 4 ? "reporty" : "reportů"}
          </span>
          <span className="font-medium text-emerald-700">{positivePct}% pozitivních</span>
        </div>

        {/* Latest excerpt */}
        {row.latestExcerpt && (
          <blockquote className="mt-3 border-l-2 border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-zinc-700">
            <span aria-hidden className="mr-1">
              {CONDITION_RATING_META[row.latestExcerpt.rating].emoji}
            </span>
            „{row.latestExcerpt.text}“
            <span className="ml-2 text-xs text-zinc-400">
              — {timeAgoCs(row.latestExcerpt.createdAt)}
            </span>
          </blockquote>
        )}

        <div className="mt-3">
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Zobrazit detail sportoviště →
          </Link>
        </div>
      </div>
    </li>
  );
}

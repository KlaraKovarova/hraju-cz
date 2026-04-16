import Link from "next/link";
import Image from "next/image";
import { Activity } from "lucide-react";
import { CONDITION_RATING_META, type ConditionRating } from "@/lib/conditions";
import type { RecentConditionReport } from "@/lib/data";

interface HomeRecentConditionsProps {
  reports: RecentConditionReport[];
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
  const weeks = Math.round(days / 7);
  if (weeks === 1) return "před týdnem";
  return `před ${weeks} týdny`;
}

function excerpt(text: string | null, max: number = 110): string | null {
  if (!text) return null;
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + "…";
}

export function HomeRecentConditions({ reports }: HomeRecentConditionsProps) {
  if (!reports || reports.length === 0) return null;

  return (
    <section className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6 flex flex-col items-center text-center">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900">
            <Activity className="h-5 w-5 text-emerald-500" />
            Nejnovější reporty z míst
          </h2>
          <p className="mt-2 text-zinc-500">
            Aktuální stav sportovišť od komunity (poslední týden)
          </p>
        </div>

        {/* Mobile: horizontal snap scroll. Desktop: 3-col grid */}
        <ul
          className="
            -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2
            sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0
            lg:grid-cols-3
          "
          aria-label="Nejnovější reporty o aktuálních podmínkách"
        >
          {reports.map((report, idx) => {
            const meta =
              CONDITION_RATING_META[report.rating as ConditionRating] ??
              CONDITION_RATING_META.good;
            const facilityHref = report.facility.sport
              ? `/sport/${report.facility.sport}/${report.facility.slug}#podminky`
              : `/`;
            const userHref = `/uzivatel/${report.user.id}`;
            const authorName = report.user.name || "Uživatel";
            const commentLine = excerpt(report.comment);

            return (
              <li
                key={report.id}
                className="
                  flex min-w-[85%] snap-start flex-col rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4
                  transition hover:border-emerald-200 hover:shadow-sm
                  sm:min-w-0
                "
              >
                {report.thumbnailUrl && (
                  <Link
                    href={facilityHref}
                    className="mb-3 block h-32 w-full overflow-hidden rounded-xl bg-zinc-100"
                    prefetch={false}
                  >
                    <Image
                      src={report.thumbnailUrl}
                      alt={`Foto: ${report.facility.name}`}
                      width={480}
                      height={256}
                      className="h-full w-full object-cover"
                      priority={idx === 0}
                      unoptimized
                    />
                  </Link>
                )}

                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200"
                    aria-label={`Hodnocení: ${meta.labelCs}`}
                  >
                    <span aria-hidden>{meta.emoji}</span>
                    {meta.labelCs}
                  </span>
                  {report.facility.sportNameCs && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      {report.facility.sportNameCs}
                    </span>
                  )}
                </div>

                <Link
                  href={facilityHref}
                  className="mt-3 line-clamp-2 text-sm font-semibold text-zinc-900 hover:text-emerald-700"
                >
                  {report.facility.name}
                </Link>

                {commentLine && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                    {commentLine}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between pt-3 text-xs text-zinc-500">
                  <Link
                    href={userHref}
                    className="font-medium text-zinc-700 hover:text-emerald-600"
                  >
                    {authorName}
                  </Link>
                  <time
                    dateTime={report.createdAt.toISOString()}
                    title={report.createdAt.toLocaleString("cs")}
                  >
                    {timeAgoCs(report.createdAt)}
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

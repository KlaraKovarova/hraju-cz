import Link from "next/link";
import Image from "next/image";
import { Mountain } from "lucide-react";
import type { RecentTripReport } from "@/lib/data";

interface HomeRecentTripReportsProps {
  reports: RecentTripReport[];
}

function formatDateCs(d: Date): string {
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function excerpt(text: string | null, max: number = 110): string | null {
  if (!text) return null;
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + "…";
}

export function HomeRecentTripReports({ reports }: HomeRecentTripReportsProps) {
  if (!reports || reports.length === 0) return null;

  return (
    <section className="border-t border-zinc-100 bg-zinc-50/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6 flex flex-col items-center text-center">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900">
            <Mountain className="h-5 w-5 text-emerald-600" />
            Nejnovější výstupy
          </h2>
          <p className="mt-2 text-zinc-500">
            Záznamy výstupů na ferrata a lezeckých stěnách od komunity
          </p>
          <Link
            href="/vystupy"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Zobrazit všechny →
          </Link>
        </div>

        <ul
          className="
            -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2
            sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0
            lg:grid-cols-3
          "
          aria-label="Nejnovější záznamy výstupů"
        >
          {reports.map((r, idx) => {
            const sportSlug = r.facility.sport;
            if (!sportSlug) return null;
            const deepHref = `/sport/${sportSlug}/${r.facility.slug}/vystup/${r.id}`;
            const betaLine = excerpt(r.beta);
            const authorName = r.user.name || "Sportovec";

            return (
              <li
                key={r.id}
                className="
                  flex min-w-[85%] snap-start flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white
                  transition hover:border-emerald-200 hover:shadow-sm
                  sm:min-w-0
                "
              >
                <Link
                  href={deepHref}
                  className="flex h-full flex-col"
                  prefetch={false}
                >
                  {r.thumbnailUrl ? (
                    <div className="h-32 w-full overflow-hidden bg-zinc-100">
                      <Image
                        src={r.thumbnailUrl}
                        alt={`Výstup: ${r.facility.name}`}
                        width={480}
                        height={256}
                        className="h-full w-full object-cover"
                        priority={idx === 0}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center bg-zinc-100">
                      <Mountain className="h-10 w-10 text-zinc-300" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center gap-2 text-xs">
                      {r.facility.sportIcon && (
                        <span aria-hidden>{r.facility.sportIcon}</span>
                      )}
                      {r.facility.sportNameCs && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                          {r.facility.sportNameCs}
                        </span>
                      )}
                      {r.gradeText && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                          {r.gradeText}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">
                      {r.facility.name}
                    </p>

                    {betaLine && (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                        {betaLine}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-3 text-xs text-zinc-500">
                      <span className="font-medium text-zinc-700">
                        {authorName}
                      </span>
                      <time dateTime={r.dateClimbed.toISOString()}>
                        {formatDateCs(r.dateClimbed)}
                      </time>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

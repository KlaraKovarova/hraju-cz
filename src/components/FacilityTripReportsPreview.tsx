import Link from "next/link";
import { Mountain, ArrowRight, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDurationCs } from "@/lib/trip-reports";

interface FacilityTripReportsPreviewProps {
  facilityId: string;
  facilityHref: string;
  /** When true, always render the section even when empty (so ferraty/lezení facilities invite the first submission). */
  alwaysShow?: boolean;
}

function formatDateCs(d: Date): string {
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Teaser for a facility's trip reports. Shows up to 3 most recent reports
 * and links to the full /zaznam-vystupu list + submission form.
 */
export async function FacilityTripReportsPreview({
  facilityId,
  facilityHref,
  alwaysShow = false,
}: FacilityTripReportsPreviewProps) {
  const [reports, total] = await Promise.all([
    prisma.tripReport.findMany({
      where: { facilityId, isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        dateClimbed: true,
        durationMinutes: true,
        gradeText: true,
        beta: true,
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.tripReport.count({ where: { facilityId, isHidden: false } }),
  ]);

  if (total === 0 && !alwaysShow) return null;

  const fullHref = `${facilityHref}/zaznam-vystupu`;

  return (
    <section className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
            <Mountain className="h-5 w-5 text-zinc-400" />
            Záznamy výstupů
            {total > 0 && (
              <span className="text-sm font-normal text-zinc-500">({total})</span>
            )}
          </h2>
          <Link
            href={fullHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            {total > 0 ? "Zobrazit všechny" : "Přidat první záznam"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-6 text-center">
            <p className="text-sm font-medium text-zinc-700">
              Buď první, kdo přidá záznam!
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Sdílej datum, obtížnost, beta a fotky z výstupu — pomůže to dalším.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-3">
            {reports.map((r) => {
              const duration = formatDurationCs(r.durationMinutes);
              return (
                <li
                  key={r.id}
                  className="rounded-xl border border-zinc-100 bg-zinc-50/40 p-4"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                    <Link
                      href={`/uzivatel/${r.user.id}`}
                      className="font-semibold text-zinc-800 hover:text-emerald-700"
                    >
                      {r.user.name || "Sportovec"}
                    </Link>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateCs(r.dateClimbed)}
                    </span>
                    {duration && <span>· {duration}</span>}
                    {r.gradeText && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        {r.gradeText}
                      </span>
                    )}
                  </div>
                  {r.beta && (
                    <p className="mt-2 line-clamp-3 text-sm text-zinc-600">
                      {r.beta}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

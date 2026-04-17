import Link from "next/link";
import { Mountain, ArrowRight, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PhotoAttribution } from "@/components/PhotoAttribution";

interface FacilityTripReportsRailProps {
  facilityId: string;
  sportSlug: string;
  slug: string;
  /** When true, render the empty state nudge instead of hiding when there are zero reports. */
  alwaysShow?: boolean;
}

const BETA_EXCERPT_LIMIT = 120;

function formatDateCs(d: Date): string {
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function excerpt(text: string | null | undefined, max: number): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Top-3 trip reports teaser for a facility detail page. Each card links to
 * the Phase 5b deep-link page. Ferraty/lezení facilities render an empty-state
 * nudge when no reports exist (alwaysShow); other sports hide the rail entirely.
 */
export async function FacilityTripReportsRail({
  facilityId,
  sportSlug,
  slug,
  alwaysShow = false,
}: FacilityTripReportsRailProps) {
  const facilityHref = `/sport/${sportSlug}/${slug}`;
  const fullHref = `${facilityHref}/zaznam-vystupu`;

  const [reports, total] = await Promise.all([
    prisma.tripReport.findMany({
      where: { facilityId, isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        dateClimbed: true,
        gradeText: true,
        beta: true,
        user: { select: { id: true, name: true } },
        photos: {
          where: { isHidden: false },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { id: true, url: true, alt: true },
        },
      },
    }),
    prisma.tripReport.count({ where: { facilityId, isHidden: false } }),
  ]);

  if (total === 0 && !alwaysShow) return null;

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
            {total > 0
              ? "Zobrazit všechny záznamy výstupů"
              : "Přidat první záznam"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-8 text-center">
            <Mountain className="mx-auto h-8 w-8 text-zinc-300" />
            <p className="mt-2 text-sm font-semibold text-zinc-800">
              Buď první, kdo přidá záznam výstupu
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Sdílej datum, obtížnost, beta a fotky — pomůžeš dalším lezcům naplánovat výstup a vybrat správnou cestu.
            </p>
            <Link
              href={fullHref}
              className="mt-4 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Přidat první záznam
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-3">
            {reports.map((r) => {
              const authorName = r.user.name?.trim() || "Sportovec";
              const betaExcerpt = excerpt(r.beta, BETA_EXCERPT_LIMIT);
              const photo = r.photos[0];
              const deepHref = `${facilityHref}/vystup/${r.id}`;

              return (
                <li
                  key={r.id}
                  className="group overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50/40 transition hover:border-emerald-200 hover:shadow-sm"
                >
                  <Link href={deepHref} className="flex h-full flex-col">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.url}
                        alt={photo.alt || `${authorName} — výstup`}
                        className="h-32 w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-32 w-full items-center justify-center bg-zinc-100">
                        <Mountain className="h-8 w-8 text-zinc-300" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                        <span className="font-semibold text-zinc-800">
                          {authorName}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateCs(r.dateClimbed)}
                        </span>
                        {r.gradeText && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            {r.gradeText}
                          </span>
                        )}
                      </div>
                      {betaExcerpt && (
                        <p className="mt-2 text-sm text-zinc-600">
                          {betaExcerpt}
                        </p>
                      )}
                      {photo && (
                        <div className="mt-3 border-t border-zinc-100 pt-2">
                          <PhotoAttribution
                            userId={r.user.id}
                            displayName={r.user.name}
                            variant="inline"
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

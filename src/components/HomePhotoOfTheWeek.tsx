import Link from "next/link";
import { Trophy } from "lucide-react";
import type { PhotoOfTheWeekWinner } from "@/lib/photos";
import { formatWeekKeyCs } from "@/lib/photo-week";

interface HomePhotoOfTheWeekProps {
  winner: PhotoOfTheWeekWinner | null;
}

// SIL-666 — Homepage card highlighting the most recent "Foto týdne" winner.
// Rendered just above the HomeRecentPhotos rail.
// Hidden entirely when no winner has been awarded yet (first weeks).
export function HomePhotoOfTheWeek({ winner }: HomePhotoOfTheWeekProps) {
  if (!winner) return null;

  const facilityHref = winner.facility.sportSlug
    ? `/sport/${winner.facility.sportSlug}/${winner.facility.slug}`
    : `/${winner.facility.slug}`;
  const authorHref = `/uzivatel/${winner.user.id}`;
  const weekLabel = formatWeekKeyCs(winner.weekKey);

  return (
    <section
      id="foto-tydne"
      aria-labelledby="foto-tydne-heading"
      className="mx-auto max-w-6xl px-6 pt-12 pb-4"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2
            id="foto-tydne-heading"
            className="flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl"
          >
            <Trophy className="h-6 w-6 text-amber-500" aria-hidden="true" />
            Foto týdne
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Vybráno komunitou · {weekLabel}
          </p>
        </div>
        <Link
          href="/foto-tydne"
          className="shrink-0 rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-700"
        >
          Archiv vítězů
        </Link>
      </div>

      <article className="grid overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white md:grid-cols-[1.25fr_1fr]">
        <Link
          href={facilityHref}
          aria-label={`Zobrazit sportoviště ${winner.facility.name}`}
          className="group relative block aspect-[4/3] md:aspect-auto md:min-h-[320px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={winner.photo.url}
            alt={winner.photo.alt || `Foto týdne — ${winner.facility.name}`}
            loading="eager"
            fetchPriority="high"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
            <Trophy className="h-3.5 w-3.5" />
            Foto týdne
          </span>
        </Link>

        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-amber-700">
              {weekLabel}
            </div>
            <h3 className="mt-1 text-xl font-semibold text-zinc-900">
              <Link
                href={facilityHref}
                className="hover:text-emerald-700 hover:underline"
              >
                {winner.facility.name}
              </Link>
            </h3>
            {winner.facility.sportName && (
              <p className="mt-0.5 text-sm text-zinc-500">{winner.facility.sportName}</p>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-zinc-500">Autor</dt>
              <dd className="mt-0.5 font-medium text-zinc-900">
                <Link href={authorHref} className="hover:text-emerald-700 hover:underline">
                  {winner.user.name || "Uživatel hraju.cz"}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Hlasů</dt>
              <dd className="mt-0.5 inline-flex items-center gap-1.5 font-semibold tabular-nums text-zinc-900">
                <span className="text-amber-500" aria-hidden="true">♥</span>
                {winner.voteCount}
              </dd>
            </div>
          </dl>

          <Link
            href={facilityHref}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Zobrazit sportoviště
          </Link>
        </div>
      </article>
    </section>
  );
}

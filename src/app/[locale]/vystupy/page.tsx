import Link from "next/link";
import { ChevronRight, Mountain, Calendar } from "lucide-react";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { safeJsonLd } from "@/lib/seo";
import { PhotoAttribution } from "@/components/PhotoAttribution";

export const revalidate = 86400;

const BASE_URL = "https://www.hraju.cz";
const PAGE_SIZE = 20;
const BEACHHEAD_SPORTS = ["ferraty", "lezeni"];

type SportFilter = "vsechny" | "ferraty" | "lezeni" | "ostatni";

interface VystupyPageProps {
  searchParams: Promise<{
    sport?: string;
    grade?: string;
    from?: string;
    to?: string;
    cursor?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Záznamy výstupů — hraju.cz",
  description:
    "Prohlédněte si záznamy výstupů od sportovců z celé České republiky. Ferraty, lezecké stěny a další — datum, obtížnost, beta a fotky.",
  openGraph: {
    title: "Záznamy výstupů — hraju.cz",
    description:
      "Záznamy výstupů od komunity hraju.cz. Filtrujte podle sportu, obtížnosti a data.",
    url: `${BASE_URL}/vystupy`,
    type: "website",
    siteName: "hraju.cz",
    locale: "cs_CZ",
  },
  alternates: { canonical: `${BASE_URL}/vystupy` },
};

function formatDateCs(d: Date): string {
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function excerpt(text: string | null, max: number = 180): string | null {
  if (!text) return null;
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + "…";
}

function parseSportFilter(raw: string | undefined): SportFilter {
  if (raw === "ferraty" || raw === "lezeni" || raw === "ostatni") return raw;
  return "vsechny";
}

function parseDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function buildQueryString(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export default async function VystupyPage({ searchParams }: VystupyPageProps) {
  const sp = await searchParams;
  const sport = parseSportFilter(sp.sport);
  const gradeInput = sp.grade?.trim().slice(0, 40) || "";
  const dateFrom = parseDate(sp.from);
  const dateTo = parseDate(sp.to);
  const cursor = sp.cursor?.trim() || null;

  const where: Prisma.TripReportWhereInput = { isHidden: false };
  const facilityFilter: Prisma.FacilityWhereInput = { isActive: true };

  if (sport === "ferraty") {
    facilityFilter.sports = { some: { sport: { slug: "ferraty" } } };
  } else if (sport === "lezeni") {
    facilityFilter.sports = { some: { sport: { slug: "lezeni" } } };
  } else if (sport === "ostatni") {
    facilityFilter.sports = {
      none: { sport: { slug: { in: BEACHHEAD_SPORTS } } },
    };
  }
  where.facility = facilityFilter;

  if (gradeInput) {
    where.gradeText = { contains: gradeInput, mode: "insensitive" };
  }

  if (dateFrom || dateTo) {
    const range: Prisma.DateTimeFilter = {};
    if (dateFrom) range.gte = dateFrom;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      range.lte = end;
    }
    where.dateClimbed = range;
  }

  const reports = await prisma.tripReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      dateClimbed: true,
      gradeText: true,
      beta: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
      facility: {
        select: {
          id: true,
          name: true,
          slug: true,
          sports: {
            take: 1,
            select: { sport: { select: { slug: true, nameCs: true, icon: true } } },
          },
        },
      },
      photos: {
        where: { isHidden: false },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true, url: true, alt: true },
      },
    },
  });

  const hasMore = reports.length > PAGE_SIZE;
  const page = hasMore ? reports.slice(0, PAGE_SIZE) : reports;
  const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hraju.cz", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Záznamy výstupů",
        item: `${BASE_URL}/vystupy`,
      },
    ],
  };

  const baseFilters = {
    sport: sport === "vsechny" ? undefined : sport,
    grade: gradeInput || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
  };

  const sportOptions: { value: SportFilter; label: string }[] = [
    { value: "vsechny", label: "Všechny" },
    { value: "ferraty", label: "Ferraty" },
    { value: "lezeni", label: "Lezení" },
    { value: "ostatni", label: "Ostatní" },
  ];

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />

      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-4 text-sm text-zinc-500">
          <Link
            href="/"
            className="font-extrabold text-zinc-900 hover:text-emerald-600"
          >
            hraju<span className="text-emerald-600">.cz</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
          <span className="font-medium text-zinc-900">Záznamy výstupů</span>
        </div>
      </nav>

      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-zinc-900">
            <Mountain className="h-7 w-7 text-emerald-600" />
            Záznamy výstupů na hraju.cz
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-500">
            Sbírka záznamů výstupů od české sportovní komunity — datum, obtížnost,
            beta i fotky. Filtrujte podle sportu, obtížnosti a data.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <form
          method="get"
          action="/vystupy"
          className="mb-6 flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
        >
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="mr-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Sport
            </legend>
            {sportOptions.map((opt) => {
              const checked = sport === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                    checked
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="sport"
                    value={opt.value}
                    defaultChecked={checked}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              );
            })}
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Obtížnost
              <input
                type="text"
                name="grade"
                defaultValue={gradeInput}
                placeholder="např. 5c nebo B/C"
                className="mt-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Od
              <input
                type="date"
                name="from"
                defaultValue={sp.from ?? ""}
                className="mt-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-zinc-900 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Do
              <input
                type="date"
                name="to"
                defaultValue={sp.to ?? ""}
                className="mt-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-zinc-900 focus:border-emerald-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Použít filtry
            </button>
            {(sport !== "vsechny" || gradeInput || sp.from || sp.to) && (
              <Link
                href="/vystupy"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-700"
              >
                Vynulovat
              </Link>
            )}
          </div>
        </form>

        {page.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center">
            <p className="text-base font-semibold text-zinc-700">
              Žádné záznamy neodpovídají zvoleným filtrům.
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Zkuste rozšířit rozsah nebo resetovat filtry.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.map((r) => {
              const sportMeta = r.facility.sports[0]?.sport ?? null;
              const sportSlug = sportMeta?.slug ?? null;
              const authorName = r.user.name?.trim() || "Sportovec";
              const photo = r.photos[0];
              const betaLine = excerpt(r.beta);
              const deepHref = sportSlug
                ? `/sport/${sportSlug}/${r.facility.slug}/vystup/${r.id}`
                : null;
              const facilityHref = sportSlug
                ? `/sport/${sportSlug}/${r.facility.slug}`
                : null;

              return (
                <li
                  key={r.id}
                  className="overflow-hidden rounded-2xl border border-zinc-100 bg-white transition hover:border-emerald-200 hover:shadow-sm"
                >
                  {deepHref ? (
                    <Link href={deepHref} className="flex h-full flex-col">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.url}
                          alt={photo.alt || `${r.facility.name} — výstup`}
                          className="h-40 w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-zinc-100">
                          <Mountain className="h-10 w-10 text-zinc-300" />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {sportMeta?.icon && (
                            <span aria-hidden>{sportMeta.icon}</span>
                          )}
                          {sportMeta?.nameCs && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                              {sportMeta.nameCs}
                            </span>
                          )}
                          {r.gradeText && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                              {r.gradeText}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-semibold text-zinc-900">
                          {r.facility.name}
                        </p>
                        {betaLine && (
                          <p className="mt-1 line-clamp-3 text-sm text-zinc-600">
                            {betaLine}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-3 text-xs text-zinc-500">
                          <span className="font-medium text-zinc-700">
                            {authorName}
                          </span>
                          <time
                            dateTime={r.dateClimbed.toISOString()}
                            className="inline-flex items-center gap-1"
                          >
                            <Calendar className="h-3 w-3" />
                            {formatDateCs(r.dateClimbed)}
                          </time>
                        </div>
                        {photo && (
                          <div className="mt-2 border-t border-zinc-100 pt-2">
                            <PhotoAttribution
                              userId={r.user.id}
                              displayName={r.user.name}
                              variant="inline"
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="p-4 text-sm text-zinc-500">
                      {r.facility.name}
                    </div>
                  )}
                  {facilityHref && (
                    <div className="border-t border-zinc-100 bg-zinc-50/40 px-4 py-2 text-[11px] text-zinc-500">
                      <Link
                        href={facilityHref}
                        className="font-medium hover:text-emerald-700"
                      >
                        {r.facility.name} →
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-6 text-sm">
          {cursor ? (
            <Link
              href={`/vystupy${buildQueryString({ ...baseFilters })}`}
              className="inline-flex items-center gap-1 font-medium text-emerald-600 hover:text-emerald-700"
            >
              ← Na začátek
            </Link>
          ) : (
            <span />
          )}
          {nextCursor ? (
            <Link
              href={`/vystupy${buildQueryString({ ...baseFilters, cursor: nextCursor })}`}
              className="inline-flex items-center gap-1 font-medium text-emerald-600 hover:text-emerald-700"
            >
              Další záznamy →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </section>
    </main>
  );
}

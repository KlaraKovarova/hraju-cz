import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Mountain,
  Calendar,
  Clock,
  Users as UsersIcon,
  Cloud,
  User,
} from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { TRIP_REPORT_PAGE_SIZE, formatDurationCs } from "@/lib/trip-reports";
import { safeJsonLd } from "@/lib/seo";

export const revalidate = 86400;

interface UserVystupyPageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ page?: string }>;
}

function parsePage(raw: string | undefined): number {
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 0;
  return n - 1;
}

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

function formatDateCs(d: Date): string {
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({
  params,
}: UserVystupyPageProps): Promise<Metadata> {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  if (!user) return { title: "Uživatel nenalezen — hraju.cz" };

  const displayName = user.name || "Sportovec";
  const title = `Záznamy výstupů — ${displayName} — hraju.cz`;
  const description = `Záznamy výstupů uživatele ${displayName}: datum, obtížnost, beta a fotky z ferrat, lezení a dalších sportovišť po Česku.`;
  const url = `https://www.hraju.cz/uzivatel/${userId}/vystupy`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      siteName: "hraju.cz",
      locale: "cs_CZ",
    },
    robots: { index: true, follow: true },
  };
}

export default async function UserVystupyPage({
  params,
  searchParams,
}: UserVystupyPageProps) {
  const { userId } = await params;
  const { page: pageParam } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });
  if (!user) notFound();

  const page = parsePage(pageParam);
  const skip = page * TRIP_REPORT_PAGE_SIZE;

  const [reports, total] = await Promise.all([
    prisma.tripReport.findMany({
      where: { userId, isHidden: false },
      orderBy: { createdAt: "desc" },
      skip,
      take: TRIP_REPORT_PAGE_SIZE,
      select: {
        id: true,
        dateClimbed: true,
        durationMinutes: true,
        gradeText: true,
        partnersText: true,
        beta: true,
        weatherNote: true,
        createdAt: true,
        facility: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: { select: { city: true } },
            sports: {
              take: 1,
              select: { sport: { select: { slug: true, nameCs: true } } },
            },
          },
        },
        photos: {
          where: { isHidden: false },
          select: { id: true, url: true, alt: true },
          orderBy: { createdAt: "asc" },
          take: 3,
        },
      },
    }),
    prisma.tripReport.count({
      where: { userId, isHidden: false },
    }),
  ]);

  const displayName = user.name || "Sportovec";
  const profileHref = `/uzivatel/${user.id}`;
  const pagePath = `${profileHref}/vystupy`;
  const totalPages = Math.max(1, Math.ceil(total / TRIP_REPORT_PAGE_SIZE));
  const currentPage = page + 1;

  const breadcrumbItems = [
    { name: "hraju.cz", url: "https://www.hraju.cz" },
    { name: displayName, url: `https://www.hraju.cz${profileHref}` },
    { name: "Záznamy výstupů", url: `https://www.hraju.cz${pagePath}` },
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />

      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-4 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-700">
            hraju.cz
          </Link>
          <ChevronRight className="h-4 w-4 text-zinc-300" />
          <Link href={profileHref} className="hover:text-zinc-700">
            {displayName}
          </Link>
          <ChevronRight className="h-4 w-4 text-zinc-300" />
          <span className="font-medium text-zinc-700">Záznamy výstupů</span>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
                <Mountain className="h-6 w-6 text-zinc-400" />
                Záznamy výstupů — {displayName}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {total > 0
                  ? `${total} ${plural(total, "záznam", "záznamy", "záznamů")} z výstupů`
                  : "Zatím žádné záznamy"}
              </p>
            </div>
          </div>
          <Link
            href={profileHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Zpět na profil
          </Link>
        </header>

        {reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
            <Mountain className="mx-auto h-10 w-10 text-zinc-300" />
            <p className="mt-3 text-base font-medium text-zinc-700">
              {displayName} zatím nesdílel(a) žádné záznamy.
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Záznamy vznikají po výstupu přímo na stránce sportoviště.
            </p>
            <Link
              href="/hledat"
              className="mt-5 inline-block rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Najít sportoviště
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {reports.map((r) => {
              const duration = formatDurationCs(r.durationMinutes);
              const sport = r.facility.sports[0]?.sport;
              const facilityHref = sport
                ? `/sport/${sport.slug}/${r.facility.slug}`
                : `/`;
              return (
                <li
                  key={r.id}
                  id={`zaznam-${r.id}`}
                  className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                    {sport && (
                      <Link
                        href={`/sport/${sport.slug}`}
                        className="font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        {sport.nameCs}
                      </Link>
                    )}
                    {r.facility.location?.city && <span>{r.facility.location.city}</span>}
                  </div>
                  <Link
                    href={facilityHref}
                    className="text-base font-semibold text-zinc-900 hover:text-emerald-700"
                  >
                    {r.facility.name}
                  </Link>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600">
                    <span className="inline-flex items-center gap-1 text-xs">
                      <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                      {formatDateCs(r.dateClimbed)}
                    </span>
                    {duration && (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        {duration}
                      </span>
                    )}
                    {r.gradeText && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {r.gradeText}
                      </span>
                    )}
                    {r.partnersText && (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <UsersIcon className="h-3.5 w-3.5 text-zinc-400" />
                        {r.partnersText}
                      </span>
                    )}
                    {r.weatherNote && (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Cloud className="h-3.5 w-3.5 text-zinc-400" />
                        {r.weatherNote}
                      </span>
                    )}
                  </div>

                  {r.beta && (
                    <p className="mt-3 whitespace-pre-line text-sm text-zinc-700">
                      {r.beta.length > 400 ? r.beta.slice(0, 400) + "…" : r.beta}
                    </p>
                  )}

                  {r.photos.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {r.photos.map((p) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={p.id}
                          src={p.url}
                          alt={p.alt || `${r.facility.name} — záznam výstupu`}
                          className="h-32 w-32 shrink-0 rounded-lg object-cover"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <Pagination
            base={pagePath}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        )}
      </div>
    </main>
  );
}

function Pagination({
  base,
  currentPage,
  totalPages,
}: {
  base: string;
  currentPage: number;
  totalPages: number;
}) {
  const prev =
    currentPage > 1
      ? `${base}${currentPage === 2 ? "" : `?page=${currentPage - 1}`}`
      : null;
  const next = currentPage < totalPages ? `${base}?page=${currentPage + 1}` : null;
  return (
    <nav
      className="mt-8 flex items-center justify-between border-t border-zinc-100 pt-6 text-sm"
      aria-label="Stránkování"
    >
      {prev ? (
        <Link
          href={prev}
          className="inline-flex items-center gap-1 font-medium text-emerald-600 hover:text-emerald-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Předchozí
        </Link>
      ) : (
        <span />
      )}
      <span className="text-zinc-500">
        Strana {currentPage} z {totalPages}
      </span>
      {next ? (
        <Link
          href={next}
          className="inline-flex items-center gap-1 font-medium text-emerald-600 hover:text-emerald-700"
        >
          Další
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

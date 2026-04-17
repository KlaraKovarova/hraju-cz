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
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getSportBySlug } from "@/lib/sports";
import { getFacilityBySlug } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { formatDurationCs } from "@/lib/trip-reports";
import { safeJsonLd } from "@/lib/seo";
import { PhotoAttribution } from "@/components/PhotoAttribution";

export const revalidate = 86400;

const BASE_URL = "https://www.hraju.cz";
const CONDITIONS_CROSSLINK_WINDOW_DAYS = 7;

interface TripReportDeepLinkPageProps {
  params: Promise<{ sport: string; slug: string; id: string }>;
}

function formatDateCs(d: Date): string {
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShortCs(d: Date): string {
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Fetch a trip report by id, scoped to the given facility.
 * Returns null if the report is hidden, belongs to a different facility,
 * or does not exist.
 */
async function loadTripReport(id: string, facilityId: string) {
  const report = await prisma.tripReport.findUnique({
    where: { id },
    select: {
      id: true,
      facilityId: true,
      dateClimbed: true,
      durationMinutes: true,
      gradeText: true,
      partnersText: true,
      beta: true,
      weatherNote: true,
      isHidden: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
      photos: {
        where: { isHidden: false },
        select: { id: true, url: true, alt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!report) return null;
  if (report.isHidden) return null;
  if (report.facilityId !== facilityId) return null;
  return report;
}

/**
 * Find a top conditions report from the same calendar week as this trip.
 * "Same week" = visitedAt within CONDITIONS_CROSSLINK_WINDOW_DAYS of dateClimbed.
 * Picks the most helpful one; falls back to most recent in window.
 */
async function loadNearbyConditionsReport(
  facilityId: string,
  dateClimbed: Date
) {
  const windowMs = CONDITIONS_CROSSLINK_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const from = new Date(dateClimbed.getTime() - windowMs);
  const to = new Date(dateClimbed.getTime() + windowMs);
  return prisma.conditionReport.findFirst({
    where: {
      facilityId,
      isHidden: false,
      visitedAt: { gte: from, lte: to },
    },
    orderBy: [{ helpful: "desc" }, { visitedAt: "desc" }],
    select: {
      id: true,
      rating: true,
      comment: true,
      visitedAt: true,
    },
  });
}

const CONDITIONS_LABEL: Record<string, string> = {
  excellent: "Výborné",
  good: "Dobré",
  poor: "Špatné",
  closed: "Uzavřeno",
};

export async function generateMetadata({
  params,
}: TripReportDeepLinkPageProps): Promise<Metadata> {
  const { sport: sportSlug, slug, id } = await params;
  const sport = getSportBySlug(sportSlug);
  if (!sport) return {};
  const { facility } = await getFacilityBySlug(slug);
  if (!facility) return {};

  const report = await loadTripReport(id, facility.id);
  if (!report) return {};

  const dateShort = formatDateShortCs(report.dateClimbed);
  const title = `Výstup na ${facility.name} — ${dateShort}`;
  const description = report.beta
    ? truncate(report.beta, 160)
    : `Záznam výstupu na ${facility.name} (${sport.nameCs}) — ${dateShort}. Datum, obtížnost, beta a fotky na hraju.cz.`;
  const url = `${BASE_URL}/sport/${sportSlug}/${slug}/vystup/${report.id}`;

  const firstPhoto = report.photos[0];
  const fallbackPhoto = firstPhoto
    ? null
    : await prisma.userPhoto
        .findFirst({
          where: { facilityId: facility.id, isHidden: false },
          orderBy: { createdAt: "desc" },
          select: { url: true, alt: true },
        })
        .catch(() => null);

  const ogImage = firstPhoto
    ? {
        url: firstPhoto.url,
        alt: firstPhoto.alt ?? `${facility.name} — výstup ${dateShort}`,
      }
    : fallbackPhoto?.url
      ? {
          url: fallbackPhoto.url,
          alt: fallbackPhoto.alt ?? `${facility.name} — ${sport.nameCs}`,
        }
      : {
          url: `/api/og?${new URLSearchParams({
            title: `Výstup ${dateShort}`,
            subtitle: `${facility.name} · ${sport.nameCs}`,
            icon: sport.icon,
            type: "facility",
          }).toString()}`,
          width: 1200,
          height: 630,
          alt: `${facility.name} — hraju.cz`,
        };

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "hraju.cz",
      locale: "cs_CZ",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function TripReportDeepLinkPage({
  params,
}: TripReportDeepLinkPageProps) {
  const { sport: sportSlug, slug, id } = await params;
  const sport = getSportBySlug(sportSlug);
  if (!sport) notFound();
  const { facility } = await getFacilityBySlug(slug);
  if (!facility) notFound();

  const report = await loadTripReport(id, facility.id);
  if (!report) notFound();

  const conditionsReport = await loadNearbyConditionsReport(
    facility.id,
    report.dateClimbed
  );

  const facilityHref = `/sport/${sportSlug}/${slug}`;
  const listPath = `${facilityHref}/zaznam-vystupu`;
  const pageUrl = `${BASE_URL}/sport/${sportSlug}/${slug}/vystup/${report.id}`;
  const duration = formatDurationCs(report.durationMinutes);
  const dateCs = formatDateCs(report.dateClimbed);
  const dateShort = formatDateShortCs(report.dateClimbed);
  const authorName = report.user.name?.trim() || "Sportovec";

  const h1 = report.user.name
    ? `Výstup na ${facility.name} — ${authorName}`
    : `Výstup na ${facility.name} — ${dateShort}`;

  const reviewLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "SportsActivityLocation",
      name: facility.name,
      url: `${BASE_URL}${facilityHref}`,
    },
    author: { "@type": "Person", name: authorName },
    datePublished: report.createdAt.toISOString(),
    name: `Výstup ${dateShort} — ${facility.name}`,
    url: pageUrl,
  };
  if (report.beta) {
    reviewLd.reviewBody = report.beta;
  }

  const breadcrumbItems = [
    { name: "hraju.cz", url: BASE_URL },
    { name: sport.nameCs, url: `${BASE_URL}/sport/${sportSlug}` },
    { name: facility.name, url: `${BASE_URL}${facilityHref}` },
    { name: "Záznamy výstupů", url: `${BASE_URL}${listPath}` },
    { name: dateShort, url: pageUrl },
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
        dangerouslySetInnerHTML={{ __html: safeJsonLd(reviewLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />

      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-6 py-4 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-700">
            hraju.cz
          </Link>
          <ChevronRight className="h-4 w-4 text-zinc-300" />
          <Link href={`/sport/${sportSlug}`} className="hover:text-zinc-700">
            {sport.nameCs}
          </Link>
          <ChevronRight className="h-4 w-4 text-zinc-300" />
          <Link href={facilityHref} className="hover:text-zinc-700">
            {facility.name}
          </Link>
          <ChevronRight className="h-4 w-4 text-zinc-300" />
          <Link href={listPath} className="hover:text-zinc-700">
            Záznamy výstupů
          </Link>
          <ChevronRight className="h-4 w-4 text-zinc-300" />
          <span className="font-medium text-zinc-700">{dateShort}</span>
        </div>
      </nav>

      <article className="mx-auto max-w-4xl px-6 py-8">
        <header className="mb-6">
          <h1 className="flex items-start gap-2 text-2xl font-bold text-zinc-900 sm:text-3xl">
            <Mountain className="mt-1 h-6 w-6 shrink-0 text-emerald-600" />
            <span>{h1}</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4 text-zinc-400" />
              {dateCs}
            </span>
            {duration && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4 text-zinc-400" />
                {duration}
              </span>
            )}
            {report.gradeText && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {report.gradeText}
              </span>
            )}
            {report.partnersText && (
              <span className="inline-flex items-center gap-1">
                <UsersIcon className="h-4 w-4 text-zinc-400" />
                {report.partnersText}
              </span>
            )}
            {report.weatherNote && (
              <span className="inline-flex items-center gap-1">
                <Cloud className="h-4 w-4 text-zinc-400" />
                {report.weatherNote}
              </span>
            )}
          </div>
        </header>

        {report.beta && (
          <section className="mb-8 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <h2 className="sr-only">Beta</h2>
            <div className="prose prose-zinc max-w-none text-[15px] leading-7 prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline">
              <Markdown remarkPlugins={[remarkGfm]}>{report.beta}</Markdown>
            </div>
          </section>
        )}

        {report.photos.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Fotky z výstupu
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {report.photos.map((p) => (
                <figure
                  key={p.id}
                  className="overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={
                      p.alt ||
                      `${facility.name} — výstup ${dateShort} (${authorName})`
                    }
                    className="h-64 w-full object-cover"
                    loading="lazy"
                  />
                  <figcaption className="px-3 py-2">
                    <PhotoAttribution
                      userId={report.user.id}
                      displayName={report.user.name}
                      variant="inline"
                    />
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Autor záznamu
            </p>
            <Link
              href={`/uzivatel/${report.user.id}`}
              className="mt-1 inline-flex items-center gap-2 text-base font-semibold text-zinc-900 hover:text-emerald-700"
            >
              {authorName}
            </Link>
          </div>
          <Link
            href={`${listPath}#pridat`}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Mountain className="h-4 w-4" />
            Přidat svůj záznam výstupu
          </Link>
        </section>

        {conditionsReport && (
          <section className="mb-8 rounded-2xl border border-amber-100 bg-amber-50/40 p-5">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 text-amber-600" />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Podmínky ve stejném týdnu
                </p>
                <p className="mt-1 text-sm text-zinc-700">
                  <span className="font-semibold">
                    {CONDITIONS_LABEL[conditionsReport.rating] ??
                      conditionsReport.rating}
                  </span>
                  {" · "}
                  {formatDateShortCs(conditionsReport.visitedAt)}
                  {conditionsReport.comment && (
                    <>
                      {" — "}
                      {truncate(conditionsReport.comment, 140)}
                    </>
                  )}
                </p>
                <Link
                  href={`${facilityHref}#podminky`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900"
                >
                  Všechny zprávy o podmínkách
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-6 text-sm">
          <Link
            href={listPath}
            className="inline-flex items-center gap-1 font-medium text-emerald-600 hover:text-emerald-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Všechny záznamy výstupů
          </Link>
          <Link
            href={facilityHref}
            className="inline-flex items-center gap-1 font-medium text-zinc-600 hover:text-zinc-800"
          >
            {facility.name}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </nav>
      </article>
    </main>
  );
}

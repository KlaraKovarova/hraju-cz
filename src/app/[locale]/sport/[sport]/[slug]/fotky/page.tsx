import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Camera } from "lucide-react";
import type { Metadata } from "next";
import { getSportBySlug } from "@/lib/sports";
import { getFacilityBySlug } from "@/lib/data";
import {
  buildPhotoAlt,
  getFacilityPhotos,
  type FacilityPhoto,
} from "@/lib/photos";
import { FacilityPhotoGallery, type GalleryPhotoDTO } from "@/components/FacilityPhotoGallery";
import { safeJsonLd } from "@/lib/seo";

// ISR: revalidate gallery pages every 24 hours (consistent with other content pages)
export const revalidate = 86400;

const PAGE_SIZE = 48;

interface FotkyPageProps {
  params: Promise<{ sport: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

function parsePage(raw: string | undefined): number {
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 0;
  return n - 1;
}

export async function generateMetadata({
  params,
}: FotkyPageProps): Promise<Metadata> {
  const { sport: sportSlug, slug } = await params;
  const sport = getSportBySlug(sportSlug);
  if (!sport) return {};
  const { facility } = await getFacilityBySlug(slug);
  if (!facility) return {};

  const title = `Fotky — ${facility.name} (${sport.nameCs}, ${facility.location.city})`;
  const description = `Fotografie od návštěvníků: ${facility.name}, ${sport.nameCs} v ${facility.location.city}. Snímky z recenzí, check-inů a reportů na hraju.cz.`;
  const url = `https://www.hraju.cz/sport/${sportSlug}/${slug}/fotky`;

  // SIL-670 — Pinterest rich pin support. Prefer the watermarked download URL
  // for the lead photo so any pin crawled off this page carries the hraju.cz
  // brand. Falls back to a neutral OG when the facility has no photos yet.
  const { photos } = await getFacilityPhotos(facility.id, { take: 1 });
  const leadPhoto = photos[0] ?? null;
  const ogImage = leadPhoto
    ? `https://www.hraju.cz/api/photos/${leadPhoto.id}/download`
    : null;
  const pinterestDescription = `${facility.name} — ${sport.nameCs} • hraju.cz`;

  const openGraph: Metadata["openGraph"] = {
    title,
    description,
    url,
    type: "website",
    siteName: "hraju.cz",
    locale: "cs_CZ",
    ...(ogImage ? { images: [{ url: ogImage, alt: `${facility.name} — ${sport.nameCs}` }] } : {}),
  };

  const other: Record<string, string> = {
    "pinterest-rich-pin": "true",
    "pinterest:description": pinterestDescription,
  };
  if (ogImage) other["pinterest:media"] = ogImage;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph,
    other,
  };
}

function toDto(
  p: FacilityPhoto,
  facilityName: string,
  sportName: string
): GalleryPhotoDTO {
  return {
    id: p.id,
    url: p.url,
    alt: buildPhotoAlt({
      facilityName,
      sportName,
      authorName: p.user.name,
      fallback: p.alt,
    }),
    createdAtIso: p.createdAt.toISOString(),
    user: p.user,
    context: p.context,
    reviewId: p.reviewId,
    visitId: p.visitId,
    conditionReportId: p.conditionReportId,
    tripReportId: p.tripReportId,
  };
}

export default async function FotkyPage({ params, searchParams }: FotkyPageProps) {
  const { sport: sportSlug, slug } = await params;
  const { page: pageParam } = await searchParams;
  const sport = getSportBySlug(sportSlug);
  if (!sport) notFound();
  const { facility } = await getFacilityBySlug(slug);
  if (!facility) notFound();

  const page = parsePage(pageParam);
  const { photos, total } = await getFacilityPhotos(facility.id, {
    page,
    pageSize: PAGE_SIZE,
  });

  const facilityHref = `/sport/${sportSlug}/${slug}`;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = page + 1;
  const dtos = photos.map((p) => toDto(p, facility.name, sport.nameCs));

  const breadcrumbItems = [
    { name: "hraju.cz", url: "https://www.hraju.cz" },
    { name: sport.nameCs, url: `https://www.hraju.cz/sport/${sportSlug}` },
    { name: facility.name, url: `https://www.hraju.cz${facilityHref}` },
    { name: "Fotky", url: `https://www.hraju.cz${facilityHref}/fotky` },
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
          <Link href={`/sport/${sportSlug}`} className="hover:text-zinc-700">
            {sport.nameCs}
          </Link>
          <ChevronRight className="h-4 w-4 text-zinc-300" />
          <Link href={facilityHref} className="hover:text-zinc-700">
            {facility.name}
          </Link>
          <ChevronRight className="h-4 w-4 text-zinc-300" />
          <span className="font-medium text-zinc-700">Fotky</span>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
              <Camera className="h-6 w-6 text-zinc-400" />
              Fotky — {facility.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {total > 0
                ? `${total} ${plural(total, "fotka", "fotky", "fotek")} od návštěvníků`
                : "Zatím žádné fotky"}
            </p>
          </div>
          <Link
            href={facilityHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Zpět na sportoviště
          </Link>
        </header>

        {dtos.length === 0 ? (
          <EmptyState facilityHref={facilityHref} />
        ) : (
          <>
            <FacilityPhotoGallery
              photos={dtos}
              facilityHref={facilityHref}
              facilityName={facility.name}
              sportLabel={sport.nameCs}
            />

            {totalPages > 1 && (
              <Pagination
                base={`${facilityHref}/fotky`}
                currentPage={currentPage}
                totalPages={totalPages}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

function EmptyState({ facilityHref }: { facilityHref: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center">
      <Camera className="mx-auto h-10 w-10 text-zinc-300" />
      <p className="mt-3 text-base font-semibold text-zinc-800">
        Zatím žádné fotky
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        Pošli první snímek z návštěvy — nejlepší fotky týdne vybíráme do rubriky{" "}
        <Link href="/foto-tydne" className="font-medium text-emerald-700 hover:underline">
          Foto týdne
        </Link>
        .
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link
          href={`${facilityHref}#recenze`}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Napsat recenzi s fotkou
        </Link>
        <Link
          href={`${facilityHref}#podminky`}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300"
        >
          Nahlásit podmínky
        </Link>
        <Link
          href={facilityHref}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300"
        >
          Byl/a jsem tady
        </Link>
      </div>
    </div>
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
  const prev = currentPage > 1 ? `${base}${currentPage === 2 ? "" : `?page=${currentPage - 1}`}` : null;
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

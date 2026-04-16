import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Camera, User } from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildPhotoAlt, getUserPhotos, type UserPhoto } from "@/lib/photos";
import {
  UserPhotoGallery,
  type UserGalleryPhotoDTO,
} from "@/components/UserPhotoGallery";
import { safeJsonLd } from "@/lib/seo";

// ISR: revalidate user photo galleries every 24 hours (consistent with facility gallery).
export const revalidate = 86400;

const PAGE_SIZE = 48;

interface UserFotkyPageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ page?: string }>;
}

function parsePage(raw: string | undefined): number {
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 0;
  return n - 1;
}

function facilityHref(sportSlug: string, facilitySlug: string): string {
  return `/sport/${sportSlug}/${facilitySlug}`;
}

function toDto(p: UserPhoto): UserGalleryPhotoDTO {
  const href = p.facility.sportSlug
    ? facilityHref(p.facility.sportSlug, p.facility.slug)
    : `/`;
  return {
    id: p.id,
    url: p.url,
    alt: buildPhotoAlt({
      facilityName: p.facility.name,
      sportName: p.facility.sportName,
      authorName: null,
      fallback: p.alt,
    }),
    createdAtIso: p.createdAt.toISOString(),
    context: p.context,
    reviewId: p.reviewId,
    visitId: p.visitId,
    conditionReportId: p.conditionReportId,
    facility: {
      id: p.facility.id,
      name: p.facility.name,
      href,
      sportName: p.facility.sportName,
      city: p.facility.city,
    },
  };
}

export async function generateMetadata({
  params,
}: UserFotkyPageProps): Promise<Metadata> {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  if (!user) return { title: "Uživatel nenalezen — hraju.cz" };

  const { photos } = await getUserPhotos(userId, { take: 1 });
  const displayName = user.name || "Sportovec";
  const title = `Fotky — ${displayName} — hraju.cz`;
  const description = `Fotografie sportovišť od uživatele ${displayName} na hraju.cz. Snímky z recenzí, check-inů a reportů podmínek.`;
  const url = `https://www.hraju.cz/uzivatel/${userId}/fotky`;
  const ogImage = photos[0]?.url;

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
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function UserFotkyPage({
  params,
  searchParams,
}: UserFotkyPageProps) {
  const { userId } = await params;
  const { page: pageParam } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });
  if (!user) notFound();

  const page = parsePage(pageParam);
  const { photos, total } = await getUserPhotos(userId, {
    page,
    pageSize: PAGE_SIZE,
  });

  const displayName = user.name || "Sportovec";
  const profileHref = `/uzivatel/${user.id}`;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = page + 1;
  const dtos = photos.map(toDto);

  const breadcrumbItems = [
    { name: "hraju.cz", url: "https://www.hraju.cz" },
    { name: displayName, url: `https://www.hraju.cz${profileHref}` },
    { name: "Fotky", url: `https://www.hraju.cz${profileHref}/fotky` },
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
          <span className="font-medium text-zinc-700">Fotky</span>
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
                <Camera className="h-6 w-6 text-zinc-400" />
                Fotky — {displayName}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {total > 0
                  ? `${total} ${plural(total, "fotka", "fotky", "fotek")} ze sportovišť po celém Česku`
                  : "Zatím žádné fotky"}
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

        {dtos.length === 0 ? (
          <EmptyState displayName={displayName} />
        ) : (
          <>
            <UserPhotoGallery photos={dtos} ownerUserId={userId} />

            {totalPages > 1 && (
              <Pagination
                base={`${profileHref}/fotky`}
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

function EmptyState({ displayName }: { displayName: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center">
      <Camera className="mx-auto h-10 w-10 text-zinc-300" />
      <p className="mt-3 text-base font-medium text-zinc-700">
        {displayName} zatím nesdílel(a) žádné fotky.
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        Fotky vznikají při psaní recenzí, check-inech a reportech podmínek.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link
          href="/hledat"
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Najít sportoviště
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

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, ExternalLink, X } from "lucide-react";
import { contextLabel, photoSourceHref, type PhotoContext } from "@/lib/photos";
import { PhotoVoteButton } from "@/components/PhotoVoteButton";
import { PinterestShareButton } from "@/components/PinterestShareButton";

export interface HomePhotoDTO {
  id: string;
  url: string;
  alt: string | null;
  createdAtIso: string;
  context: PhotoContext | null;
  reviewId: string | null;
  visitId: string | null;
  conditionReportId: string | null;
  user: { id: string; name: string | null };
  facility: {
    id: string;
    name: string;
    slug: string;
    sportSlug: string | null;
    sportName: string | null;
    href: string;
  };
}

interface HomeRecentPhotosGalleryProps {
  photos: HomePhotoDTO[];
}

function timeAgoCs(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
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

export function HomeRecentPhotosGallery({ photos }: HomeRecentPhotosGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);
  const handlePrev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : i > 0 ? i - 1 : photos.length - 1));
  }, [photos.length]);
  const handleNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : i < photos.length - 1 ? i + 1 : 0));
  }, [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, close, handlePrev, handleNext]);

  if (photos.length === 0) return null;

  const active = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      <ul
        className="
          -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2
          sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0
          lg:grid-cols-3
        "
        aria-label="Nejnovější fotky od komunity"
      >
        {photos.map((photo, i) => {
          const authorName = photo.user.name || "Uživatel";
          const authorHref = `/uzivatel/${photo.user.id}`;

          return (
            <li
              key={photo.id}
              className="
                flex min-w-[85%] snap-start flex-col rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3
                transition hover:border-emerald-200 hover:shadow-sm
                sm:min-w-0
              "
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="group relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label={`Zobrazit fotku z ${photo.facility.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.alt || `Foto z ${photo.facility.name}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {photo.context && (
                  <span className="pointer-events-none absolute bottom-1 left-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                    {contextLabel(photo.context)}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href={photo.facility.href}
                  className="line-clamp-1 text-sm font-semibold text-zinc-900 hover:text-emerald-700"
                >
                  {photo.facility.name}
                </Link>
                {photo.facility.sportName && (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    {photo.facility.sportName}
                  </span>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between pt-2 text-xs text-zinc-500">
                <Link
                  href={authorHref}
                  className="font-medium text-zinc-700 hover:text-emerald-600"
                >
                  {authorName}
                </Link>
                <time dateTime={photo.createdAtIso}>{timeAgoCs(photo.createdAtIso)}</time>
              </div>
            </li>
          );
        })}
      </ul>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={close}
            aria-label="Zavřít"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                aria-label="Předchozí"
                className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Další"
                className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div
            className="flex max-h-[92vh] max-w-[92vw] flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.alt || `Foto z ${active.facility.name}`}
              className="max-h-[78vh] max-w-[92vw] rounded-lg object-contain"
              onContextMenu={(e) => {
                // SIL-667: right-click save → swap to watermarked URL.
                (e.currentTarget as HTMLImageElement).src = `/api/photos/${active.id}/download`;
              }}
            />

            <div className="mt-3 flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-white/90">
              <a
                href={`/api/photos/${active.id}/download`}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-white hover:bg-white/25"
                aria-label="Stáhnout fotku"
                download
              >
                <Download className="h-3.5 w-3.5" />
                Stáhnout
              </a>
              <PinterestShareButton
                photoId={active.id}
                pageUrl={`${active.facility.href}/fotky`}
                facilityName={active.facility.name}
                sportLabel={active.facility.sportName}
                authorName={active.user.name}
              />
              <Link
                href={active.facility.href}
                className="font-medium underline-offset-2 hover:underline"
                onClick={close}
              >
                {active.facility.name}
              </Link>
              {active.user.name && (
                <Link
                  href={`/uzivatel/${active.user.id}`}
                  className="underline-offset-2 hover:underline"
                  onClick={close}
                >
                  {active.user.name}
                </Link>
              )}
              {active.context && (
                <span className="rounded-full bg-white/15 px-2 py-0.5">
                  {contextLabel(active.context)}
                </span>
              )}
              <span className="text-white/60">{timeAgoCs(active.createdAtIso)}</span>
              <Link
                href={photoSourceHref(active, active.facility.href)}
                className="inline-flex items-center gap-1 text-emerald-300 underline-offset-2 hover:underline"
                onClick={close}
              >
                Zobrazit zdroj
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-3">
              <PhotoVoteButton
                photoId={active.id}
                createdAtIso={active.createdAtIso}
                authorUserId={active.user.id}
              />
            </div>
          </div>

          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
              {(lightboxIndex ?? 0) + 1} / {photos.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { contextLabel, photoSourceHref, type PhotoContext } from "@/lib/photos";
import { PhotoVoteButton } from "@/components/PhotoVoteButton";

export interface UserGalleryPhotoDTO {
  id: string;
  url: string;
  alt: string | null;
  createdAtIso: string;
  context: PhotoContext | null;
  reviewId: string | null;
  visitId: string | null;
  conditionReportId: string | null;
  facility: {
    id: string;
    name: string;
    href: string;
    sportName: string;
    city: string | null;
  };
}

interface UserPhotoGalleryProps {
  photos: UserGalleryPhotoDTO[];
  /** Author id of all photos in this gallery (profile-scoped) — used by the vote button. */
  ownerUserId: string;
  /** Tailwind class for grid columns. Defaults to 4-col masonry-style grid. */
  gridClassName?: string;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const day = 86_400_000;
  if (diff < day) return "dnes";
  if (diff < 2 * day) return "včera";
  const days = Math.floor(diff / day);
  if (days < 7) return `před ${days} dny`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `před ${weeks} týdny`;
  const months = Math.floor(days / 30);
  if (months < 12) return `před ${months} měsíci`;
  const years = Math.floor(days / 365);
  return `před ${years} lety`;
}

export function UserPhotoGallery({
  photos,
  ownerUserId,
  gridClassName = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4",
}: UserPhotoGalleryProps) {
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
      <div className={gridClassName}>
        {photos.map((photo, i) => (
          <figure
            key={photo.id}
            className="group relative overflow-hidden rounded-lg border border-zinc-100 bg-white"
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(i)}
              aria-label={`Otevřít fotku z ${photo.facility.name}`}
              className="relative block aspect-square w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <img
                src={photo.url}
                alt={photo.alt || `Fotka z ${photo.facility.name}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {photo.context && (
                <span className="pointer-events-none absolute bottom-1 left-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                  {contextLabel(photo.context)}
                </span>
              )}
            </button>
            <figcaption className="flex items-baseline justify-between gap-2 px-2.5 py-1.5 text-xs">
              <Link
                href={photo.facility.href}
                className="truncate font-medium text-zinc-800 hover:text-emerald-600 hover:underline"
                title={photo.facility.name}
              >
                {photo.facility.name}
              </Link>
              <span className="shrink-0 text-zinc-400">
                {timeAgo(photo.createdAtIso)}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

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
            <img
              src={active.url}
              alt={active.alt || `Fotka z ${active.facility.name}`}
              className="max-h-[78vh] max-w-[92vw] rounded-lg object-contain"
            />

            <div className="mt-3 flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-white/90">
              <Link
                href={active.facility.href}
                className="font-medium text-white underline-offset-2 hover:underline"
                onClick={close}
              >
                {active.facility.name}
              </Link>
              {active.facility.city && (
                <span className="text-white/60">{active.facility.city}</span>
              )}
              {active.context && (
                <span className="rounded-full bg-white/15 px-2 py-0.5">
                  {contextLabel(active.context)}
                </span>
              )}
              <span className="text-white/60">{timeAgo(active.createdAtIso)}</span>
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
                authorUserId={ownerUserId}
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

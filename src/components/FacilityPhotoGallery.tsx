"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { contextLabel, photoSourceHref, type PhotoContext } from "@/lib/photos";

export interface GalleryPhotoDTO {
  id: string;
  url: string;
  alt: string | null;
  createdAtIso: string;
  user: { id: string; name: string | null };
  context: PhotoContext | null;
  reviewId: string | null;
  visitId: string | null;
  conditionReportId: string | null;
}

interface FacilityPhotoGalleryProps {
  photos: GalleryPhotoDTO[];
  facilityHref: string;
  /** Tailwind class for grid columns. Defaults to gallery (4-col) layout. */
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

export function FacilityPhotoGallery({
  photos,
  facilityHref,
  gridClassName = "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4",
}: FacilityPhotoGalleryProps) {
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
          <button
            key={photo.id}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <img
              src={photo.url}
              alt={photo.alt || "Fotka od návštěvníka"}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {photo.context && (
              <span className="pointer-events-none absolute bottom-1 left-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                {contextLabel(photo.context)}
              </span>
            )}
          </button>
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
              alt={active.alt || "Fotka od návštěvníka"}
              className="max-h-[78vh] max-w-[92vw] rounded-lg object-contain"
            />

            <div className="mt-3 flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-white/90">
              {active.user.name && (
                <Link
                  href={`/uzivatel/${active.user.id}`}
                  className="font-medium underline-offset-2 hover:underline"
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
              <span className="text-white/60">{timeAgo(active.createdAtIso)}</span>
              <Link
                href={photoSourceHref(active, facilityHref)}
                className="inline-flex items-center gap-1 text-emerald-300 underline-offset-2 hover:underline"
                onClick={close}
              >
                Zobrazit zdroj
                <ExternalLink className="h-3 w-3" />
              </Link>
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

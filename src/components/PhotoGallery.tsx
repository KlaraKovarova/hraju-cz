"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface PhotoGalleryProps {
  images: { url: string; alt: string | null }[];
  facilityName: string;
}

export function PhotoGallery({ images, facilityName }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const displayImages = images.length > 0 ? images : [];

  if (displayImages.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex h-48 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50">
          <div className="text-center">
            <div className="text-4xl text-zinc-300">📷</div>
            <p className="mt-2 text-sm text-zinc-400">Fotky zatím nejsou k dispozici</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 py-6">
        {displayImages.length === 1 ? (
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="block w-full overflow-hidden rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Image
              src={displayImages[0].url}
              alt={displayImages[0].alt ?? facilityName}
              width={1200}
              height={600}
              className="h-auto max-h-[400px] w-full cursor-pointer object-cover transition hover:opacity-90"
            />
          </button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayImages.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? `${facilityName} — foto ${i + 1}`}
                  width={400}
                  height={300}
                  className="h-48 w-full cursor-pointer object-cover transition hover:scale-105 hover:opacity-90"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((lightboxIndex - 1 + displayImages.length) % displayImages.length);
                }}
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((lightboxIndex + 1) % displayImages.length);
                }}
                className="absolute right-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] max-w-[90vw]">
            <Image
              src={displayImages[lightboxIndex].url}
              alt={displayImages[lightboxIndex].alt ?? facilityName}
              width={1600}
              height={1000}
              className="max-h-[85vh] w-auto rounded-lg object-contain"
            />
          </div>

          {displayImages.length > 1 && (
            <div className="absolute bottom-4 text-sm text-white/70">
              {lightboxIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}

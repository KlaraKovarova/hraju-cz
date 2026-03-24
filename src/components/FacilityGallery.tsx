"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { PhotoLightbox } from "./PhotoLightbox";

interface GalleryPhoto {
  id: string;
  url: string;
  alt: string | null;
  createdAt: string;
  user: { name: string | null; id: string };
  review: { id: string; title: string | null } | null;
  visit: { id: string } | null;
}

interface FacilityGalleryProps {
  facilityId: string;
}

export function FacilityGallery({ facilityId }: FacilityGalleryProps) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/facilities/${facilityId}/photos`)
      .then((res) => res.json())
      .then((data) => setPhotos(data.photos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [facilityId]);

  if (loading || photos.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-zinc-900">
        <ImageIcon className="h-5 w-5 text-zinc-400" />
        Fotky od návštěvníků
        <span className="text-sm font-normal text-zinc-500">({photos.length})</span>
      </h2>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-100"
          >
            <img
              src={photo.url}
              alt={photo.alt || "Fotka od návštěvníka"}
              loading="lazy"
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos.map((p) => ({ url: p.url, alt: p.alt }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  );
}

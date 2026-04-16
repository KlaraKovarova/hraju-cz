import Link from "next/link";
import { Camera, ArrowRight } from "lucide-react";
import {
  buildPhotoAlt,
  getFacilityPhotos,
  type FacilityPhoto,
} from "@/lib/photos";
import { FacilityPhotoGallery, type GalleryPhotoDTO } from "./FacilityPhotoGallery";

interface FacilityPhotosPreviewProps {
  facilityId: string;
  facilityName: string;
  sportName: string;
  facilityHref: string;
}

function toDto(p: FacilityPhoto, facilityName: string, sportName: string): GalleryPhotoDTO {
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
  };
}

/**
 * FacilityPhotosPreview — server component. Renders top 6 photos in a
 * 2-row x 3-col grid with a "show all" link. Returns null when there are
 * no photos so the section disappears entirely on the facility page.
 */
export async function FacilityPhotosPreview({
  facilityId,
  facilityName,
  sportName,
  facilityHref,
}: FacilityPhotosPreviewProps) {
  const { photos, total } = await getFacilityPhotos(facilityId, { take: 6 });
  if (photos.length === 0) return null;

  const dtos = photos.map((p) => toDto(p, facilityName, sportName));

  return (
    <section className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
            <Camera className="h-5 w-5 text-zinc-400" />
            Fotky od uživatelů
            <span className="text-sm font-normal text-zinc-500">({total})</span>
          </h2>
          {total > photos.length && (
            <Link
              href={`${facilityHref}/fotky`}
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Zobrazit všechny
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        <FacilityPhotoGallery
          photos={dtos}
          facilityHref={facilityHref}
          gridClassName="grid grid-cols-3 gap-2 sm:gap-3"
          facilityName={facilityName}
          sportLabel={sportName}
        />
      </div>
    </section>
  );
}

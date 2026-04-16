import { Camera } from "lucide-react";
import type { RecentHomePhoto } from "@/lib/photos";
import { HomeRecentPhotosGallery, type HomePhotoDTO } from "./HomeRecentPhotosGallery";

interface HomeRecentPhotosProps {
  photos: RecentHomePhoto[];
}

function toDto(photo: RecentHomePhoto): HomePhotoDTO {
  const href = photo.facility.sportSlug
    ? `/sport/${photo.facility.sportSlug}/${photo.facility.slug}`
    : `/`;
  return {
    id: photo.id,
    url: photo.url,
    alt: photo.alt,
    createdAtIso: photo.createdAt.toISOString(),
    context: photo.context,
    reviewId: photo.reviewId,
    visitId: photo.visitId,
    conditionReportId: photo.conditionReportId,
    user: photo.user,
    facility: {
      id: photo.facility.id,
      name: photo.facility.name,
      slug: photo.facility.slug,
      sportSlug: photo.facility.sportSlug,
      sportName: photo.facility.sportName,
      href,
    },
  };
}

/**
 * HomeRecentPhotos — homepage rail of the most recent user-contributed
 * photos across all facilities. Hidden entirely when there are no photos.
 */
export function HomeRecentPhotos({ photos }: HomeRecentPhotosProps) {
  if (!photos || photos.length === 0) return null;

  const dtos = photos.map(toDto);

  return (
    <section className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6 flex flex-col items-center text-center">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900">
            <Camera className="h-5 w-5 text-emerald-500" />
            Nejnovější fotky
          </h2>
          <p className="mt-2 text-zinc-500">
            Čerstvé snímky od komunity (posledních 14 dní)
          </p>
        </div>

        <HomeRecentPhotosGallery photos={dtos} />
      </div>
    </section>
  );
}

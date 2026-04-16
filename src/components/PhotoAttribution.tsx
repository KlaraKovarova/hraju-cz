import Link from "next/link";
import { Camera } from "lucide-react";

export type PhotoAttributionVariant = "inline" | "overlay" | "card";

interface PhotoAttributionProps {
  userId: string;
  displayName: string | null;
  /** Optional avatar URL — reserved for future use. */
  avatarUrl?: string | null;
  variant: PhotoAttributionVariant;
  /** Optional onClick — used by lightbox overlays to close themselves on nav. */
  onNavigate?: () => void;
  /** Optional extra class names. */
  className?: string;
}

/**
 * PhotoAttribution — shared credit chip shown on every user-contributed photo.
 *
 * Variants:
 *  - `inline`  — neutral text row under a photo card (FacilityPhotosPreview)
 *  - `overlay` — semi-transparent chip sitting on/above a photo (lightbox corners)
 *  - `card`    — emerald meta row for homepage rail + Foto týdne card
 *
 * Links to `/uzivatel/{userId}`. Falls back to "Uživatel" when `displayName`
 * is null. Part of SIL-671 reciprocity loop.
 */
export function PhotoAttribution({
  userId,
  displayName,
  variant,
  onNavigate,
  className,
}: PhotoAttributionProps) {
  const name = displayName?.trim() || "Uživatel";
  const href = `/uzivatel/${userId}`;

  if (variant === "inline") {
    return (
      <div
        className={`flex items-center gap-1 text-[11px] text-zinc-500 ${className ?? ""}`}
      >
        <Camera className="h-3 w-3 text-zinc-400" aria-hidden="true" />
        <span>Foto:</span>
        <Link
          href={href}
          onClick={onNavigate}
          className="font-medium text-zinc-700 hover:text-emerald-600 hover:underline"
        >
          {name}
        </Link>
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        aria-label={`Autor fotky: ${name}`}
        className={`inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm transition hover:bg-black/70 ${className ?? ""}`}
      >
        <Camera className="h-3 w-3" aria-hidden="true" />
        <span className="opacity-80">Foto:</span>
        <span className="underline-offset-2 hover:underline">{name}</span>
      </Link>
    );
  }

  // card
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline ${className ?? ""}`}
    >
      <Camera className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Foto: {name}</span>
    </Link>
  );
}

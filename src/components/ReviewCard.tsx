"use client";

import { useState } from "react";
import Link from "next/link";
import { StarRating } from "./StarRating";
import { PhotoLightbox } from "./PhotoLightbox";
import { User, ThumbsUp, Flag, Link2, Check } from "lucide-react";

interface ReviewPhoto {
  id: string;
  url: string;
  alt?: string | null;
}

interface ReviewCardProps {
  id: string;
  facilityId: string;
  facilityUrl?: string;
  userId?: string | null;
  authorName: string;
  rating: number;
  title: string | null;
  text: string | null;
  helpful: number;
  createdAt: string;
  photos?: ReviewPhoto[];
}

export function ReviewCard({
  id,
  facilityId,
  facilityUrl,
  userId,
  authorName,
  rating,
  title,
  text,
  helpful: initialHelpful,
  createdAt,
  photos,
}: ReviewCardProps) {
  const [helpful, setHelpful] = useState(initialHelpful);
  const [voted, setVoted] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  async function handleShareReview() {
    const shareUrl = facilityUrl ? `${facilityUrl}#recenze` : window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  async function handleHelpful() {
    if (voted) return;
    setVoted(true);
    setHelpful((h) => h + 1);
    try {
      await fetch(`/api/facilities/${facilityId}/reviews/${id}/helpful`, {
        method: "POST",
      });
    } catch {
      setVoted(false);
      setHelpful((h) => h - 1);
    }
  }

  async function handleFlag() {
    if (flagged) return;
    setFlagged(true);
    try {
      await fetch(`/api/facilities/${facilityId}/reviews/${id}/flag`, {
        method: "POST",
      });
    } catch {
      setFlagged(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <User className="h-4 w-4" />
          </div>
          <div>
            {userId ? (
              <Link
                href={`/uzivatel/${userId}`}
                className="text-sm font-semibold text-zinc-900 hover:text-emerald-600 hover:underline"
              >
                {authorName}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-zinc-900">
                {authorName}
              </span>
            )}
            <div className="mt-0.5 flex items-center gap-2">
              <StarRating rating={rating} size="sm" />
              <span className="text-xs text-zinc-400">
                {new Date(createdAt).toLocaleDateString("cs", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {title && (
        <p className="mt-2 text-sm font-semibold text-zinc-800">{title}</p>
      )}

      {text && (
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{text}</p>
      )}

      {/* Photos */}
      {photos && photos.length > 0 && (
        <div className="mt-3 flex gap-2">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="h-16 w-16 overflow-hidden rounded-lg border border-zinc-100 transition hover:opacity-80"
            >
              <img
                src={photo.url}
                alt={photo.alt || "Fotka z recenze"}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {lightboxIndex !== null && photos && photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-3 border-t border-zinc-50 pt-3">
        <button
          type="button"
          onClick={handleHelpful}
          disabled={voted}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
            voted
              ? "bg-emerald-50 text-emerald-600"
              : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {helpful > 0 ? `Užitečné (${helpful})` : "Užitečné"}
        </button>
        <button
          type="button"
          onClick={handleFlag}
          disabled={flagged}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
            flagged
              ? "text-red-400"
              : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
          }`}
        >
          <Flag className="h-3.5 w-3.5" />
          {flagged ? "Nahlášeno" : "Nahlásit"}
        </button>
        <button
          type="button"
          onClick={handleShareReview}
          className={`ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
            linkCopied
              ? "text-emerald-500"
              : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
          }`}
        >
          {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
          {linkCopied ? "Zkopírováno" : "Sdílet"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { MapPinCheck, Loader2, LogIn, Share2, Check, Camera, Star, MapPin, ChevronRight } from "lucide-react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { PhotoUpload } from "./PhotoUpload";

type NearbySuggestion = {
  name: string;
  slug: string;
  sportSlug: string;
  city: string;
  distanceKm: number | null;
};

interface CheckInButtonProps {
  facilityId: string;
  currentPath: string;
  /** Facility name for share text */
  facilityName?: string;
}

export function CheckInButton({ facilityId, currentPath, facilityName }: CheckInButtonProps) {
  const [hasVisited, setHasVisited] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [newBadges, setNewBadges] = useState<{ slug: string; name: string; emoji: string }[]>([]);
  const [suggestions, setSuggestions] = useState<NearbySuggestion[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [visitRes, meRes] = await Promise.all([
          fetch(`/api/facilities/${facilityId}/visit`),
          fetch("/api/auth/me"),
        ]);

        if (visitRes.ok) {
          const data = await visitRes.json();
          setCount(data.count);
          setHasVisited(data.hasVisited);
        }

        setIsLoggedIn(meRes.ok);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [facilityId]);

  async function handleToggle() {
    if (!isLoggedIn) return;
    setSubmitting(true);

    try {
      if (hasVisited) {
        const res = await fetch(`/api/facilities/${facilityId}/visit`, {
          method: "DELETE",
        });
        if (res.ok) {
          setHasVisited(false);
          setCount((c) => Math.max(0, c - 1));
          setShowSharePrompt(false);
        }
      } else {
        const res = await fetch(`/api/facilities/${facilityId}/visit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          const data = await res.json();
          setVisitId(data.id);
          setHasVisited(true);
          setCount((c) => c + 1);
          setShowSharePrompt(true);
          if (data.newBadges?.length > 0) {
            setNewBadges(data.newBadges);
            setTimeout(() => setNewBadges([]), 6000);
          }
          // Fetch nearby unvisited facilities (fire-and-forget)
          fetch(`/api/facilities/${facilityId}/visit/nearby`)
            .then((r) => r.ok ? r.json() : null)
            .then((d) => { if (d?.suggestions?.length) setSuggestions(d.suggestions); })
            .catch(() => {});
        }
      }
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-white px-4 py-3 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Načítám...</span>
      </div>
    );
  }

  // Not logged in — show login CTA
  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <MapPinCheck className="h-4 w-4 text-zinc-400" />
          <span>
            {count > 0 ? (
              <>
                <span className="font-semibold text-zinc-700">{count}</span>{" "}
                {count === 1 ? "návštěvník" : count >= 2 && count <= 4 ? "návštěvníci" : "návštěvníků"}
              </>
            ) : (
              "Byl/a jste tu?"
            )}
          </span>
        </div>
        <Link
          href={`/prihlaseni?redirect=${encodeURIComponent(currentPath)}`}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
        >
          <LogIn className="h-3.5 w-3.5" />
          Přihlásit se
        </Link>
      </div>
    );
  }

  async function handleVisitPhotos(newPhotos: { id: string; url: string }[]) {
    setPhotos(newPhotos);
    // Link new photos to the visit
    if (visitId && newPhotos.length > photos.length) {
      const latest = newPhotos[newPhotos.length - 1];
      try {
        await fetch(`/api/facilities/${facilityId}/visit/photo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId: latest.id }),
        });
      } catch {
        // silent
      }
    }
  }

  async function handleShare() {
    const shareUrl = `https://www.hraju.cz${currentPath}`;
    const shareText = facilityName ? `Navštívil/a jsem ${facilityName} na hraju.cz` : "Podívejte se na toto sportoviště na hraju.cz";

    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: shareUrl });
        setShowSharePrompt(false);
        return;
      } catch {
        // User cancelled
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => {
        setShareCopied(false);
        setShowSharePrompt(false);
      }, 2000);
    } catch {
      // Clipboard not available
    }
  }

  return (
    <div className="space-y-2">
      {/* Badge earned toast */}
      {newBadges.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          {newBadges.map((badge) => (
            <div key={badge.slug} className="flex items-center gap-2 text-sm font-medium text-amber-800">
              <span className="text-lg">{badge.emoji}</span>
              <span>Nový odznak: <strong>{badge.name}</strong></span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-3">
        <button
          onClick={handleToggle}
          disabled={submitting}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            hasVisited
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
          } disabled:opacity-50`}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPinCheck
              className={`h-4 w-4 ${hasVisited ? "text-emerald-600" : "text-zinc-400"}`}
            />
          )}
          {hasVisited ? "Byl/a jsem tady ✓" : "Byl/a jsem tady"}
        </button>
        {count > 0 && (
          <span className="text-sm text-zinc-500">
            <span className="font-semibold text-zinc-700">{count}</span>{" "}
            {count === 1 ? "návštěvník" : count >= 2 && count <= 4 ? "návštěvníci" : "návštěvníků"}
          </span>
        )}
      </div>

      {/* Share prompt + photo upload after check-in */}
      {showSharePrompt && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
          {/* Review CTA — prompt user to write a review after check-in */}
          <a
            href="#recenze"
            onClick={() => trackEvent("checkin_review_cta_click", { facilityId })}
            className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 transition hover:bg-amber-50"
          >
            <Star className="h-5 w-5 text-amber-500 shrink-0" />
            <span className="text-sm font-medium text-amber-800">
              Jak se vám tu líbilo? Napište recenzi
            </span>
            <span className="ml-auto text-xs font-medium text-amber-600">&darr;</span>
          </a>
          <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
            <span className="text-sm text-emerald-700">Sdílejte svou návštěvu!</span>
            <button
              type="button"
              onClick={handleShare}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
            >
              {shareCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              {shareCopied ? "Zkopírováno!" : "Sdílet"}
            </button>
            {!showPhotoUpload && (
              <button
                type="button"
                onClick={() => setShowPhotoUpload(true)}
                className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
              >
                <Camera className="h-3.5 w-3.5" />
                Přidat fotku
              </button>
            )}
            <button
              type="button"
              onClick={() => { setShowSharePrompt(false); setShowPhotoUpload(false); }}
              className="text-xs text-emerald-600 hover:text-emerald-800"
            >
              Zavřít
            </button>
          </div>
          {showPhotoUpload && (
            <div className="rounded-xl border border-zinc-100 bg-white px-4 py-3">
              <PhotoUpload
                facilityId={facilityId}
                context="visit"
                maxPhotos={1}
                photos={photos}
                onPhotosChange={handleVisitPhotos}
              />
            </div>
          )}
          {/* Nearby unvisited facility suggestions */}
          {suggestions.length > 0 && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
              <p className="mb-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Kam příště?</p>
              <div className="space-y-1.5">
                {suggestions.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/sport/${s.sportSlug}/${s.slug}`}
                    onClick={() => trackEvent("checkin_nearby_click", { facilityId, targetSlug: s.slug })}
                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm transition hover:bg-blue-50"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    <span className="truncate font-medium text-zinc-800">{s.name}</span>
                    <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-zinc-500">
                      {s.distanceKm != null
                        ? s.distanceKm < 1
                          ? `${Math.round(s.distanceKm * 1000)} m`
                          : `${s.distanceKm.toFixed(1)} km`
                        : s.city}
                      <ChevronRight className="h-3 w-3 text-zinc-400" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

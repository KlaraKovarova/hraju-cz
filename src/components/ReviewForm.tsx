"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StarRating } from "./StarRating";
import { PhotoUpload } from "./PhotoUpload";
import { User, Share2, Check, Link2, ExternalLink } from "lucide-react";

interface ReviewFormProps {
  facilityId: string;
  currentPath: string;
  facilityName?: string;
  facilityUrl?: string;
}

interface UserData {
  userId: string;
  email: string;
  name: string | null;
}

export function ReviewForm({ facilityId, currentPath, facilityName, facilityUrl }: ReviewFormProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [newBadges, setNewBadges] = useState<{ slug: string; name: string; emoji: string }[]>([]);
  const [autoApproved, setAutoApproved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Vyberte hodnocení.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/facilities/${facilityId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          text: text.trim() || undefined,
          photoIds: photos.map((p) => p.id),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(true);
        setAutoApproved(!!data.autoApproved);
        if (data.newBadges?.length > 0) {
          setNewBadges(data.newBadges);
        }
      } else {
        const data = await res.json();
        setError(data.error || "Nepodařilo se odeslat recenzi.");
      }
    } catch {
      setError("Chyba sítě. Zkuste to znovu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <ShareAfterReview
        facilityId={facilityId}
        facilityName={facilityName}
        facilityUrl={facilityUrl}
        currentPath={currentPath}
        newBadges={newBadges}
        autoApproved={autoApproved}
      />
    );
  }

  // Not logged in — show login prompt
  if (authChecked && !user) {
    return (
      <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-6 text-center">
        <User className="mx-auto h-8 w-8 text-zinc-400" />
        <p className="mt-2 text-sm font-semibold text-zinc-700">
          Pro přidání recenze se přihlaste
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Stačí zadat e-mail a pošleme vám přihlašovací odkaz.
        </p>
        <Link
          href={`/prihlaseni?redirect=${encodeURIComponent(currentPath)}`}
          className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          Přihlásit se
        </Link>
      </div>
    );
  }

  // Loading auth state
  if (!authChecked) {
    return (
      <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-6 text-center">
        <p className="text-sm text-zinc-400">Načítání...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Show who is reviewing */}
      <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
        <User className="h-4 w-4 text-zinc-400" />
        <span>
          Recenzujete jako{" "}
          <strong className="text-zinc-800">
            {user!.name || user!.email}
          </strong>
        </span>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Hodnocení *
        </label>
        <div className="flex items-center gap-2">
          <StarRating
            rating={rating}
            size="md"
            interactive
            onChange={setRating}
          />
          {rating > 0 && (
            <span className="text-xs font-medium text-zinc-500">
              {["Špatné", "Podprůměrné", "Průměrné", "Dobré", "Vynikající"][rating - 1]}
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Titulek (nepovinné)
        </label>
        <input
          type="text"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          placeholder="Shrňte svou zkušenost..."
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Text recenze (nepovinné)
        </label>
        <textarea
          rows={3}
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          placeholder="Popište svou zkušenost..."
        />
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className={text.length >= 200 ? "text-emerald-600 font-medium" : text.length >= 100 ? "text-emerald-500" : text.length > 0 && text.length < 50 ? "text-zinc-400" : "text-zinc-400"}>
            {text.length >= 200
              ? "Skvělá podrobná recenze!"
              : text.length >= 100
                ? "Hezky podrobné, díky!"
                : text.length > 0 && text.length < 50
                  ? "Zkuste přidat víc detailů..."
                  : "\u00A0"}
          </span>
          <span className="text-zinc-400">{text.length}/2000</span>
        </div>
      </div>

      <div>
        <PhotoUpload
          facilityId={facilityId}
          context="review"
          maxPhotos={3}
          photos={photos}
          onPhotosChange={setPhotos}
        />
        {photos.length === 0 && (
          <p className="mt-1 text-xs text-zinc-400">
            📷 Fotky získávají 2× více hlasů
          </p>
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {submitting ? "Odesílání..." : "Odeslat recenzi"}
      </button>
    </form>
  );
}

function trackShare(facilityId: string, platform: string) {
  fetch("/api/shares/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ facilityId, platform, context: "review" }),
  }).catch(() => {});
}

function ShareAfterReview({
  facilityId,
  facilityName,
  facilityUrl,
  currentPath,
  newBadges,
  autoApproved,
}: {
  facilityId: string;
  facilityName?: string;
  facilityUrl?: string;
  currentPath: string;
  newBadges: { slug: string; name: string; emoji: string }[];
  autoApproved: boolean;
}) {
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    setHasNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const shareUrl = facilityUrl ?? `https://www.hraju.cz${currentPath}`;
  const shareText = facilityName
    ? `Právě jsem ohodnotil/a ${facilityName} na hraju.cz`
    : "Podívejte se na moji recenzi na hraju.cz";

  async function handleNativeShare() {
    try {
      await navigator.share({ title: shareText, text: shareText, url: shareUrl });
      trackShare(facilityId, "native");
    } catch {
      // User cancelled
    }
  }

  return (
    <div className="rounded-xl bg-emerald-50 p-5 text-center">
      <p className="text-sm font-semibold text-emerald-800">
        Děkujeme za recenzi!
      </p>
      <p className="mt-1 text-xs text-emerald-600">
        {autoApproved
          ? "Vaše recenze byla automaticky zveřejněna."
          : "Bude zobrazena po schválení."}
      </p>
      {newBadges.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
          {newBadges.map((badge) => (
            <p key={badge.slug} className="text-sm font-medium text-amber-800">
              {badge.emoji} Nový odznak: <strong>{badge.name}</strong>
            </p>
          ))}
        </div>
      )}
      <div className="mt-4 border-t border-emerald-100 pt-4">
        <p className="mb-2 text-xs font-medium text-emerald-700">
          <Share2 className="mr-1 inline h-3.5 w-3.5" />
          Sdílejte svou recenzi
        </p>
        <div className="flex items-center justify-center gap-2">
          {hasNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              <ExternalLink className="h-4 w-4" />
              Sdílet
            </button>
          )}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare(facilityId, "facebook")}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 transition hover:bg-blue-50"
            title="Facebook"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare(facilityId, "x")}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zinc-900 transition hover:bg-zinc-100"
            title="X"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <ShareCopyButton url={shareUrl} onCopy={() => trackShare(facilityId, "copy")} />
        </div>
      </div>
    </div>
  );
}

function ShareCopyButton({ url, onCopy }: { url: string; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zinc-500 transition hover:bg-zinc-100"
      title={copied ? "Zkopírováno!" : "Kopírovat odkaz"}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
    </button>
  );
}

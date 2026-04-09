"use client";

import { useState } from "react";
import Link from "next/link";
import { StarRating } from "./StarRating";
import { PhotoLightbox } from "./PhotoLightbox";
import { User, ThumbsUp, Flag, Link2, Check, MessageCircle, Send, Loader2 } from "lucide-react";

interface ReviewPhoto {
  id: string;
  url: string;
  alt?: string | null;
}

interface ReviewReply {
  id: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface ReviewBadge {
  slug: string;
  emoji: string;
  name: string;
}

interface ExpertiseLabel {
  name: string;
  level: "znalec" | "expert";
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
  replyCount?: number;
  createdAt: string;
  photos?: ReviewPhoto[];
  badges?: ReviewBadge[];
  expertiseLabel?: ExpertiseLabel | null;
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
  replyCount: initialReplyCount = 0,
  createdAt,
  photos,
  badges,
  expertiseLabel,
}: ReviewCardProps) {
  const [helpful, setHelpful] = useState(initialHelpful);
  const [voted, setVoted] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Reply state
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<ReviewReply[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyCount, setReplyCount] = useState(initialReplyCount);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

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

  async function loadReplies() {
    if (repliesLoaded) {
      setShowReplies(!showReplies);
      return;
    }
    setLoadingReplies(true);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/reviews/${id}/replies`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data.replies);
        setRepliesLoaded(true);
        setShowReplies(true);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingReplies(false);
    }
  }

  async function handleSubmitReply() {
    if (!replyText.trim() || submittingReply) return;
    setSubmittingReply(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/reviews/${id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText.trim() }),
      });
      if (res.ok) {
        const newReply = await res.json();
        setReplies((prev) => [...prev, newReply]);
        setReplyCount((c) => c + 1);
        setReplyText("");
        setShowReplyForm(false);
        setShowReplies(true);
        setRepliesLoaded(true);
      } else {
        const data = await res.json();
        setReplyError(data.error || "Nepodařilo se odeslat odpověď.");
      }
    } catch {
      setReplyError("Nepodařilo se odeslat odpověď.");
    } finally {
      setSubmittingReply(false);
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
            <div className="flex items-center gap-1.5">
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
              {badges && badges.length > 0 && (
                <span className="flex items-center gap-0.5">
                  {badges.slice(0, 3).map((b) => (
                    <span
                      key={b.slug}
                      title={b.name}
                      className="text-xs leading-none"
                    >
                      {b.emoji}
                    </span>
                  ))}
                </span>
              )}
              {expertiseLabel && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight ${
                    expertiseLabel.level === "expert"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {expertiseLabel.name}
                </span>
              )}
            </div>
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
          onClick={() => {
            if (replyCount > 0 && !showReplies) {
              loadReplies();
            }
            setShowReplyForm(!showReplyForm);
          }}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
            showReplyForm
              ? "bg-emerald-50 text-emerald-600"
              : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {replyCount > 0 ? `Odpovědi (${replyCount})` : "Odpovědět"}
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

      {/* Reply count toggle (when replies exist but not yet loaded) */}
      {replyCount > 0 && !showReplies && !showReplyForm && (
        <button
          type="button"
          onClick={loadReplies}
          disabled={loadingReplies}
          className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
        >
          {loadingReplies ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <MessageCircle className="h-3 w-3" />
          )}
          Zobrazit {replyCount} {replyCount === 1 ? "odpověď" : replyCount < 5 ? "odpovědi" : "odpovědí"}
        </button>
      )}

      {/* Replies thread */}
      {showReplies && replies.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-emerald-100 pl-3">
          {replies.map((reply) => (
            <div key={reply.id} className="rounded-lg bg-zinc-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-zinc-400">
                  <User className="h-3 w-3" />
                </div>
                <Link
                  href={`/uzivatel/${reply.userId}`}
                  className="text-xs font-semibold text-zinc-800 hover:text-emerald-600"
                >
                  {reply.authorName}
                </Link>
                <span className="text-xs text-zinc-400">
                  {new Date(reply.createdAt).toLocaleDateString("cs", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                {reply.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      {showReplyForm && (
        <div className="mt-3 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Napište odpověď..."
            maxLength={1000}
            rows={2}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
          {replyError && (
            <p className="text-xs text-red-500">{replyError}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              {replyText.length}/1000
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyText("");
                  setReplyError(null);
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || submittingReply}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {submittingReply ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                Odeslat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

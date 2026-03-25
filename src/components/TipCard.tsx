"use client";

import { useState } from "react";
import Link from "next/link";
import { User, ThumbsUp, Flag } from "lucide-react";

interface TipCardProps {
  id: string;
  facilityId: string;
  userId?: string | null;
  authorName: string;
  text: string;
  helpful: number;
  createdAt: string;
}

export function TipCard({
  id,
  facilityId,
  userId,
  authorName,
  text,
  helpful: initialHelpful,
  createdAt,
}: TipCardProps) {
  const [helpful, setHelpful] = useState(initialHelpful);
  const [voted, setVoted] = useState(false);
  const [flagged, setFlagged] = useState(false);

  async function handleHelpful() {
    if (voted) return;
    setVoted(true);
    setHelpful((h) => h + 1);
    try {
      await fetch(`/api/facilities/${facilityId}/tips/${id}/helpful`, {
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
      await fetch(`/api/facilities/${facilityId}/tips/${id}/flag`, {
        method: "POST",
      });
    } catch {
      setFlagged(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
          <span className="text-sm">💡</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-zinc-700">{text}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
            <User className="h-3 w-3" />
            {userId ? (
              <Link
                href={`/uzivatel/${userId}`}
                className="hover:text-emerald-600 hover:underline"
              >
                {authorName}
              </Link>
            ) : (
              <span>{authorName}</span>
            )}
            <span>·</span>
            <span>
              {new Date(createdAt).toLocaleDateString("cs", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

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
      </div>
    </div>
  );
}

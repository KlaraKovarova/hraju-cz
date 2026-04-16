"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

interface PhotoVoteButtonProps {
  photoId: string;
  /** createdAt ISO string — used to decide client-side eligibility before hydration */
  createdAtIso: string;
  /** Photo author id, to hide the button on own photos before hydration */
  authorUserId: string;
}

type VoteState = {
  voted: boolean;
  canVote: boolean;
  eligible: boolean;
  voteCount: number;
  weekKey: string;
  authenticated: boolean;
  isOwn: boolean;
};

const ELIGIBILITY_MS = 14 * 24 * 60 * 60 * 1000;

function clientEligible(createdAtIso: string): boolean {
  const t = new Date(createdAtIso).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= ELIGIBILITY_MS;
}

export function PhotoVoteButton({ photoId, createdAtIso, authorUserId }: PhotoVoteButtonProps) {
  const [state, setState] = useState<VoteState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/photos/${photoId}/vote`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: VoteState & { error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        setError(null);
        setState(data);
      })
      .catch(() => {
        if (!cancelled) setError("Nepodařilo se načíst hlasy");
      });
    return () => {
      cancelled = true;
    };
  }, [photoId]);

  // Hide the button for photos the visitor clearly can't vote on (own photo, expired).
  if (state) {
    if (state.isOwn) return null;
    if (!state.eligible) return null;
  } else {
    if (!clientEligible(createdAtIso)) return null;
    // We don't know session yet, but authorUserId check is cheap & public.
    // If we later discover isOwn=true we return null above.
  }

  const voted = state?.voted ?? false;
  const voteCount = state?.voteCount ?? 0;

  function handleClick() {
    setError(null);
    if (state && !state.authenticated) {
      setLoginPrompt(true);
      return;
    }

    // Optimistic update
    const previous = state;
    if (state) {
      setState({
        ...state,
        voted: !state.voted,
        voteCount: Math.max(0, state.voteCount + (state.voted ? -1 : 1)),
      });
    }

    startTransition(() => {
      fetch(`/api/photos/${photoId}/vote`, { method: "POST" })
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) {
            if (previous) setState(previous);
            setError(data.error || "Hlasování selhalo");
            return;
          }
          setState((s) => ({
            ...(s ?? {
              canVote: true,
              eligible: true,
              weekKey: data.weekKey,
              authenticated: true,
              isOwn: false,
            }),
            voted: Boolean(data.voted),
            voteCount: Number(data.voteCount) || 0,
            weekKey: data.weekKey,
            authenticated: true,
            canVote: true,
            eligible: true,
            isOwn: false,
          }));
        })
        .catch(() => {
          if (previous) setState(previous);
          setError("Hlasování selhalo");
        });
    });
  }

  // Static no-op placeholder for SSR / unauthenticated cold state.
  const label = voted ? "Zrušit hlas" : "Hlasovat pro foto týdne";

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={voted}
        aria-label={label}
        data-photo-id={photoId}
        data-author-id={authorUserId}
        className={`
          inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium
          transition
          ${voted
            ? "bg-pink-500 text-white shadow-sm hover:bg-pink-600"
            : "bg-white/15 text-white hover:bg-white/25"}
          disabled:cursor-not-allowed disabled:opacity-60
        `}
      >
        <Heart className={`h-4 w-4 ${voted ? "fill-current" : ""}`} />
        <span>{label}</span>
        {voteCount > 0 && (
          <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-semibold tabular-nums">
            {voteCount}
          </span>
        )}
      </button>
      {loginPrompt && (
        <p className="text-[11px] text-white/80">
          <Link href="/prihlaseni" className="text-emerald-300 underline-offset-2 hover:underline">
            Přihlaste se
          </Link>{" "}
          pro hlasování
        </p>
      )}
      {error && <p className="text-[11px] text-red-300">{error}</p>}
    </div>
  );
}

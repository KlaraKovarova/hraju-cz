"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Crown } from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
  userId: string;
  name: string;
  progress: number;
  completed: boolean;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  myRank: number | null;
  target: number;
}

export function ChallengeLeaderboard({
  challengeSlug,
  mini = true,
}: {
  challengeSlug: string;
  mini?: boolean;
}) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [expanded, setExpanded] = useState(!mini);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/challenges/${challengeSlug}/leaderboard`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [challengeSlug]);

  if (loading || !data || data.leaderboard.length === 0) return null;

  const entries = expanded ? data.leaderboard : data.leaderboard.slice(0, 5);

  return (
    <div className="mt-3 border-t border-zinc-100 pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Žebříček
        </span>
        {data.myRank && (
          <span className="text-[11px] text-emerald-600 font-medium">
            Vaše pozice: #{data.myRank}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const isMe = data.myRank === rank;
          const pct = Math.min((entry.progress / data.target) * 100, 100);

          return (
            <Link
              key={entry.userId}
              href={`/uzivatel/${entry.userId}`}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                isMe
                  ? "bg-emerald-50 ring-1 ring-emerald-200"
                  : "hover:bg-zinc-50"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  rank === 1
                    ? "bg-amber-100 text-amber-700"
                    : rank === 2
                      ? "bg-zinc-200 text-zinc-600"
                      : rank === 3
                        ? "bg-orange-100 text-orange-600"
                        : "text-zinc-400"
                }`}
              >
                {rank === 1 ? <Crown className="h-3 w-3" /> : rank}
              </span>

              <span className={`min-w-0 flex-1 truncate ${isMe ? "font-semibold text-emerald-800" : "text-zinc-700"}`}>
                {entry.name}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="h-1.5 w-12 rounded-full bg-zinc-200">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      entry.completed ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-[10px] w-7 text-right ${entry.completed ? "font-semibold text-amber-700" : "text-zinc-400"}`}>
                  {entry.progress}/{data.target}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {data.leaderboard.length > 5 && (
        <button
          onClick={(e) => {
            e.preventDefault();
            setExpanded(!expanded);
          }}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-md py-1 text-[11px] text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Zobrazit méně
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Celý žebříček ({data.leaderboard.length})
            </>
          )}
        </button>
      )}
    </div>
  );
}

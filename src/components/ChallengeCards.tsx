"use client";

import { useState, useEffect } from "react";
import { Trophy, Lock, CheckCircle2 } from "lucide-react";

interface BadgeProgress {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  earned: boolean;
  progress: number;
  target: number;
}

export function ChallengeCards({ filter }: { filter?: "sport" | "review" | "community" | "streak" | "seasonal" }) {
  const [badges, setBadges] = useState<BadgeProgress[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/my-badges/progress");
        if (res.ok) {
          const data = await res.json();
          setBadges(data.progress);
          setIsLoggedIn(true);
        }
      } catch {
        // Not logged in or error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !isLoggedIn) return null;

  const filtered = filter ? badges.filter((b) => b.category === filter) : badges;
  if (filtered.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-4.5 w-4.5 text-amber-500" />
        <h3 className="text-sm font-bold text-zinc-900">Aktivní výzvy</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((badge) => (
          <div
            key={badge.slug}
            className={`relative rounded-lg border p-3 ${
              badge.earned
                ? "border-emerald-200 bg-emerald-50/50"
                : "border-zinc-100 bg-zinc-50/50"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-xl leading-none">{badge.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-zinc-900">{badge.name}</span>
                  {badge.earned ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Lock className="h-3 w-3 text-zinc-300" />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">{badge.description}</p>
                {!badge.earned && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                      <span>{badge.progress}/{badge.target}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-200">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${(badge.progress / badge.target) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

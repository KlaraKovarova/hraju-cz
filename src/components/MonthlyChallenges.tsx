"use client";

import { useState, useEffect } from "react";
import { Trophy, Clock, Users } from "lucide-react";
import { type MonthlyChallenge, getActiveChallenges } from "@/lib/monthly-challenges";

interface ChallengeProgress {
  slug: string;
  earned: boolean;
  progress: number;
  target: number;
}

export function MonthlyChallenges() {
  const [challenges] = useState<MonthlyChallenge[]>(() => getActiveChallenges());
  const [progressMap, setProgressMap] = useState<Map<string, ChallengeProgress>>(new Map());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    if (challenges.length === 0) return;

    // Calculate days left for the first challenge's end date
    const endDate = new Date(challenges[0].endDate + "T23:59:59");
    const now = new Date();
    const diff = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    setDaysLeft(diff);

    // Fetch user progress if logged in
    async function loadProgress() {
      try {
        const res = await fetch("/api/auth/my-badges/progress");
        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(true);
          const map = new Map<string, ChallengeProgress>();
          for (const p of data.progress) {
            map.set(p.slug, { slug: p.slug, earned: p.earned, progress: p.progress, target: p.target });
          }
          setProgressMap(map);
        }
      } catch {
        // Not logged in
      }
    }
    loadProgress();
  }, [challenges]);

  if (challenges.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-zinc-900">Dubnové výzvy</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Clock className="h-3.5 w-3.5" />
          {daysLeft > 0 ? (
            <span>Zbývá {daysLeft} {daysLeft === 1 ? "den" : daysLeft <= 4 ? "dny" : "dní"}</span>
          ) : (
            <span>Brzy startuje</span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {challenges.map((challenge) => {
          const cp = progressMap.get(challenge.badgeSlug);
          const progress = cp?.progress ?? 0;
          const earned = cp?.earned ?? false;

          return (
            <div
              key={challenge.slug}
              className={`rounded-xl border p-5 transition-colors ${
                earned
                  ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none">{challenge.emoji}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-zinc-900">{challenge.title}</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">{challenge.description}</p>

                  {isLoggedIn && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={earned ? "font-semibold text-amber-700" : "text-zinc-500"}>
                          {earned ? "Splněno!" : `${progress}/${challenge.target}`}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-200">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            earned ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min((progress / challenge.target) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {!isLoggedIn && (
                    <p className="mt-3 text-xs text-zinc-400">
                      Přihlaste se pro sledování pokroku
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

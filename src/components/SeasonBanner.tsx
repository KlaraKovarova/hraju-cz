"use client";

import { useState } from "react";
import { X, Mountain, ArrowDown } from "lucide-react";

interface SeasonBannerProps {
  sportSlug: string;
}

const SEASON_CONFIG: Record<string, { label: string; cta: string; ctaAnchor: string; icon: string }> = {
  ferraty: {
    label: "Ferratová sezóna je tady! Navštiv svou první ferratu a získej odznak.",
    cta: "Najít ferratu",
    ctaAnchor: "#kraje",
    icon: "\u26F0\uFE0F",
  },
  lezeni: {
    label: "Lezecká sezóna je v plném proudu! Objevuj nové stěny a skály.",
    cta: "Najít stěnu",
    ctaAnchor: "#kraje",
    icon: "\uD83E\uDDD7",
  },
};

function isInSeason(): boolean {
  const month = new Date().getMonth(); // 0-indexed
  return month >= 3 && month <= 9; // April–October
}

/** Seasonal CTA banner for ferraty/lezení — visible April through October only */
export function SeasonBanner({ sportSlug }: SeasonBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    if (!isInSeason()) return true;
    return sessionStorage.getItem(`season-banner-dismissed-${sportSlug}`) === "1";
  });

  const config = SEASON_CONFIG[sportSlug];
  if (dismissed || !config) return null;

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem(`season-banner-dismissed-${sportSlug}`, "1");
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3.5">
        <span className="text-2xl shrink-0">{config.icon}</span>
        <p className="text-sm font-medium text-white/95">
          {config.label}
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <a
            href={config.ctaAnchor}
            className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
          >
            <Mountain className="h-3.5 w-3.5" />
            {config.cta}
          </a>
          <a
            href="#vyzvy"
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/20"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            Výzvy
          </a>
          <button
            onClick={dismiss}
            className="rounded p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Zavřít"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

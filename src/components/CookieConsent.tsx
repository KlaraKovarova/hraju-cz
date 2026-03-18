"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "hraju-cookie-consent";

type ConsentValue = "accepted" | "rejected";

export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CONSENT_KEY) as ConsentValue | null;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getConsent();
    if (!stored) {
      setVisible(true);
    }
  }, []);

  function handleChoice(choice: ConsentValue) {
    localStorage.setItem(CONSENT_KEY, choice);
    setVisible(false);
    if (choice === "accepted") {
      window.dispatchEvent(new Event("cookie-consent-accepted"));
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          Tento web používá cookies pro analýzu návštěvnosti (Google Analytics).{" "}
          <Link
            href="/ochrana-osobnich-udaju"
            className="font-medium text-emerald-600 hover:underline"
          >
            Ochrana osobních údajů
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => handleChoice("rejected")}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            Odmítnout
          </button>
          <button
            onClick={() => handleChoice("accepted")}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Přijmout vše
          </button>
        </div>
      </div>
    </div>
  );
}

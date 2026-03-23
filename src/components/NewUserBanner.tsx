"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Star, MapPinCheck, PlusCircle } from "lucide-react";

export function NewUserBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("onboarding-dismissed")) return;

    async function check() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        if (data.reviewCount === 0 && data.visitCount === 0) {
          setShow(true);
        }
      } catch {
        // not logged in or error — don't show
      }
    }
    check();
  }, []);

  if (!show) return null;

  function dismiss() {
    setShow(false);
    sessionStorage.setItem("onboarding-dismissed", "1");
  }

  return (
    <div className="border-b border-emerald-100 bg-emerald-50/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="font-semibold text-emerald-800">
            Nové tady? Zkus:
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900"
          >
            <Star className="h-3.5 w-3.5" />
            Napsat recenzi
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900"
          >
            <MapPinCheck className="h-3.5 w-3.5" />
            Označit návštěvu
          </Link>
          <Link
            href="/pridat-sportoviste"
            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Přidat sportoviště
          </Link>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded p-1 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800"
          aria-label="Zavřít"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

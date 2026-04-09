"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarCheck, LogIn, Heart, Star } from "lucide-react";
import { CheckInButton } from "./CheckInButton";

interface FacilityReviewCTAProps {
  facilityId: string;
  facilityName: string;
  sportSlug: string;
  slug: string;
  sportIcon: string;
  reviewCount: number;
}

type UserState = "loading" | "logged_out" | "has_review" | "has_checkin" | "logged_in";

export function FacilityReviewCTA({
  facilityId,
  facilityName,
  sportSlug,
  slug,
  sportIcon,
  reviewCount,
}: FacilityReviewCTAProps) {
  const [userState, setUserState] = useState<UserState>("loading");

  useEffect(() => {
    async function check() {
      try {
        const [meRes, visitRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch(`/api/facilities/${facilityId}/visit`),
        ]);

        if (!meRes.ok) {
          setUserState("logged_out");
          return;
        }

        if (visitRes.ok) {
          const data = await visitRes.json();
          if (data.hasReviewed) {
            setUserState("has_review");
          } else if (data.hasVisited) {
            setUserState("has_checkin");
          } else {
            setUserState("logged_in");
          }
        } else {
          setUserState("logged_in");
        }
      } catch {
        setUserState("logged_out");
      }
    }
    check();
  }, [facilityId]);

  if (userState === "loading") {
    return (
      <section className="border-t border-zinc-100 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-8">
          <div className="h-14 w-14 animate-pulse rounded-2xl bg-emerald-100" />
        </div>
      </section>
    );
  }

  const currentPath = `/sport/${sportSlug}/${slug}`;

  return (
    <section className="border-t border-zinc-100 bg-gradient-to-r from-emerald-50 to-teal-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:text-left">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
          {sportIcon}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-zinc-900">
            {userState === "logged_out" && "Přihlaste se a sdílejte svůj zážitek"}
            {userState === "logged_in" && reviewCount === 0 && `Buďte první, kdo ohodnotí ${facilityName}`}
            {userState === "logged_in" && reviewCount > 0 && "Byl/a jste tu? Napište recenzi"}
            {userState === "has_checkin" && `Navštívil/a jste ${facilityName} — jak to bylo?`}
            {userState === "has_review" && "Děkujeme za vaši recenzi!"}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {userState === "logged_out" &&
              "Přihlaste se a podělte se o svůj zážitek — pomůžete ostatním při výběru sportoviště."}
            {userState === "logged_in" && reviewCount === 0 &&
              "Zatím tu není žádná recenze. Vaše zkušenost pomůže ostatním."}
            {userState === "logged_in" && reviewCount > 0 &&
              "Podělte se o svůj zážitek — napište recenzi nebo se přihlaste jako návštěvník."}
            {userState === "has_checkin" &&
              "Napište krátkou recenzi a pomozte ostatním. Zabere to jen minutku."}
            {userState === "has_review" &&
              "Vaše recenze pomáhá ostatním. Označte užitečné recenze, které vám pomohly."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {userState === "logged_out" && (
            <Link
              href={`/prihlaseni?redirect=${encodeURIComponent(currentPath)}`}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <LogIn className="h-4 w-4" />
              Přihlásit se
            </Link>
          )}
          {userState === "has_review" && (
            <a
              href="#recenze"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-200"
            >
              <Heart className="h-4 w-4" />
              Zobrazit recenze
            </a>
          )}
          {(userState === "logged_in" || userState === "has_checkin") && (
            <>
              <CheckInButton facilityId={facilityId} currentPath={currentPath} facilityName={facilityName} />
              <a
                href="#recenze"
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                  userState === "has_checkin"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {userState === "has_checkin" ? (
                  <Star className="h-4 w-4" />
                ) : (
                  <CalendarCheck className="h-4 w-4" />
                )}
                Napsat recenzi
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

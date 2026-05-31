"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { SPORTS } from "@/lib/sports";

export function Footer() {
  const pathname = usePathname();
  const t = useTranslations("Footer");
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-zinc-100 bg-zinc-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <span className="text-lg font-extrabold text-zinc-900">
              hraju
              <span className="text-emerald-600">.cz</span>
            </span>
            <p className="mt-1 text-sm text-zinc-500">
              {t("tagline")}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-zinc-500">
            {SPORTS.map((sport) => (
              <Link
                key={sport.slug}
                href={`/sport/${sport.slug}`}
                className="hover:text-zinc-900"
              >
                {sport.icon} {sport.nameCs}
              </Link>
            ))}
          </div>
        </div>

        {/* Operator details */}
        <div className="mt-6 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-500">
          <p>
            {t("operator")}
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-400">
          <div className="flex gap-4">
            <Link
              href="/mesta"
              className="hover:text-zinc-600"
            >
              {t("cities")}
            </Link>
            <Link
              href="/odkazy"
              className="hover:text-zinc-600"
            >
              {t("links")}
            </Link>
            <Link
              href="/akce"
              className="hover:text-zinc-600"
            >
              {t("events")}
            </Link>
            <Link
              href="/pridat-sportoviste"
              className="hover:text-zinc-600"
            >
              {t("addFacility")}
            </Link>
            <Link
              href="/o-nas"
              className="hover:text-zinc-600"
            >
              {t("about")}
            </Link>
            <Link
              href="/kontakt"
              className="hover:text-zinc-600"
            >
              {t("contact")}
            </Link>
            <Link
              href="/podminky-pouziti"
              className="hover:text-zinc-600"
            >
              {t("terms")}
            </Link>
            <Link
              href="/ochrana-osobnich-udaju"
              className="hover:text-zinc-600"
            >
              {t("privacy")}
            </Link>
          </div>
          <span>
            {t("copyright", { year: new Date().getFullYear() })}
          </span>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SPORTS } from "@/lib/sports";

export function Footer() {
  const pathname = usePathname();
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
              Sportoviště v České republice
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
            Provozovatel: Silex, spol. s r.o. | IČ: 25058738
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-400">
          <div className="flex gap-4">
            <Link
              href="/kontakt"
              className="hover:text-zinc-600"
            >
              Kontakt
            </Link>
            <Link
              href="/ochrana-osobnich-udaju"
              className="hover:text-zinc-600"
            >
              Ochrana osobních údajů
            </Link>
          </div>
          <span>
            &copy; {new Date().getFullYear()} hraju.cz — Všechna práva
            vyhrazena
          </span>
        </div>
      </div>
    </footer>
  );
}

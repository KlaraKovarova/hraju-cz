import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import DelistForm from "@/components/DelistForm";

export const metadata: Metadata = {
  title: "Odhlásit sportoviště",
  description: "Požádejte o odebrání sportoviště z databáze hraju.cz.",
  robots: { index: false, follow: false },
};

export default function OdhlasitPage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Header */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-zinc-900"
          >
            hraju
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              .cz
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/ms-2026" className="font-semibold text-emerald-600 transition hover:text-emerald-700">⚽ MS 2026</Link>
            <Link
              href="/"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
            >
              Zpět na úvod
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Odhlásit sportoviště
        </h1>
        <p className="mt-2 text-zinc-500">
          Pokud si nepřejete, aby vaše sportoviště bylo uvedeno na hraju.cz,
          vyplňte prosím tento formulář. Vaši žádost zpracujeme v souladu s
          GDPR.
        </p>

        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-zinc-400">Načítání...</p>}>
            <DelistForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

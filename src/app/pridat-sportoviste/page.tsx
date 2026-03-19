import Link from "next/link";
import type { Metadata } from "next";
import AddListingForm from "@/components/AddListingForm";

export const metadata: Metadata = {
  title: "Přidat sportoviště",
  description:
    "Provozujete sportoviště? Přidejte ho zdarma do databáze hraju.cz a oslovte tisíce sportovců v České republice.",
};

export default function PridatSportoviStePage() {
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
          <Link
            href="/"
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
          >
            Zpět na úvod
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Přidat sportoviště
        </h1>
        <p className="mt-2 text-zinc-500">
          Provozujete sportoviště? Přidejte ho zdarma do naší databáze a
          oslovte tisíce sportovců po celé České republice.
        </p>

        <div className="mt-8">
          <AddListingForm />
        </div>
      </div>
    </main>
  );
}

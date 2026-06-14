import Link from "next/link";
import type { Metadata } from "next";
import AddEventForm from "@/components/AddEventForm";

export const metadata: Metadata = {
  title: "Přidat turistickou akci",
  description:
    "Pořádáte turistickou akci? Přidejte ji zdarma do kalendáře na hraju.cz.",
};

export default function PridatAkciPage() {
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
          Přidat turistickou akci
        </h1>
        <p className="mt-2 text-zinc-500">
          Pořádáte turistickou akci? Přidejte ji zdarma do našeho kalendáře a
          oslovte sportovce po celé České republice.
        </p>

        <div className="mt-8">
          <AddEventForm />
        </div>
      </div>
    </main>
  );
}

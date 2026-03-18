import Link from "next/link";
import { Check, X, Star } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ceník — hraju.cz",
  description:
    "Porovnejte zdarma a premium zápisy sportovišť na hraju.cz. Zvýrazněte své sportoviště a získejte více zákazníků.",
};

const features = [
  { name: "Základní zápis (název, adresa, sport)", free: true, premium: true },
  { name: "Popis a otevírací doba", free: true, premium: true },
  { name: "Ceník a vybavení", free: true, premium: true },
  { name: "Kontaktní údaje (po ověření)", free: true, premium: true },
  { name: "Zobrazení 1 fotografie", free: true, premium: true },
  { name: "Fotogalerie (neomezený počet fotek)", free: false, premium: true },
  { name: "Tlačítko pro rezervaci", free: false, premium: true },
  { name: "Zvýrazněná pozice ve výsledcích", free: false, premium: true },
  { name: "Premium odznak", free: false, premium: true },
  { name: "Vyšší priorita v mapách sítě (SEO)", free: false, premium: true },
];

export default function CenikPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-zinc-900">
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

      {/* Hero */}
      <section className="border-b border-zinc-100 bg-gradient-to-b from-zinc-50 to-white py-16 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
            Ceník pro sportoviště
          </h1>
          <p className="mt-4 text-lg text-zinc-500">
            Zvýrazněte své sportoviště a přilákejte více zákazníků.
            Porovnejte bezplatný a premium zápis.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Free Tier */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-8">
            <h2 className="text-xl font-bold text-zinc-900">Zdarma</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Základní zápis pro všechna sportoviště
            </p>
            <div className="mt-6">
              <span className="text-4xl font-extrabold text-zinc-900">0 Kč</span>
              <span className="text-sm text-zinc-500"> / měsíc</span>
            </div>
            <ul className="mt-8 space-y-3">
              {features.map((f) => (
                <li key={f.name} className="flex items-start gap-3 text-sm">
                  {f.free ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300" />
                  )}
                  <span className={f.free ? "text-zinc-700" : "text-zinc-400"}>
                    {f.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Tier */}
          <div className="relative rounded-2xl border-2 border-amber-300 bg-amber-50/30 p-8">
            <div className="absolute -top-3 left-6 flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              Premium
            </div>
            <h2 className="text-xl font-bold text-zinc-900">Premium</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Maximální viditelnost a funkce pro vaše sportoviště
            </p>
            <div className="mt-6">
              <span className="text-4xl font-extrabold text-zinc-900">499 Kč</span>
              <span className="text-sm text-zinc-500"> / měsíc</span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              nebo 3 990 Kč / rok (ušetříte 2 měsíce)
            </p>
            <ul className="mt-8 space-y-3">
              {features.map((f) => (
                <li key={f.name} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-zinc-700">{f.name}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/moje-sportoviste"
              className="mt-8 flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Aktivovat Premium
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ / CTA */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-16 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-2xl font-bold text-zinc-900">
            Máte otázky?
          </h2>
          <p className="mt-3 text-zinc-500">
            Rádi vám pomůžeme vybrat správný plán pro vaše sportoviště.
            Napište nám a ozveme se vám do 24 hodin.
          </p>
          <Link
            href="/kontakt"
            className="mt-6 inline-flex items-center rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:shadow-sm"
          >
            Napište nám
          </Link>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium záznam sportoviště | hraju.cz",
  description:
    "Získejte více zákazníků s Premium zápisem na hraju.cz. Zvýrazněný profil, fotogalerie, bez reklam konkurence a statistiky zobrazení.",
};

const features = [
  { name: "Základní záznam", free: true, premium: true },
  { name: "Kontaktní údaje", free: true, premium: true },
  { name: "Fotogalerie (až 10 fotek)", free: false, premium: true },
  { name: "Zvýraznění ve výsledcích", free: false, premium: true },
  { name: "Bez reklam na vašem záznamu", free: false, premium: true },
  { name: "Statistiky zobrazení", free: false, premium: true },
  { name: "Prioritní pozice ve vyhledávání", free: false, premium: true },
  { name: "Odkaz na rezervační systém", free: "Základní", premium: "Prominentní" },
];

const faqs = [
  {
    q: "Jak mohu upgradovat na Premium?",
    a: 'Nejprve si nárokujte svůj záznam na stránce "Moje sportoviště". Poté klikněte na tlačítko "Upgradovat na Premium" a dokončete platbu přes zabezpečenou platební bránu Stripe.',
  },
  {
    q: "Mohu Premium kdykoliv zrušit?",
    a: "Ano, předplatné můžete zrušit kdykoliv v zákaznickém portálu. Prémiové funkce zůstanou aktivní do konce fakturačního období.",
  },
  {
    q: "Co se stane po zrušení?",
    a: "Váš záznam se vrátí na bezplatnou verzi. Fotografie a data zůstanou zachovány, ale prémiové funkce jako zvýraznění a skrytí reklam se deaktivují.",
  },
  {
    q: "Jaké platební metody přijímáte?",
    a: "Přijímáme platební karty (Visa, Mastercard, Maestro) prostřednictvím zabezpečené platební brány Stripe.",
  },
];

export default function ProPage() {
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
      <section className="bg-gradient-to-b from-emerald-50 to-white px-6 py-16 text-center md:py-24">
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700">
            Premium záznam
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
            Získejte více zákazníků
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            Zvýrazněte své sportoviště, přidejte fotogalerii a získejte přednost ve
            vyhledávání. Bez reklam konkurence na vašem záznamu.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/moje-sportoviste"
              className="rounded-xl bg-emerald-600 px-8 py-3 text-base font-semibold text-white shadow-md transition hover:bg-emerald-700"
            >
              Začít zdarma
            </Link>
            <span className="text-sm text-zinc-500">
              29&nbsp;EUR / měsíc &middot; Zrušit kdykoliv
            </span>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-zinc-900">
            Porovnání plánů
          </h2>
          <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-3 font-medium text-zinc-600">Funkce</th>
                  <th className="px-4 py-3 text-center font-medium text-zinc-600">
                    Zdarma
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-emerald-700">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((f) => (
                  <tr key={f.name} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 text-zinc-700">{f.name}</td>
                    <td className="px-4 py-3 text-center">
                      {f.free === true ? (
                        <span className="text-emerald-600">&#10003;</span>
                      ) : f.free === false ? (
                        <span className="text-zinc-300">&mdash;</span>
                      ) : (
                        <span className="text-zinc-500">{f.free}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.premium === true ? (
                        <span className="font-semibold text-emerald-600">&#10003;</span>
                      ) : (
                        <span className="font-medium text-emerald-700">{f.premium}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-zinc-50 px-6 py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center md:flex-row md:justify-center md:text-left">
          <div>
            <p className="text-3xl font-bold text-zinc-900">6&nbsp;000+</p>
            <p className="text-sm text-zinc-500">sportovišť v databázi</p>
          </div>
          <div className="hidden h-10 w-px bg-zinc-200 md:block" />
          <div>
            <p className="text-3xl font-bold text-zinc-900">8</p>
            <p className="text-sm text-zinc-500">sportovních kategorií</p>
          </div>
          <div className="hidden h-10 w-px bg-zinc-200 md:block" />
          <div>
            <p className="text-3xl font-bold text-zinc-900">20+</p>
            <p className="text-sm text-zinc-500">měst v celé ČR</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-zinc-900">
            Časté dotazy
          </h2>
          <dl className="mt-8 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl border border-zinc-100 bg-zinc-50 p-5">
                <dt className="font-semibold text-zinc-900">{faq.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-emerald-600 px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Připraveni na více zákazníků?
          </h2>
          <p className="mt-3 text-emerald-100">
            Nárokujte si svůj záznam a aktivujte Premium za 29&nbsp;EUR měsíčně.
          </p>
          <Link
            href="/moje-sportoviste"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3 font-semibold text-emerald-700 shadow-md transition hover:bg-emerald-50"
          >
            Začít zdarma
          </Link>
        </div>
      </section>
    </main>
  );
}

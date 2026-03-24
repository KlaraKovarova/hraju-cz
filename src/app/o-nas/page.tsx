import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "O nás — hraju.cz",
  description:
    "Kdo stojí za hraju.cz? Jsme sportovní platforma, která pomáhá lidem najít sportoviště po celé České republice.",
};

export default function AboutPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hraju.cz", item: "https://www.hraju.cz" },
      { "@type": "ListItem", position: 2, name: "O nás", item: "https://www.hraju.cz/o-nas" },
    ],
  };

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
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

      <article className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
          O nás
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Sportovní platforma pro celou Českou republiku
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-700">
          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              Co je hraju.cz?
            </h2>
            <p className="mt-3">
              hraju.cz je sportovní platforma, která pomáhá lidem najít
              sportoviště v jejich okolí. Shromažďujeme informace o tenisových
              kurtech, squashových halách, badmintonových centrech, bazénech,
              fitness centrech, lezeckých stěnách, golfových hřištích,
              volejbalových halách a via ferratách po celé České republice.
            </p>
            <p className="mt-3">
              Naším cílem je vytvořit nejucelenější databázi sportovišť v ČR
              a zároveň budovat komunitu sportovců, kteří sdílejí své zkušenosti
              prostřednictvím recenzí a hodnocení.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              Naše poslání
            </h2>
            <p className="mt-3">
              Věříme, že sport a pohyb by měly být dostupné pro každého.
              Propojujeme sportovce s kvalitními sportovišti a pomáháme jim
              objevovat nová místa, kde si mohou zahrát svůj oblíbený sport.
              Zároveň poskytujeme provozovatelům sportovišť platformu, kde
              mohou být snadno nalezeni novými zákazníky.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              Co u nás najdete
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Databáze sportovišť</strong> — přes 4 700 záznamů v 9
                sportovních kategoriích po celé ČR
              </li>
              <li>
                <strong>Recenze a hodnocení</strong> — autentické recenze od
                uživatelů, kteří sportoviště skutečně navštívili
              </li>
              <li>
                <strong>Sportovní akce</strong> — přehled turistických a
                sportovních akcí ve vašem regionu
              </li>
              <li>
                <strong>Blog a průvodce</strong> — články, tipy a návody pro
                sportovní nadšence
              </li>
              <li>
                <strong>Kontaktní údaje</strong> — adresy, telefony, webové
                stránky a otevírací doby sportovišť
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              Kdo za tím stojí
            </h2>
            <p className="mt-3">
              hraju.cz provozuje společnost <strong>Silex, spol. s r.o.</strong>,
              se sídlem Za Poříčskou bránou 21, 186 00 Praha 8
              (IČ: 25058738). Web spravuje tým sportovních nadšenců,
              kteří sami aktivně sportují a rozumí potřebám české
              sportovní komunity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              Kontaktujte nás
            </h2>
            <p className="mt-3">
              Máte dotaz, nápad na zlepšení nebo chcete nahlásit nepřesnost?
              Neváhejte nás kontaktovat na{" "}
              <a
                href="mailto:klara@hraju.cz"
                className="text-emerald-600 hover:underline"
              >
                klara@hraju.cz
              </a>{" "}
              nebo navštivte naši{" "}
              <Link href="/kontakt" className="text-emerald-600 hover:underline">
                kontaktní stránku
              </Link>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-zinc-100 pt-6">
          <Link
            href="/"
            className="text-sm font-medium text-emerald-600 hover:underline"
          >
            &larr; Zpět na úvodní stránku
          </Link>
        </div>
      </article>
    </main>
  );
}

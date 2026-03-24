import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Podmínky použití — hraju.cz",
  description:
    "Podmínky použití webové stránky hraju.cz provozované společností Silex, spol. s r.o.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
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
          Podmínky použití
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Účinnost od 1. 1. 2024
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-700">
          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              I. Úvodní ustanovení
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Tyto podmínky použití (dále jen &bdquo;Podmínky&ldquo;)
                upravují práva a povinnosti při používání webové stránky
                hraju.cz (dále jen &bdquo;Web&ldquo;) provozované společností{" "}
                <strong>Silex, spol. s r.o.</strong>, Za Poříčskou bránou 21,
                186 00 Praha 8, IČ: 25058738 (dále jen
                &bdquo;Provozovatel&ldquo;).
              </li>
              <li>
                Používáním Webu vyjadřujete souhlas s těmito Podmínkami.
                Pokud s Podmínkami nesouhlasíte, Web nepoužívejte.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              II. Účel webu
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Web slouží jako informační platforma pro vyhledávání
                sportovišť v České republice. Obsahuje databázi sportovních
                zařízení, recenze uživatelů, sportovní akce a redakční
                obsah.
              </li>
              <li>
                Informace zveřejněné na Webu mají informativní charakter.
                Provozovatel nezaručuje úplnost, přesnost nebo aktuálnost
                údajů o jednotlivých sportovištích.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              III. Uživatelský obsah
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Uživatelé mohou na Web přidávat recenze, hodnocení a návrhy
                sportovišť. Zveřejněním obsahu udělujete Provozovateli
                nevýhradní, bezúplatnou licenci k jeho zobrazování na Webu.
              </li>
              <li>
                Uživatel se zavazuje, že jím vložený obsah:
                <ul className="mt-1 list-disc pl-5">
                  <li>je pravdivý a vychází z jeho vlastní zkušenosti,</li>
                  <li>neporušuje práva třetích osob,</li>
                  <li>neobsahuje vulgární, urážlivý nebo nezákonný obsah,</li>
                  <li>neobsahuje spam, reklamu nebo zavádějící informace.</li>
                </ul>
              </li>
              <li>
                Provozovatel si vyhrazuje právo odstranit obsah, který
                porušuje tyto Podmínky, bez předchozího upozornění.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              IV. Uživatelské účty
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Pro přidávání recenzí a některé další funkce je nutná
                registrace. Uživatel je povinen uvádět pravdivé údaje
                a chránit přístupové údaje ke svému účtu.
              </li>
              <li>
                Provozovatel si vyhrazuje právo zrušit účet uživatele,
                který opakovaně porušuje tyto Podmínky.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              V. Reklama a třetí strany
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Web může zobrazovat reklamu třetích stran, včetně reklam
                poskytovaných službou Google AdSense. Provozovatel neodpovídá
                za obsah reklamních sdělení třetích stran.
              </li>
              <li>
                Web může obsahovat odkazy na webové stránky třetích stran.
                Provozovatel neodpovídá za obsah ani dostupnost těchto
                stránek.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              VI. Omezení odpovědnosti
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Provozovatel neodpovídá za škody vzniklé v důsledku
                použití informací z Webu. Informace o sportovištích
                (otevírací doby, kontakty, ceny) mohou být neaktuální.
              </li>
              <li>
                Provozovatel neodpovídá za dočasnou nedostupnost Webu
                z důvodu údržby nebo technických problémů.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              VII. Duševní vlastnictví
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Veškerý obsah Webu (texty, grafika, loga, databáze) je
                chráněn autorským právem. Bez písemného souhlasu
                Provozovatele není dovoleno obsah kopírovat, šířit nebo
                jinak využívat nad rámec osobního užití.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              VIII. Závěrečná ustanovení
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Provozovatel si vyhrazuje právo tyto Podmínky kdykoliv
                změnit. Aktuální verze je vždy dostupná na této stránce.
              </li>
              <li>
                Tyto Podmínky se řídí právním řádem České republiky.
              </li>
              <li>
                V případě dotazů se obraťte na{" "}
                <a
                  href="mailto:klara@hraju.cz"
                  className="text-emerald-600 hover:underline"
                >
                  klara@hraju.cz
                </a>
                .
              </li>
            </ol>
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

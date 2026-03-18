import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ochrana osobních údajů — hraju.cz",
  description:
    "Zásady ochrany osobních údajů na webu hraju.cz provozovaném společností Silex, spol. s r.o.",
};

export default function PrivacyPolicyPage() {
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

      <article className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
          Ochrana osobních údajů
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Účinnost od 1. 1. 2022
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-700">
          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              I. Základní ustanovení
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Správcem osobních údajů podle čl. 4 bod 7 nařízení Evropského
                parlamentu a Rady (EU) 2016/679 o ochraně fyzických osob v
                souvislosti se zpracováním osobních údajů a o volném pohybu
                těchto údajů (dále jen: &bdquo;GDPR&ldquo;) je{" "}
                <strong>Silex, spol. s r.o.</strong>, Za Poříčskou bránou 21,
                186 00 Praha 8 (dále jen: &bdquo;správce&ldquo;).
              </li>
              <li>
                Kontaktní údaje správce:
                <ul className="mt-1 list-disc pl-5">
                  <li>Adresa: Za Poříčskou bránou 21, 186 00 Praha 8</li>
                  <li>
                    E-mail:{" "}
                    <a
                      href="mailto:klara@hraju.cz"
                      className="text-emerald-600 hover:underline"
                    >
                      klara@hraju.cz
                    </a>
                  </li>
                  <li>Telefon: +420 608 651 393</li>
                </ul>
              </li>
              <li>
                Osobními údaji se rozumí veškeré informace o identifikované nebo
                identifikovatelné fyzické osobě; identifikovatelnou fyzickou
                osobou je fyzická osoba, kterou lze přímo či nepřímo
                identifikovat, zejména odkazem na určitý identifikátor,
                například jméno, identifikační číslo, lokační údaje, síťový
                identifikátor nebo na jeden či více zvláštních prvků fyzické,
                fyziologické, genetické, psychické, ekonomické, kulturní nebo
                společenské identity této fyzické osoby.
              </li>
              <li>Správce nejmenoval pověřence pro ochranu osobních údajů.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              II. Zdroje a kategorie zpracovávaných osobních údajů
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Správce zpracovává osobní údaje, které jste mu poskytl/a nebo
                osobní údaje, které správce získal na základě plnění Vaší
                objednávky.
              </li>
              <li>
                Správce zpracovává Vaše identifikační a kontaktní údaje a údaje
                nezbytné pro plnění smlouvy.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              III. Zákonný důvod a účel zpracování osobních údajů
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Zákonným důvodem zpracování osobních údajů je:
                <ul className="mt-1 list-disc pl-5">
                  <li>
                    plnění smlouvy mezi Vámi a správcem podle čl. 6 odst. 1
                    písm. b) GDPR,
                  </li>
                  <li>
                    oprávněný zájem správce na poskytování přímého marketingu
                    (zejména pro zasílání obchodních sdělení a newsletterů)
                    podle čl. 6 odst. 1 písm. f) GDPR,
                  </li>
                  <li>
                    Váš souhlas se zpracováním pro účely poskytování přímého
                    marketingu (zejména pro zasílání obchodních sdělení a
                    newsletterů) podle čl. 6 odst. 1 písm. a) GDPR ve spojení
                    s § 7 odst. 2 zákona č. 480/2004 Sb., o některých službách
                    informační společnosti v případě, že nedošlo k objednávce
                    zboží nebo služby.
                  </li>
                </ul>
              </li>
              <li>
                Účelem zpracování osobních údajů je:
                <ul className="mt-1 list-disc pl-5">
                  <li>
                    vyřízení Vaší objednávky a výkon práv a povinností
                    vyplývajících ze smluvního vztahu mezi Vámi a správcem; při
                    objednávce jsou vyžadovány osobní údaje, které jsou nutné
                    pro úspěšné vyřízení objednávky (jméno a adresa, kontakt),
                    poskytnutí osobních údajů je nutným požadavkem pro uzavření a
                    plnění smlouvy, bez poskytnutí osobních údajů není možné
                    smlouvu uzavřít či jí ze strany správce plnit,
                  </li>
                  <li>
                    zasílání obchodních sdělení a činění dalších marketingových
                    aktivit.
                  </li>
                </ul>
              </li>
              <li>
                Ze strany správce nedochází k automatickému individuálnímu
                rozhodování ve smyslu čl. 22 GDPR.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              IV. Doba uchovávání údajů
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Správce uchovává osobní údaje:
                <ul className="mt-1 list-disc pl-5">
                  <li>
                    po dobu nezbytnou k výkonu práv a povinností vyplývajících
                    ze smluvního vztahu mezi Vámi a správcem a uplatňování nároků
                    z těchto smluvních vztahů (po dobu 15 let od ukončení
                    smluvního vztahu),
                  </li>
                  <li>
                    po dobu, než je odvolán souhlas se zpracováním osobních
                    údajů pro účely marketingu, nejdéle 5 let, jsou-li osobní
                    údaje zpracovávány na základě souhlasu.
                  </li>
                </ul>
              </li>
              <li>
                Po uplynutí doby uchovávání osobních údajů správce osobní údaje
                vymaže.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              V. Příjemci osobních údajů (subdodavatelé správce)
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Příjemci osobních údajů jsou osoby:
                <ul className="mt-1 list-disc pl-5">
                  <li>
                    podílející se na dodání zboží / služeb / realizaci plateb na
                    základě smlouvy,
                  </li>
                  <li>podílející se na zajištění provozu služeb,</li>
                  <li>zajišťující marketingové služby.</li>
                </ul>
              </li>
              <li>
                Správce nemá v úmyslu předat osobní údaje do třetí země (do země
                mimo EU) nebo mezinárodní organizaci. Příjemci osobních údajů ve
                třetích zemích jsou poskytovatelé mailingových služeb /
                cloudových služeb.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              VI. Vaše práva
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Za podmínek stanovených v GDPR máte:
                <ul className="mt-1 list-disc pl-5">
                  <li>právo na přístup ke svým osobním údajům dle čl. 15 GDPR,</li>
                  <li>
                    právo na opravu osobních údajů dle čl. 16 GDPR, popřípadě
                    omezení zpracování dle čl. 18 GDPR,
                  </li>
                  <li>právo na výmaz osobních údajů dle čl. 17 GDPR,</li>
                  <li>
                    právo vznést námitku proti zpracování dle čl. 21 GDPR,
                  </li>
                  <li>právo na přenositelnost údajů dle čl. 20 GDPR,</li>
                  <li>
                    právo odvolat souhlas se zpracováním písemně nebo
                    elektronicky na adresu nebo e-mail správce uvedený v čl. I
                    těchto podmínek.
                  </li>
                </ul>
              </li>
              <li>
                Dále máte právo podat stížnost u Úřadu pro ochranu osobních
                údajů v případě, že se domníváte, že bylo porušeno Vaše právo na
                ochranu osobních údajů.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              VII. Podmínky zabezpečení osobních údajů
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Správce prohlašuje, že přijal veškerá vhodná technická a
                organizační opatření k zabezpečení osobních údajů.
              </li>
              <li>
                Správce přijal technická opatření k zabezpečení datových úložišť
                a úložišť osobních údajů v listinné podobě.
              </li>
              <li>
                Správce prohlašuje, že k osobním údajům mají přístup pouze jím
                pověřené osoby.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              VIII. Závěrečná ustanovení
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Odesláním objednávky z internetového objednávkového formuláře
                potvrzujete, že jste seznámen/a s podmínkami ochrany osobních
                údajů a že je v celém rozsahu přijímáte.
              </li>
              <li>
                S těmito podmínkami souhlasíte zaškrtnutím souhlasu
                prostřednictvím internetového formuláře.
              </li>
              <li>
                Správce je oprávněn tyto podmínky změnit. Novou verzi podmínek
                ochrany osobních údajů zveřejní na svých internetových
                stránkách, případně Vám zašle novou verzi těchto podmínek na
                e-mailovou adresu, kterou jste správci poskytl/a.
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

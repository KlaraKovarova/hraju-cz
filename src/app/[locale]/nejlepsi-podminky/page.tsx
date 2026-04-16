import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Activity, Sparkles } from "lucide-react";
import { safeJsonLd } from "@/lib/seo";
import {
  buildItemListJsonLd,
  CURATION_EMPTY_STATE_MIN,
  getWeekendConditionsRanking,
  isoWeekLabel,
} from "@/lib/conditions-curation";
import { ConditionsRankingCard } from "@/components/ConditionsRankingCard";
import { AdSlot } from "@/components/AdSlot";

// SIL-656 — ISR 6h: stays fresh across the weekend without DB pressure.
export const revalidate = 21600;

const CANONICAL = "https://www.hraju.cz/nejlepsi-podminky";

export const metadata: Metadata = {
  title: "Nejlepší podmínky tento víkend — ferraty a lezení | hraju.cz",
  description:
    "Kam vyrazit tento víkend? Výběr ferrat a lezeckých oblastí s nejlepšími aktuálními reporty od komunity. Aktualizováno každých 6 hodin.",
  openGraph: {
    title: "Nejlepší podmínky tento víkend — ferraty a lezení",
    description:
      "Kam vyrazit tento víkend? Výběr ferrat a lezeckých oblastí s nejlepšími aktuálními reporty od komunity.",
    url: CANONICAL,
    type: "website",
    siteName: "hraju.cz",
    locale: "cs_CZ",
  },
  alternates: { canonical: CANONICAL },
};

export default async function NejlepsiPodminkyPage() {
  const rows = await getWeekendConditionsRanking();
  const { year, week } = isoWeekLabel();
  const itemListLd = rows.length ? buildItemListJsonLd(rows, "https://www.hraju.cz") : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hraju.cz", item: "https://www.hraju.cz" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Nejlepší podmínky tento víkend",
        item: CANONICAL,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      {itemListLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd) }}
        />
      )}

      {/* Breadcrumb */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Link href="/" className="font-extrabold text-zinc-900 hover:text-emerald-600">
              hraju<span className="text-emerald-600">.cz</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <span className="font-medium text-zinc-900">Nejlepší podmínky tento víkend</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Týden {week} / {year} · aktualizováno každých 6 hodin
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Kam vyrazit{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              tento víkend?
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-zinc-500">
            Výběr ferrat a lezeckých oblastí s nejlepšími aktuálními reporty od komunity.
            Seřazeno podle počtu pozitivních reportů za posledních 7 dní.
          </p>
        </div>
      </section>

      {/* Ad slot */}
      <div className="mx-auto max-w-6xl px-6 py-4">
        <AdSlot slot="3456789012" format="horizontal" />
      </div>

      {/* Ranking */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        {rows.length >= CURATION_EMPTY_STATE_MIN ? (
          <ol className="grid gap-4" aria-label="Žebříček sportovišť s nejlepšími podmínkami">
            {rows.map((row) => (
              <ConditionsRankingCard key={row.facility.id} row={row} />
            ))}
          </ol>
        ) : rows.length > 0 ? (
          <>
            <ol className="grid gap-4">
              {rows.map((row) => (
                <ConditionsRankingCard key={row.facility.id} row={row} />
              ))}
            </ol>
            <EmptyStateHint />
          </>
        ) : (
          <EmptyStateHint />
        )}
      </section>

      {/* Footer CTA / cross-links */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h2 className="text-lg font-bold text-zinc-900">Prozkoumejte dál</h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link
              href="/sport/ferraty"
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 font-medium text-zinc-700 hover:border-emerald-300 hover:text-emerald-700"
            >
              Všechny ferraty v ČR
            </Link>
            <Link
              href="/sport/lezeni"
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 font-medium text-zinc-700 hover:border-emerald-300 hover:text-emerald-700"
            >
              Lezecké oblasti a stěny
            </Link>
            <Link
              href="/komunita"
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 font-medium text-zinc-700 hover:border-emerald-300 hover:text-emerald-700"
            >
              Komunita hraju.cz
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function EmptyStateHint() {
  return (
    <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 text-center">
      <Activity className="mx-auto h-8 w-8 text-emerald-500" aria-hidden />
      <h2 className="mt-3 text-lg font-semibold text-zinc-900">
        Zatím málo reportů — buďte první kdo se podělí!
      </h2>
      <p className="mt-2 text-sm text-zinc-600">
        Tento týden zatím nemáme dost čerstvých reportů pro plný žebříček. Navštivte
        oblíbenou ferratu nebo lezeckou oblast a přidejte report — pomůžete ostatním naplánovat víkend.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link
          href="/sport/ferraty"
          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Prohlédnout ferraty
        </Link>
        <Link
          href="/sport/lezeni"
          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:border-emerald-400"
        >
          Prohlédnout lezení
        </Link>
      </div>
    </div>
  );
}

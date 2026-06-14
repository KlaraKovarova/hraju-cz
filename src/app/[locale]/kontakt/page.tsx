import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";
import { safeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Kontakt — hraju.cz",
  description:
    "Kontaktujte tým hraju.cz. Napište nám e-mail nebo použijte kontaktní formulář.",
};

export default function KontaktPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hraju.cz", item: "https://www.hraju.cz" },
      { "@type": "ListItem", position: 2, name: "Kontakt", item: "https://www.hraju.cz/kontakt" },
    ],
  };

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      {/* Header */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-zinc-900">
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

      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Kontakt
        </h1>
        <p className="mt-2 text-zinc-500">
          Máte dotaz, nápad nebo chcete nahlásit chybu? Napište nám.
        </p>

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          {/* Contact info + photo */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <Image
              src="/klara-headset.jpg"
              alt="Klára Kovářová"
              width={200}
              height={200}
              className="rounded-full object-cover"
            />
            <h2 className="mt-6 text-xl font-semibold text-zinc-900">
              Klára Kovářová
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Váš kontakt pro hraju.cz
            </p>
            <div className="mt-4 space-y-2 text-sm text-zinc-600">
              <p>
                <a
                  href="mailto:klara@hraju.cz"
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  klara@hraju.cz
                </a>
              </p>
              <p>
                <a
                  href="tel:+420608651393"
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  +420 608 651 393
                </a>
              </p>
            </div>

            <div className="mt-8 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-xs text-zinc-500">
              <p className="font-medium text-zinc-700">Provozovatel</p>
              <p className="mt-1">Silex, spol. s r.o.</p>
              <p>IČ: 25058738</p>
              <p>Za Poříčskou bránou 365/21, 186 00 Praha 8</p>
            </div>
          </div>

          {/* Contact form */}
          <ContactForm />
        </div>
      </div>
    </main>
  );
}

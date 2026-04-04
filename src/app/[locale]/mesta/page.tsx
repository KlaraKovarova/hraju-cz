import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ChevronRight, Building2 } from "lucide-react";
import { getTopCitiesOverallForMesto, getTotalFacilityCount } from "@/lib/data";

export const metadata: Metadata = {
  title: "Města se sportovišti",
  description:
    "Přehled měst s nejvíce sportovišti v České republice. Najděte sportoviště ve svém městě — tenis, squash, badminton, plavání a další.",
  openGraph: {
    title: "Města se sportovišti | hraju.cz",
    description:
      "Přehled měst s nejvíce sportovišti v České republice.",
    url: "https://www.hraju.cz/mesta",
    siteName: "hraju.cz",
    type: "website",
  },
  alternates: {
    canonical: "https://www.hraju.cz/mesta",
  },
};

export default async function MestaIndexPage() {
  const cities = await getTopCitiesOverallForMesto(100);
  const totalFacilities = getTotalFacilityCount();

  // BreadcrumbList JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hraju.cz", item: "https://www.hraju.cz" },
      { "@type": "ListItem", position: 2, name: "Města", item: "https://www.hraju.cz/mesta" },
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Breadcrumb Header */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <Link
              href="/"
              className="font-extrabold text-zinc-900 hover:text-emerald-600"
            >
              hraju
              <span className="text-emerald-600">.cz</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <span className="font-medium text-zinc-900">Města</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-zinc-100 bg-gradient-to-br from-emerald-50 to-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
              <Building2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                Města se sportovišti
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-zinc-500">
                <MapPin className="h-4 w-4" />
                {totalFacilities} sportovišť v {cities.length} městech
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* City Grid */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {cities.map((city) => (
            <Link
              key={city.citySlug}
              href={`/mesto/${city.citySlug}`}
              className="group flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-5 py-4 transition hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50"
            >
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-zinc-900 group-hover:text-emerald-600">
                  {city.city}
                </h2>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {city.facilityCount} sportovišť
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 group-hover:text-emerald-500" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, BookOpen, MapPin, Star, Users } from "lucide-react";
import { getSportBySlug, SPORTS } from "@/lib/sports";
import { getRegionBySlug } from "@/lib/regions";
import { getGuideDefinitions } from "@/lib/guides";
import { getSportFacilityTypePluralGenitive } from "@/lib/seo";
import type { Metadata } from "next";

// ISR: revalidate guide index every 7 days (static content)
export const revalidate = 604800;

export function generateStaticParams() {
  return SPORTS.map((s) => ({ sport: s.slug }));
}

interface GuideIndexProps {
  params: Promise<{ sport: string }>;
}

export async function generateMetadata({ params }: GuideIndexProps): Promise<Metadata> {
  const { sport: sportSlug } = await params;
  const sport = getSportBySlug(sportSlug);
  if (!sport) return {};

  const facilityType = getSportFacilityTypePluralGenitive(sportSlug);
  const title = `Průvodce — ${sport.nameCs} | hraju.cz`;
  const description = `Průvodce ${facilityType} v České republice. Nejlepší sportoviště podle kraje, hodnocení a typu — vše na jednom místě.`;
  const url = `https://www.hraju.cz/pruvodce/${sportSlug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "hraju.cz",
      locale: "cs_CZ",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `Průvodce ${sport.nameCs} — hraju.cz` }],
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: url },
  };
}

const GUIDE_TYPE_ICON: Record<string, typeof Star> = {
  "top-v-kraji": MapPin,
  "nejlepe-hodnocene": Star,
  "pro-zacatecniky": Users,
};

const GUIDE_TYPE_COLOR: Record<string, string> = {
  "top-v-kraji": "bg-blue-50 text-blue-700 border-blue-100",
  "nejlepe-hodnocene": "bg-amber-50 text-amber-700 border-amber-100",
  "pro-zacatecniky": "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export default async function GuideIndexPage({ params }: GuideIndexProps) {
  const { sport: sportSlug } = await params;
  const sport = getSportBySlug(sportSlug);
  if (!sport) notFound();

  const guides = getGuideDefinitions(sportSlug);
  const facilityType = getSportFacilityTypePluralGenitive(sportSlug);

  // Group guides by type
  const regionGuides = guides.filter((g) => g.type === "top-v-kraji");
  const nationalGuides = guides.filter((g) => g.type !== "top-v-kraji");

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domů", item: "https://www.hraju.cz" },
      { "@type": "ListItem", position: 2, name: sport.nameCs, item: `https://www.hraju.cz/sport/${sportSlug}` },
      { "@type": "ListItem", position: 3, name: "Průvodce" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-700">Domů</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/sport/${sportSlug}`} className="hover:text-zinc-700">{sport.nameCs}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-zinc-900 font-medium">Průvodce</span>
        </nav>

        {/* Hero */}
        <div className={`rounded-2xl bg-gradient-to-br ${sport.gradient} p-8 text-white mb-10`}>
          <div className="flex items-center gap-3">
            <BookOpen className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Průvodce — {sport.nameCs}
              </h1>
              <p className="mt-1 text-white/80">
                Přehled nejlepších {facilityType} v České republice — podle kraje, hodnocení a typu.
              </p>
            </div>
          </div>
        </div>

        {/* National guides */}
        {nationalGuides.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-bold text-zinc-900">Celostátní průvodce</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nationalGuides.map((guide) => {
                const Icon = GUIDE_TYPE_ICON[guide.type] ?? BookOpen;
                const colorClass = GUIDE_TYPE_COLOR[guide.type] ?? "bg-zinc-50 text-zinc-700 border-zinc-100";
                return (
                  <Link
                    key={guide.slug}
                    href={`/pruvodce/${sportSlug}/${guide.slug}`}
                    className={`flex items-center gap-3 rounded-xl border p-5 transition-shadow hover:shadow-md ${colorClass}`}
                  >
                    <Icon className="h-6 w-6 shrink-0" />
                    <span className="font-semibold">{guide.title(sport.nameCs)}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Regional guides */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-zinc-900">
            Nejlepší {sport.nameCs.toLowerCase()} podle kraje
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {regionGuides.map((guide) => {
              const region = guide.regionSlug ? getRegionBySlug(guide.regionSlug) : null;
              return (
                <Link
                  key={guide.slug}
                  href={`/pruvodce/${sportSlug}/${guide.slug}`}
                  className="flex items-center gap-2.5 rounded-lg border border-zinc-100 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-all hover:border-zinc-200 hover:shadow-sm hover:text-zinc-900"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
                  {region?.name ?? guide.slug}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Other sports */}
        <section className="mt-12 border-t border-zinc-100 pt-8">
          <h2 className="mb-4 text-lg font-bold text-zinc-900">Průvodce dalšími sporty</h2>
          <div className="flex flex-wrap gap-3">
            {SPORTS.filter((s) => s.slug !== sportSlug).map((s) => (
              <Link
                key={s.slug}
                href={`/pruvodce/${s.slug}`}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
              >
                <span>{s.icon}</span>
                {s.nameCs}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

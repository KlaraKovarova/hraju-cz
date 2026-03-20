import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ExternalLink, LinkIcon } from "lucide-react";
import { SPORTS, getSportBySlug } from "@/lib/sports";
import { SPORT_LINKS, LINK_CATEGORIES, type LinkCategory } from "@/lib/links";

export const metadata: Metadata = {
  title: "Užitečné odkazy ke sportům",
  description:
    "Užitečné odkazy ke sportům v České republice — asociace, pravidla, turnaje a kalendáře akcí pro tenis, squash, badminton, volejbal, plavání, golf a fitness.",
  openGraph: {
    title: "Užitečné odkazy ke sportům | hraju.cz",
    description:
      "Užitečné odkazy ke sportům v České republice — asociace, pravidla, turnaje a kalendáře akcí.",
    url: "https://www.hraju.cz/odkazy",
    siteName: "hraju.cz",
    type: "website",
  },
  alternates: {
    canonical: "https://www.hraju.cz/odkazy",
  },
};

const CATEGORY_ORDER: LinkCategory[] = [
  "associations",
  "rules",
  "tournaments",
  "events",
  "other",
];

export default function OdkazyPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "hraju.cz",
        item: "https://www.hraju.cz",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Užitečné odkazy",
        item: "https://www.hraju.cz/odkazy",
      },
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
            <span className="font-medium text-zinc-900">Užitečné odkazy</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-zinc-100 bg-gradient-to-br from-emerald-50 to-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
              <LinkIcon className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                Užitečné odkazy ke sportům
              </h1>
              <p className="mt-1 text-zinc-500">
                Asociace, pravidla, turnaje a další zdroje pro {SPORTS.length}{" "}
                sportů
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sport Sections */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-10">
          {SPORT_LINKS.map((group) => {
            const sport = getSportBySlug(group.sportSlug);
            if (!sport) return null;

            const linksByCategory = new Map<LinkCategory, typeof group.links>();
            for (const link of group.links) {
              const existing = linksByCategory.get(link.category) || [];
              existing.push(link);
              linksByCategory.set(link.category, existing);
            }

            return (
              <div key={group.sportSlug}>
                {/* Sport Header */}
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${sport.lightBg}`}
                  >
                    <span className="text-xl">{sport.icon}</span>
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    {sport.nameCs}
                  </h2>
                  <Link
                    href={`/sport/${sport.slug}`}
                    className={`ml-auto text-sm ${sport.accent} hover:underline`}
                  >
                    Sportoviště
                  </Link>
                </div>

                {/* Links by category */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {CATEGORY_ORDER.filter((cat) =>
                    linksByCategory.has(cat)
                  ).flatMap((cat) =>
                    linksByCategory.get(cat)!.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group flex flex-col rounded-xl border bg-white p-4 transition hover:shadow-md ${sport.borderColor} hover:shadow-${sport.color}-50`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-semibold text-zinc-900 group-hover:${sport.accent.replace("text-", "")}`}>
                            {link.title}
                          </h3>
                          <ExternalLink className="h-4 w-4 shrink-0 text-zinc-300 group-hover:text-zinc-500" />
                        </div>
                        <p className="mt-1 text-sm text-zinc-500">
                          {link.description}
                        </p>
                        <span
                          className={`mt-3 inline-block self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${sport.lightBg} ${sport.accent}`}
                        >
                          {LINK_CATEGORIES[link.category]}
                        </span>
                      </a>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

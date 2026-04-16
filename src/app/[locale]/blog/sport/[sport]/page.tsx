import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Calendar, Tag } from "lucide-react";
import { getPostsBySport, CATEGORIES } from "@/lib/blog";
import { getSportBySlug, SPORTS } from "@/lib/sports";
import { safeJsonLd } from "@/lib/seo";
import type { Metadata } from "next";

interface SportBlogPageProps {
  params: Promise<{ sport: string }>;
}

export async function generateStaticParams() {
  return SPORTS.map((s) => ({ sport: s.slug }));
}

export async function generateMetadata({
  params,
}: SportBlogPageProps): Promise<Metadata> {
  const { sport: sportSlug } = await params;
  const sport = getSportBySlug(sportSlug);
  if (!sport) return {};

  return {
    title: `${sport.nameCs} — Blog — hraju.cz`,
    description: `Články o sportu ${sport.nameCs.toLowerCase()} na hraju.cz. Tipy, průvodce a novinky.`,
    alternates: { canonical: `https://www.hraju.cz/blog/sport/${sportSlug}` },
  };
}

export default async function SportBlogPage({ params }: SportBlogPageProps) {
  const { sport: sportSlug } = await params;
  const sport = getSportBySlug(sportSlug);

  if (!sport) {
    notFound();
  }

  const posts = getPostsBySport(sportSlug);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hraju.cz", item: "https://www.hraju.cz" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.hraju.cz/blog" },
      { "@type": "ListItem", position: 3, name: sport.nameCs, item: `https://www.hraju.cz/blog/sport/${sportSlug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Link
              href="/"
              className="font-extrabold text-zinc-900 hover:text-emerald-600"
            >
              hraju
              <span className="text-emerald-600">.cz</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <Link href="/blog" className="hover:text-zinc-900">
              Blog
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <span className="font-medium text-zinc-900">
              {sport.icon} {sport.nameCs}
            </span>
          </div>
        </div>
      </nav>

      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            {sport.icon} {sport.nameCs}
          </h1>
          <p className="mt-2 text-zinc-500">
            {posts.length}{" "}
            {posts.length === 1
              ? "článek"
              : posts.length >= 2 && posts.length <= 4
                ? "články"
                : "článků"}{" "}
            o sportu {sport.nameCs.toLowerCase()}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        {posts.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Pro tento sport zatím nejsou žádné články. Brzy přidáme nový obsah!
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block"
              >
                <article className="h-full overflow-hidden rounded-2xl border border-zinc-100 bg-white transition hover:border-zinc-200 hover:shadow-md">
                  {post.image && (
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.date).toLocaleDateString("cs-CZ", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                        {CATEGORIES[post.category] || post.category}
                      </span>
                    </div>
                    <h2 className="mt-2 font-bold text-zinc-900 group-hover:text-emerald-700">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Link back to sport page */}
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <Link
          href={`/sport/${sportSlug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          &larr; Zpět na {sport.nameCs.toLowerCase()}
        </Link>
      </section>
    </main>
  );
}

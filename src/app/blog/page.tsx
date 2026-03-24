import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Calendar, Tag } from "lucide-react";
import { getAllPosts, CATEGORIES } from "@/lib/blog";
import { AdSlot } from "@/components/AdSlot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — hraju.cz",
  description:
    "Průvodce sporty v Česku. Tipy kam na tenis, squash, badminton a další sporty. Recenze sportovišť a průvodce po městech.",
  openGraph: {
    title: "Blog — hraju.cz",
    description:
      "Průvodce sporty v Česku. Tipy kam na tenis, squash, badminton a další sporty.",
    url: "https://www.hraju.cz/blog",
    type: "website",
    siteName: "hraju.cz",
    locale: "cs_CZ",
  },
  alternates: { canonical: "https://www.hraju.cz/blog" },
};

export default function BlogIndex() {
  const posts = getAllPosts();
  const [featuredPost, ...gridPosts] = posts;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hraju.cz", item: "https://www.hraju.cz" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.hraju.cz/blog" },
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {/* Header */}
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
            <span className="font-medium text-zinc-900">Blog</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Blog
          </h1>
          <p className="mt-2 text-zinc-500">
            Průvodce sporty, tipy na sportoviště a novinky ze světa sportu v
            Česku.
          </p>

          {/* Category pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(CATEGORIES).map(([slug, label]) => (
              <Link
                key={slug}
                href={`/blog/kategorie/${slug}`}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        {posts.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Zatím žádné články.
          </p>
        ) : (
          <div className="space-y-8">
            {/* Featured post — large hero card */}
            {featuredPost && (
              <Link href={`/blog/${featuredPost.slug}`} className="group block">
                <article className="overflow-hidden rounded-2xl border border-zinc-100 bg-white transition hover:border-zinc-200 hover:shadow-md md:grid md:grid-cols-2">
                  {featuredPost.image && (
                    <div className="relative aspect-[16/9] w-full md:aspect-auto md:min-h-[320px]">
                      <Image
                        src={featuredPost.image}
                        alt={featuredPost.title}
                        fill
                        priority
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-center p-6 md:p-8">
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(featuredPost.date).toLocaleDateString(
                          "cs-CZ",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </span>
                      {CATEGORIES[featuredPost.category] && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                          <Tag className="h-3 w-3" />
                          {CATEGORIES[featuredPost.category]}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-3 text-xl font-bold text-zinc-900 group-hover:text-emerald-700 md:text-2xl">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                        {featuredPost.excerpt}
                      </p>
                    )}
                    <span className="mt-4 inline-block text-sm font-semibold text-emerald-600">
                      Číst dále &rarr;
                    </span>
                  </div>
                </article>
              </Link>
            )}

            {/* Ad: between featured and grid */}
            <div className="py-2">
              <AdSlot slot="5678901234" format="horizontal" />
            </div>

            {/* Grid of remaining posts */}
            {gridPosts.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gridPosts.map((post) => (
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
                          {CATEGORIES[post.category] && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                              {CATEGORIES[post.category]}
                            </span>
                          )}
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
          </div>
        )}
      </section>
    </main>
  );
}

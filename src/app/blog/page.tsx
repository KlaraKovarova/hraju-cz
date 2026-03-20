import Link from "next/link";
import { ChevronRight, Calendar, Tag } from "lucide-react";
import { getAllPosts, CATEGORIES } from "@/lib/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — hraju.cz",
  description:
    "Průvodce sporty v Česku. Tipy kam na tenis, squash, padel a další sporty. Recenze sportovišť a průvodce po městech.",
  openGraph: {
    title: "Blog — hraju.cz",
    description:
      "Průvodce sporty v Česku. Tipy kam na tenis, squash, padel a další sporty.",
    url: "https://hraju.cz/blog",
    type: "website",
    siteName: "hraju.cz",
    locale: "cs_CZ",
  },
  alternates: { canonical: "https://hraju.cz/blog" },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-zinc-50/50">
      {/* Header */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center px-6 py-4">
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
        <div className="mx-auto max-w-4xl px-6 py-10">
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
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-emerald-200 hover:text-emerald-700"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Post Grid */}
      <section className="mx-auto max-w-4xl px-6 py-8">
        {posts.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Zatím žádné články.
          </p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="rounded-2xl border border-zinc-100 bg-white p-6 transition hover:border-zinc-200 hover:shadow-sm"
              >
                <Link href={`/blog/${post.slug}`}>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.date).toLocaleDateString("cs-CZ", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    {CATEGORIES[post.category] && (
                      <Link
                        href={`/blog/kategorie/${post.category}`}
                        className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 hover:bg-emerald-100"
                      >
                        <Tag className="h-3 w-3" />
                        {CATEGORIES[post.category]}
                      </Link>
                    )}
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-zinc-900 hover:text-emerald-700">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                      {post.excerpt}
                    </p>
                  )}
                  <span className="mt-3 inline-block text-sm font-semibold text-emerald-600">
                    Číst dále &rarr;
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

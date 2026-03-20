import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Calendar, Tag } from "lucide-react";
import { getPostsByCategory, CATEGORIES } from "@/lib/blog";
import type { Metadata } from "next";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((c) => ({ category: c }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const label = CATEGORIES[category];
  if (!label) return {};

  return {
    title: `${label} — Blog — hraju.cz`,
    description: `Články v kategorii ${label} na hraju.cz`,
    alternates: { canonical: `https://hraju.cz/blog/kategorie/${category}` },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const label = CATEGORIES[category];

  if (!label) {
    notFound();
  }

  const posts = getPostsByCategory(category);

  return (
    <main className="min-h-screen bg-zinc-50/50">
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
            <Link href="/blog" className="hover:text-zinc-900">
              Blog
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <span className="font-medium text-zinc-900">{label}</span>
          </div>
        </div>
      </nav>

      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            {label}
          </h1>
          <p className="mt-2 text-zinc-500">
            {posts.length}{" "}
            {posts.length === 1
              ? "článek"
              : posts.length >= 2 && posts.length <= 4
                ? "články"
                : "článků"}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-8">
        {posts.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            V této kategorii zatím nejsou žádné články.
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
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                      <Tag className="h-3 w-3" />
                      {label}
                    </span>
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

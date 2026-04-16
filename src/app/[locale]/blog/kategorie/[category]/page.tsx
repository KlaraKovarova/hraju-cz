import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Calendar, Tag } from "lucide-react";
import { getPostsByCategory, CATEGORIES } from "@/lib/blog";
import { safeJsonLd } from "@/lib/seo";
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
    alternates: { canonical: `https://www.hraju.cz/blog/kategorie/${category}` },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const label = CATEGORIES[category];

  if (!label) {
    notFound();
  }

  const posts = getPostsByCategory(category);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hraju.cz", item: "https://www.hraju.cz" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.hraju.cz/blog" },
      { "@type": "ListItem", position: 3, name: label, item: `https://www.hraju.cz/blog/kategorie/${category}` },
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
            <span className="font-medium text-zinc-900">{label}</span>
          </div>
        </div>
      </nav>

      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
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

      <section className="mx-auto max-w-6xl px-6 py-8">
        {posts.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            V této kategorii zatím nejsou žádné články.
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
                        {label}
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
    </main>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Calendar, Tag, ArrowLeft } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPostBySlug, getAllPosts, CATEGORIES } from "@/lib/blog";
import type { Metadata } from "next";

export const revalidate = 3600;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const url = `https://www.hraju.cz/blog/${slug}`;
  const ogImages = post.image
    ? [{ url: `https://www.hraju.cz${post.image}`, width: 1200, height: 675 }]
    : undefined;
  return {
    title: `${post.title} — hraju.cz`,
    description: post.excerpt || post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      url,
      type: "article",
      siteName: "hraju.cz",
      locale: "cs_CZ",
      publishedTime: post.date,
      authors: ["Klára Kovářová"],
      images: ogImages,
    },
    twitter: { card: "summary_large_image", images: ogImages },
    alternates: { canonical: url },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const allPosts = getAllPosts();
  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug)
    .slice(0, 3);

  // Article JSON-LD
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    ...(post.image && { image: `https://www.hraju.cz${post.image}` }),
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: "Klára Kovářová",
      url: "https://www.hraju.cz",
    },
    publisher: {
      "@type": "Organization",
      name: "hraju.cz",
      url: "https://www.hraju.cz",
    },
    mainEntityOfPage: `https://www.hraju.cz/blog/${slug}`,
  };

  // BreadcrumbList JSON-LD
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
        name: "Blog",
        item: "https://www.hraju.cz/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://www.hraju.cz/blog/${slug}`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Header */}
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
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
            <span className="truncate font-medium text-zinc-900">
              {post.title}
            </span>
          </div>
        </div>
      </nav>

      {/* Hero image */}
      {post.image && (
        <div className="relative mx-auto aspect-[21/9] max-w-6xl">
          <Image
            src={post.image}
            alt={post.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1152px"
          />
        </div>
      )}

      {/* Article */}
      <article className="mx-auto max-w-3xl px-6 py-10">
        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(post.date).toLocaleDateString("cs-CZ", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          {CATEGORIES[post.category] && (
            <Link
              href={`/blog/kategorie/${post.category}`}
              className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              <Tag className="h-3 w-3" />
              {CATEGORIES[post.category]}
            </Link>
          )}
        </div>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 lg:text-4xl">
          {post.title}
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Autor: Klára Kovářová
        </p>

        {/* Body */}
        <div className="prose prose-zinc mt-8 max-w-none prose-headings:font-bold prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline">
          <Markdown remarkPlugins={[remarkGfm]}>{post.body}</Markdown>
        </div>

        {/* Sport tags */}
        {post.sportTags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-zinc-100 pt-6">
            {post.sportTags.map((tag) => (
              <Link
                key={tag}
                href={`/sport/${tag}`}
                className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600 transition hover:bg-zinc-200"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="mt-8 border-t border-zinc-100 pt-6">
          <Link
            href="/blog"
            className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Zpět na blog
          </Link>
        </div>
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-zinc-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Další články
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {relatedPosts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white transition hover:border-zinc-200 hover:shadow-md"
                >
                  {p.image && (
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-5">
                  <p className="font-bold text-zinc-900 group-hover:text-emerald-700">
                    {p.title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {new Date(p.date).toLocaleDateString("cs-CZ", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

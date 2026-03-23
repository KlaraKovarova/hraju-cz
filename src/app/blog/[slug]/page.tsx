import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Calendar, Tag, ArrowLeft } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPostBySlug, getAllPosts, getPostsBySport, CATEGORIES } from "@/lib/blog";
import { getTopFacilitiesBySport } from "@/lib/data";
import { getSportBySlug } from "@/lib/sports";
import { ShareButton } from "@/components/ShareButton";
import { BlogReviewCTA } from "@/components/BlogReviewCTA";
import { AdSlot } from "@/components/AdSlot";
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

  // Prefer related posts with matching sport tags, then fill with newest
  const sameTagPosts = allPosts.filter(
    (p) => p.slug !== slug && p.sportTags.some((t) => post.sportTags.includes(t))
  );
  const otherPosts = allPosts.filter(
    (p) => p.slug !== slug && !sameTagPosts.includes(p)
  );
  const relatedPosts = [...sameTagPosts, ...otherPosts].slice(0, 3);

  // Fetch top facilities for the post's sport tags (max 6 total)
  const facilityResults = await Promise.all(
    post.sportTags.slice(0, 2).map((tag) => getTopFacilitiesBySport(tag, 3))
  );
  const relatedFacilities = facilityResults.flat().slice(0, 6);

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
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ children, ...props }) => (
                <div className="table-wrapper">
                  <table {...props}>{children}</table>
                </div>
              ),
            }}
          >
            {post.body}
          </Markdown>
        </div>

        {/* Ad: after article body */}
        <div className="my-8">
          <AdSlot slot="3456789012" format="horizontal" />
        </div>

        {/* Review CTA */}
        <BlogReviewCTA sportTags={post.sportTags} />

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

        {/* Related Facilities */}
        {relatedFacilities.length > 0 && (
          <div className="mt-8 border-t border-zinc-100 pt-6">
            <h2 className="mb-4 text-lg font-bold text-zinc-900">
              Kam vyrazit
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relatedFacilities.map((f) => {
                const fSport = f.sports[0]?.sport;
                const sportInfo = fSport ? getSportBySlug(fSport.slug) : null;
                return (
                  <Link
                    key={f.id}
                    href={`/sport/${fSport?.slug ?? post.sportTags[0]}/${f.slug}`}
                    className="group flex items-center gap-3 rounded-xl border border-zinc-100 bg-white p-3 transition hover:border-zinc-200 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-lg">
                      {sportInfo?.icon ?? "🏟️"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">
                        {f.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {f.location.city}
                        {fSport && ` · ${fSport.nameCs}`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
            {post.sportTags[0] && (
              <p className="mt-3 text-right">
                <Link
                  href={`/sport/${post.sportTags[0]}`}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Zobrazit všechna sportoviště &rarr;
                </Link>
              </p>
            )}
          </div>
        )}

        {/* Social sharing */}
        <div className="mt-8 border-t border-zinc-100 pt-6">
          <p className="mb-3 text-sm font-semibold text-zinc-500">
            Sdílejte s přáteli
          </p>
          <div className="flex flex-wrap gap-3">
            <ShareButton
              title={post.title}
              url={`https://www.hraju.cz/blog/${slug}`}
            />
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://www.hraju.cz/blog/${slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-blue-200 hover:shadow-sm"
            >
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://www.hraju.cz/blog/${slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:shadow-sm"
            >
              <svg className="h-5 w-5 text-zinc-900" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X
            </a>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6 border-t border-zinc-100 pt-6">
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
